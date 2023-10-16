import type { Peer, DataConnection, MediaConnection } from "peerjs";
import humanid from "human-id";
import deb from "lodash/debounce";
import _pb from "pretty-bytes";
import NoSleep from "nosleep.js";
import { create } from "udp-rpc-bridge";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

export type State = {
  selfId: string;
  peerId: string;
  msg: string;
  isPeerTyping: boolean;
  selectMediaVariant: "requestor" | "grantor";
  status:
    | "enter-self-id"
    | "connecting-self"
    | "awaiting-peer"
    | "connecting-peer"
    | "connected"
    | "select-media"
    | "calling-peer"
    | "call-connected";
  msgs: {
    senderId: string;
    createdAt: number;
    msg: string;
    fileKey?: string;
    fileName?: string;
  }[];
  files: {
    [id: string]: {
      left: number;
      right: number;
      file: File | null;
    };
  };
  fileProgress: {
    [id: string]: { percent: number; msg: string; updatedAt: number };
  };
};

export type Lpcs = {
  setSelfId: (e: { target: { value: string } }) => void;
  setPeerId: (e: { target: { value: string } }) => void;
  setMsg: (e: { target: { value: string } }) => void;
  publishToBroker: (onOpen?: () => unknown) => Promise<void>;
  connectPeer: () => void;
  sendMsg: () => void;
  dispose: () => void;
  backToPeerSelection: () => void;
  autoConnectToPeer: (peerIs: string) => void;
  sendFile: (f: File) => Promise<void>;
  downloadFile: (k: string) => void;
  getFile: (k: string) => File | undefined;
  requestCall: () => void;
  connectCall: (m: MediaStream | undefined) => void;
  endCall: () => void;
  setFileProgress: (id: string) => void;
  backToSelfIdSelection: () => void;
};

export type RPCs = {
  keepAlive: () => Promise<void>;
  endCall: () => Promise<void>;
  onPeerType: () => Promise<void>;
  onMsg: (e: State["msgs"][number]) => Promise<void>;
  getChunk: (arg: {
    id: string;
    left: number;
    right: number;
  }) => Promise<
    { status: 200; data: ArrayBuffer } | { status: 400 } | { status: 404 }
  >;
  putFileMetadata: (metadata: {
    id: string;
    name: string;
    bytes: number;
  }) => Promise<{ status: 200 } | { status: 429 }>;
};

const getInitState = (): State => ({
  selfId: humanid(" ").toLowerCase(),
  peerId: "",
  msg: "",
  msgs: [],
  status: "enter-self-id",
  isPeerTyping: false,
  selectMediaVariant: "requestor",
  files: {},
  fileProgress: {},
});

const chunkSize = 1024 * 64;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * passing in t directly creates new references
 * this is problematic when t is reassigned
 * instead use a getter
 */
const withGetAwaitedTruthy =
  <T>(getT: () => T) =>
  async (): Promise<T> => {
    if (getT()) return getT();
    await sleep(200);
    if (getT()) return getT();
    await sleep(1000);
    if (getT()) return getT();
    await sleep(2000);
    return getT();
  };

