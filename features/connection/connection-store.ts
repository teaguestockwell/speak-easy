import type { Peer, DataConnection, MediaConnection } from "peerjs";
import humanid from "human-id";
import deb from "lodash/debounce";
import throttle from "lodash/throttle";
import { chunkFile } from "./chunk-file";
import _pb from "pretty-bytes";
import NoSleep from "nosleep.js";
import { create } from "udp-rpc-bridge";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

const withRetry = (
  operation: () => Promise<void> | void,
  condition: () => boolean,
  timeout = 15000
) => {
  let ms = 500;
  let waited = 0;
  return async () => {
    while (waited < timeout) {
      if (condition()) {
        return;
      }
      await operation();
      await new Promise((res) => setTimeout(res, ms));
      waited += ms;
      ms *= 2;
    }
    throw new Error("timeout exceeded for: " + operation.name);
  };
};

const pb = (b: number) => {
  return _pb(b, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

type TextEvent = {
  senderId: string;
  createdAt: number;
  msg: string;
};

export type FileEvent = TextEvent & {
  fileKey: string;
  fileName: string;
  chunk: ArrayBuffer;
  chunkIndex: number;
  totalBytes: number;
  totalChunks: number;
};
export type MsgEvent = FileEvent | TextEvent;

type RPC =
  | {
      rpc: "acknowledge-chunk";
      fileKey: string;
      chunkIndexReceived: number;
      bytesReceived: number;
    }
  | {
      rpc: "on-peer-type";
    }
  | {
      rpc: "keep-alive";
    }
  | {
      rpc: "end-call";
    };

const blobs: {
  [k: string]: {
    meta: Omit<FileEvent, "chunk" | "chunkIndex">;
    chunks: Record<number, ArrayBuffer>;
    unReceivedChunkIndexes: Set<number>;
    receivedBytes: number;
    getNextChunk: () => { ab: ArrayBuffer; i: number } | void;
  };
} = {};

type State = {
  selfId: string;
  peerId: string;
  msg: string;
  msgs: MsgEvent[];
  status:
    | "enter-self-id"
    | "connecting-self"
    | "awaiting-peer"
    | "connecting-peer"
    | "connected"
    | "select-media"
    | "calling-peer"
    | "call-connected";
  isPeerTyping: boolean;
  prog: { [fileKey: string]: { msg: string; isDone: boolean } };
  selectMediaVariant: "requestor" | "grantor";
};

const getInitState = (): State => ({
  selfId: humanid(" ").toLowerCase(),
  peerId: "",
  msg: "",
  msgs: [],
  status: "enter-self-id",
  isPeerTyping: false,
  prog: {},
  selectMediaVariant: "requestor",
});

type Lpcs = {
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
  requestCall: () => void;
  connectCall: (m: MediaStream | undefined) => void;
  endCall: () => void;
};

type RPCs = {
  keepAlive: () => Promise<{}>;
  endCall: () => Promise<{}>;
  onPeerType: () => Promise<{}>;
  acknowledgeChunk: (e: {
    fileKey: string;
    chunkIndexReceived: number;
    bytesReceived: number;
  }) => Promise<{}>;
  onFile: (e: FileEvent) => Promise<{}>;
  onMsg: (e: MsgEvent) => Promise<{}>;
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

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const getSelfMediaStream = async () => {
  if (_selfMediaStream) {
    return _selfMediaStream;
  }
  await sleep(200);
  if (_selfMediaStream) {
    return _selfMediaStream;
  }
  await sleep(1000);
  if (_selfMediaStream) {
    return _selfMediaStream;
  }
  await sleep(2000);
  return _selfMediaStream;
};

export const getPeerMediaStream = async () => {
  if (_peerMediaStream) {
    return _peerMediaStream;
  }
  await sleep(200);
  if (_peerMediaStream) {
    return _peerMediaStream;
  }
  await sleep(1000);
  if (_peerMediaStream) {
    return _peerMediaStream;
  }
  await sleep(2000);
  return _peerMediaStream;
};

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
    connectionStore.lpc.backToPeerSelection(undefined);
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

// dont call this with the final progress event because it may be discarded
const throttledProgress = throttle(
  (k: string, received: number, total: number) => {
    connectionStore.set((p) => ({
      prog: {
        ...p.prog,
        [k]: {
          msg: `${pb(received)} / ${pb(total)}`,
          isDone: false,
        },
      },
    }));
  }
);

const updateProgress = (k: string) => {
  const received = blobs[k].receivedBytes;
  const total = blobs[k].meta.totalBytes;
  if (received !== total) {
    throttledProgress(k, received, total);
    return;
  }
  connectionStore.set((p) => ({
    prog: {
      ...p.prog,
      [k]: {
        msg: `${pb(received)} / ${pb(total)}`,
        isDone: true,
      },
    },
  }));
};

const addListeners = (peerCon: MediaConnection) => {
  const endCall = () => connectionStore.lpc.endCall(undefined);
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

export const connectionStore = create<RPCs, State, Lpcs>(
  ({ get, set, lpc, rpc, pipe }) => ({
    state: getInitState(),
    lpcs: {
      autoConnectToPeer: (peerId) => {
        set({
          ...getInitState(),
          peerId,
        });

        lpc.publishToBroker(() => {
          lpc.connectPeer(undefined);
        });
      },
      dispose: () => {
        lpc.endCall(undefined);
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
        rpc.onPeerType(undefined);
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
              lpc.endCall(undefined);
              lpc.backToPeerSelection(undefined);
            }
          }
        };

        const dispose = (cause: string) => () => {
          // console.log("dispose peer", cause);
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
          _dataCon.on("close", () => lpc.backToPeerSelection(undefined));
          _dataCon.on("error", () => lpc.backToPeerSelection(undefined));
          _dataCon.on("iceStateChanged", (s) => {
            if (s === "closed" || s === "failed") {
              lpc.backToPeerSelection(undefined);
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
        _dataCon.on("error", () => lpc.backToPeerSelection(undefined));
        _dataCon.on("close", () => lpc.backToPeerSelection(undefined));
        _dataCon.on("data", (data) => {
          keepAlive();
          pipe.receive(data);
        });
        _dataCon.on("iceStateChanged", (s) => {
          if (s === "closed" || s === "failed") {
            lpc.backToPeerSelection(undefined);
          }
        });
      },
      sendMsg: () => {
        const { msg, selfId, peerId } = get();
        const e: MsgEvent = {
          senderId: selfId,
          createdAt: Date.now(),
          msg,
        };

        if (!msg) return;

        set((p) => ({ msg: "", msgs: [...p.msgs, e] }));
        scheduleDispose();
        rpc.onMsg(e);
      },
      sendFile: async (f: File) => {
        if (
          // 300MB
          f.size > 314572800 &&
          !window.confirm("The file is to large, and it may fail. Continue?")
        ) {
          return;
        }

        const now = Date.now();
        const senderId = get().selfId;
        const fileKey = senderId + now;
        const unReceivedChunkIndexes = new Set<number>();
        const chunks = (await chunkFile(f)).reduce((acc, ab, i) => {
          acc[i] = ab;
          unReceivedChunkIndexes.add(i);
          return acc;
        }, {} as Record<number, ArrayBuffer>);
        const getNextChunk = () => {
          const i = unReceivedChunkIndexes.values().next().value;
          const res = { ab: chunks[i], i };
          return res.ab ? res : undefined;
        };
        blobs[fileKey] = {
          chunks,
          receivedBytes: 0,
          getNextChunk,
          unReceivedChunkIndexes,
          meta: {
            senderId,
            fileKey,
            msg: f.name,
            createdAt: now,
            fileName: f.name,
            totalBytes: f.size,
            totalChunks: unReceivedChunkIndexes.size,
          },
        };

        // only send the first chunk, then wait for the peer to acknowledge
        // otherwise you may break the data connection
        // because your peer is trying to drink water from a firehose
        const e: FileEvent = {
          ...blobs[fileKey].meta,
          chunkIndex: 0,
          chunk: chunks[0],
        };
        scheduleDispose();
        rpc.onFile(e);
        set((p) => ({
          msgs: [...p.msgs, blobs[fileKey].meta],
          prog: {
            ...p.prog,
            [fileKey]: {
              msg: `0 / ${pb(f.size)}`,
              isDone: chunks[0].byteLength === f.size,
            },
          },
        }));
      },
      downloadFile: (k: string) => {
        const { meta, chunks, receivedBytes } = blobs[k];
        if (!meta.fileName) {
          alert("file not found");
          return;
        }

        if (receivedBytes !== meta.totalBytes) {
          alert("file still downloading");
          return;
        }

        // without a reliable (serial) data connection, dropped packets may have to be retried out of order
        // the advantage of an un ordered packet retry is that it is non blocking
        const sortedChunks = Object.entries(chunks)
          .sort((a, z) => +a[0] - +z[0])
          .map(([i, ab]) => ab);
        const url = window.URL.createObjectURL(new Blob(sortedChunks));
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = meta.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
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
          lpc.endCall(undefined);
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
            lpc.endCall(undefined);
            return;
          }
          _peerMediaCon.answer(ms);
          return;
        }
      },
      endCall: () => {
        disposeVideo();
        rpc.endCall(undefined);
        set({ status: "connected" });
      },
    },
    rpcs: {
      keepAlive: async () => {
        return {};
      },
      endCall: async () => {
        disposeVideo();
        set({ status: "connected" });
        return {};
      },
      onPeerType: async () => {
        connectionStore.set({ isPeerTyping: true });
        onPeerType();
        return {};
      },
      acknowledgeChunk: async (ev) => {
        const b = blobs[ev.fileKey];
        if (!b) {
          alert("missing chunks for file " + ev.fileKey);
          return {};
        }
        b.unReceivedChunkIndexes.delete(ev.chunkIndexReceived);
        b.receivedBytes = ev.bytesReceived;
        updateProgress(ev.fileKey);
        const nextChunk = b.getNextChunk();
        if (!nextChunk) {
          return {};
        }
        const e: FileEvent = {
          ...b.meta,
          chunkIndex: nextChunk.i,
          chunk: nextChunk.ab,
        };
        rpc.onFile(e);

        const condition = () => b.unReceivedChunkIndexes.has(e.chunkIndex);
        const operation = async () => {
          await rpc.onFile(e);
        };
        const send = withRetry(operation, condition);
        send().catch(() => console.log("failed to send chunk", e));
        return {};
      },
      onFile: async (ev) => {
        const acknowledgeChunk = () => {
          rpc.acknowledgeChunk({
            chunkIndexReceived: ev.chunkIndex,
            fileKey: ev.fileKey,
            bytesReceived: blobs[ev.fileKey].receivedBytes,
          });
        };
        // first chunk
        if (!blobs[ev.fileKey]) {
          const { chunk, chunkIndex, ...rest } = ev;
          const meta = rest;
          const chunks = { [chunkIndex]: chunk };

          blobs[ev.fileKey] = {
            meta,
            chunks,
            unReceivedChunkIndexes: (() => {
              const res = new Set<number>();
              for (let i = 0; i < ev.totalChunks; i++) {
                res.add(i);
              }
              res.delete(ev.chunkIndex);
              return res;
            })(),
            // the recipient will never know what chunks its missing, thats up to the sender
            getNextChunk: () => {},
            receivedBytes: chunk.byteLength,
          };

          set((p) => ({
            msgs: [...p.msgs, blobs[ev.fileKey!].meta],
            prog: {
              ...p.prog,
              [ev.fileKey!]: {
                msg: `${pb(ev.chunk?.byteLength ?? 0)} / ${pb(
                  ev.totalBytes ?? 0
                )}`,
                isDone: ev.chunk?.byteLength === ev.totalBytes,
              },
            },
          }));

          acknowledgeChunk();
          return {};
        }

        // next chunk
        blobs[ev.fileKey].chunks[ev.chunkIndex] = ev.chunk;
        blobs[ev.fileKey].unReceivedChunkIndexes.delete(ev.chunkIndex);
        const chunksReceived =
          ev.totalChunks - blobs[ev.fileKey].unReceivedChunkIndexes.size;
        const apxReceivedSize =
          chunksReceived * blobs[ev.fileKey].chunks[0].byteLength;
        blobs[ev.fileKey].receivedBytes = Math.min(
          apxReceivedSize,
          ev.totalBytes
        );
        updateProgress(ev.fileKey);
        acknowledgeChunk();
        return {};
      },
      onMsg: async (ev) => {
        set((p) => ({
          msgs: [...p.msgs, ev],
        }));
        return {};
      },
    },
  })
);

export const useStore = <T>(
  selector: (state: State) => T
) => {
  return useSyncExternalStoreWithSelector(
    connectionStore.sub as any,
    connectionStore.get,
    connectionStore.get,
    selector,
  )
};