const pb = (b: number) => {
  return _pb(b, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

let _peer: Peer | undefined;
let _noSleep: NoSleep | undefined;
let _dataCon: DataConnection | undefined;
let _selfMediaStream: MediaStream | undefined;
let _peerMediaStream: MediaStream | undefined;
let _peerMediaCon: MediaConnection | undefined;

const getPeerJs = async () => {
  const PeerJs = (await import("peerjs")).default;
  return PeerJs;
};

const getNoSleep = () => {
  if (!_noSleep) {
    _noSleep = new NoSleep();
  }
  return _noSleep!;
};

const getPeer = () => {
  if (!_peer) {
    throw new Error(
      "peer not initialized, your public id has not been published to the connection broker"
    );
  }
  return _peer;
};

export const getSelfMediaStream = withGetAwaitedTruthy(() => _selfMediaStream);
export const getPeerMediaStream = withGetAwaitedTruthy(() => _peerMediaStream);

const disposeVideo = () => {
  _selfMediaStream?.getTracks().forEach((t) => t.stop());
  _peerMediaStream?.getTracks().forEach((t) => t.stop());
  _peerMediaCon?.close();
};

let disposeTimeout: undefined | NodeJS.Timeout;
const keepAlive = () => clearInterval(disposeTimeout);
const scheduleDispose = () => {
  keepAlive();
  disposeTimeout = setTimeout(() => {
    disposeVideo();
    connectionStore.lpc.backToPeerSelection();
  }, 2000);
};

const onPeerType = deb(() => {
  connectionStore.set({ isPeerTyping: false });
}, 10000);

const omitted = new Set("1234567890-=[];'\\,./`!@#$%^&*()_+|\":?><~".split(""));

const cleanId = (s: string) => {
  return s
    .toLowerCase()
    .split("")
    .map((c) => (omitted.has(c) ? "" : c))
    .join("")
    .replace(/\s+/g, " ");
};

const addListeners = (peerCon: MediaConnection) => {
  const endCall = () => connectionStore.lpc.endCall();
  peerCon.on("error", endCall);
  peerCon.on("close", endCall);
  peerCon.on("iceStateChanged", (s) => {
    if (s === "closed" || s === "failed") {
      endCall();
    }
  });
  peerCon.on("stream", (peerMediaStream) => {
    _peerMediaStream = peerMediaStream;
    connectionStore.set({ status: "call-connected" });
  });
};

export const constants = {
  skipSelfIdSelectKey: "skipSelfIdSelectKey"
}

export const connectionStore = create<RPCs, State, Lpcs>(
  ({ get, set, lpc, rpc, pipe }) => ({
    state: getInitState(),
    lpcs: {
      backToSelfIdSelection: () => {
        localStorage.removeItem(constants.skipSelfIdSelectKey)
        window.location.reload();
      },
      autoConnectToPeer: (peerId) => {
        set({
          ...getInitState(),
          peerId,
        });

        lpc.publishToBroker(() => {
          lpc.connectPeer();
        });
      },
      dispose: () => {
        lpc.endCall();
        set(getInitState());
      },
      backToPeerSelection: () => {
        disposeVideo();
        _dataCon?.close();
        set({ peerId: "", status: "awaiting-peer", msg: "", msgs: [] });
      },
      setSelfId: (e) => set({ selfId: cleanId(e.target.value) }),
      setPeerId: (e) => set({ peerId: cleanId(e.target.value) }),
      setMsg: (e) => {
        set({ msg: e.target.value });
        rpc.onPeerType();
      },
      publishToBroker: async (onOpen) => {
        const selfId = get().selfId.trim();
        set({ selfId });
        if (!selfId) {
          return;
        }

        set({ status: "connecting-self" });

        const PeerJs = await getPeerJs();
        _peer = new PeerJs(selfId);

        const callEnder = () => {
          if (document.visibilityState === "hidden") {
            if (get().status === "call-connected") {
              lpc.endCall();
              lpc.backToPeerSelection();
            }
          }
        };

        const dispose = (cause: string) => () => {
          disposeVideo();
          _dataCon?.close();
          set(getInitState());
        };

        window.addEventListener("visibilitychange", callEnder);
        window.addEventListener("pagehide", callEnder);
        document.addEventListener(
          "click",
          function enableNoSleep() {
            document.removeEventListener("click", enableNoSleep, false);
            getNoSleep().enable();
          },
          false
        );

        _peer.on("disconnected", dispose("disconnected"));
        _peer.on("close", dispose("close"));
        _peer.on("error", dispose("error"));
        _peer.on("open", () => {
          set({ status: "awaiting-peer" });
          onOpen?.();
        });

        _peer.on("connection", (c) => {
          pipe.send = (e) => c.send(e);
          _dataCon = c;
          _dataCon.on("close", () => lpc.backToPeerSelection());
          _dataCon.on("error", () => lpc.backToPeerSelection());
          _dataCon.on("iceStateChanged", (s) => {
            if (s === "closed" || s === "failed") {
              lpc.backToPeerSelection();
            }
          });
          _dataCon.on("data", (data) => {
            keepAlive();
            pipe.receive(data);
          });
          set({ status: "connected", peerId: c.peer });
        });
        _peer.on("call", (call) => {
          _peerMediaCon = call;
          addListeners(_peerMediaCon);
          set({ status: "select-media", selectMediaVariant: "grantor" });
        });
      },
      connectPeer: () => {
        const peerId = get().peerId.trim();
        set({ peerId });
        if (!peerId) {
          return;
        }

        set({ status: "connecting-peer" });

        // reliable means if a message is dropped, it will lock further messages in the pipe
        // while it is being retried
        _dataCon = getPeer().connect(peerId, { reliable: false });
        pipe.send = (e) => _dataCon!.send(e);

        _dataCon.on("open", () => {
          set({ status: "connected" });
        });
        _dataCon.on("error", () => lpc.backToPeerSelection());
        _dataCon.on("close", () => lpc.backToPeerSelection());
        _dataCon.on("data", (data) => {
          keepAlive();
          pipe.receive(data);
        });
        _dataCon.on("iceStateChanged", (s) => {
          if (s === "closed" || s === "failed") {
            lpc.backToPeerSelection();
          }
        });
      },
      sendMsg: () => {
        const { msg, selfId, peerId } = get();
        const e = {
          senderId: selfId,
          createdAt: Date.now(),
          msg,
        };

        if (!msg) return;

        set((p) => ({ msg: "", msgs: [...p.msgs, e] }));
        scheduleDispose();
        rpc.onMsg(e);
      },
      sendFile: async (file: File) => {
        if (
          // 300MB
          file.size > 314572800 &&
          !window.confirm("The file is to large, and it may fail. Continue?")
        ) {
          return;
        }
        const now = Date.now();
        const senderId = get().selfId;
        const id = senderId + now;
        get().files[id] = {
          left: 0,
          right: file.size,
          file,
        };
        scheduleDispose();
        const msg = {
          senderId,
          fileKey: id,
          msg: file.name,
          createdAt: now,
          fileName: file.name,
        };
        set((p) => ({
          msgs: [...p.msgs, msg],
        }));
        await rpc.onMsg(msg);
        const res = await rpc.putFileMetadata({
          id,
          bytes: file.size,
          name: file.name,
        });
        if (res.status === 200) {
          get().files[id].left = get().files[id].right;
          lpc.setFileProgress(id);
        }
      },
      downloadFile: (k: string) => {
        const { files } = get();
        const file = files[k];
        if (!file || !file.file) {
          alert("file not found");
          return;
        }

        if (file.left !== file.right) {
          alert("file still downloading");
          return;
        }

        const url = window.URL.createObjectURL(file.file);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = file.file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      },
      getFile: (k: string) => {
        const { files } = get();
        const file = files[k];
        if (!file || !file.file) {
          alert("file not found");
          return;
        }

        if (file.left !== file.right) {
          alert("file still downloading");
          return;
        }

        if (!file.file) {
          alert("no file");
        }

        return file.file;
      },
      requestCall: () => {
        set({ status: "select-media", selectMediaVariant: "requestor" });
      },
      connectCall: (ms) => {
        const { peerId, selectMediaVariant } = get();

        if (!peerId) {
          throw new Error("cant connect to peer without id");
        }
        if (!ms) {
          lpc.endCall();
          return;
        }

        _selfMediaStream = ms;

        if (selectMediaVariant === "requestor") {
          set({ status: "calling-peer" });
          _peerMediaCon = getPeer().call(peerId, ms);
          addListeners(_peerMediaCon);
          return;
        }

        if (selectMediaVariant === "grantor") {
          if (!_peerMediaCon) {
            lpc.endCall();
            return;
          }
          _peerMediaCon.answer(ms);
          return;
        }
      },
      endCall: () => {
        disposeVideo();
        rpc.endCall();
        set({ status: "connected" });
      },
      setFileProgress: (id) => {
        const meta = get().files[id];
        if (!meta) return;
        const lastUpdated = get().fileProgress[id]?.updatedAt ?? 0;
        const percent = meta.left / meta.right;
        if (percent !== 1 && Date.now() - lastUpdated < 200) return;
        const msg = `${pb(meta.left)} / ${pb(meta.right)}`;
        set((prev) => ({
          fileProgress: {
            ...prev.fileProgress,
            [id]: { percent, msg, updatedAt: Date.now() },
          },
        }));
      },
    },
    rpcs: {
      getChunk: ({ id, left, right }) => {
        return new Promise((resolve) => {
          const f = get().files[id];
          if (!f || !f.file) {
            resolve({ status: 404 });
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            const chunk = e?.target?.result;
            if (!chunk) {
              resolve({ status: 400 });
            }
            // assuming there is only one peer that reads in order
            f.left = left;
            lpc.setFileProgress(id);
            resolve({ status: 200, data: chunk as ArrayBuffer });
          };
          reader.readAsArrayBuffer(f.file!.slice(left, right));
        });
      },
      putFileMetadata: async ({ id, bytes, name }) => {
        const f = {
          left: 0,
          right: bytes,
          file: null as null | File,
        };
        get().files[id] = f;
        lpc.setFileProgress(id);
        let retryCount = 0;
        const chunks: ArrayBuffer[] = [];
        while (f.left !== f.right) {
          if (retryCount > 30) {
            return { status: 429 };
          }
          const until = Math.min(f.left + chunkSize, f.right);
          const res = await rpc.getChunk({ id, left: f.left, right: until });
          if (res.status !== 200) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }
          f.left = until;
          chunks.push(res.data);
          if (f.left === f.right) {
            f.file = new File(chunks, name);
          }
          lpc.setFileProgress(id);
        }
        return { status: 200 };
      },
      keepAlive: async () => {},
      endCall: async () => {
        disposeVideo();
        set({ status: "connected" });
      },
      onPeerType: async () => {
        connectionStore.set({ isPeerTyping: true });
        onPeerType();
      },
      onMsg: async (ev) => {
        onPeerType.flush();
        set((p) => ({
          msgs: [...p.msgs, ev],
        }));
      },
    },
  })
);

export const useStore = <T>(selector: (state: State) => T) => {
  return useSyncExternalStoreWithSelector(
    connectionStore.sub as any,
    connectionStore.get,
    connectionStore.get,
    selector
  );
};
