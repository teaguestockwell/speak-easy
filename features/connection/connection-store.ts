import create from "zustand";
import type { Peer, DataConnection, MediaConnection } from "peerjs";
import humanid from "human-id";
import deb from "lodash/debounce";
import { chunkFile } from "./chunk-file";
import pb from "pretty-bytes";

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
};
export type MsgEvent = FileEvent | TextEvent;

type RPC =
  | {
      rpc: "acknowledge-chunk";
      fileKey: string;
      chunkIndexReceived: number;
    }
  | {
      rpc: "on-peer-type";
    }
  | {
      rpc: "start-ping";
    }
  | {
      rpc: "end-call";
    };

const isRpc = (e: any): e is RPC => !!e && typeof e === "object" && "rpc" in e;
const isFileEvent = (e: any): e is FileEvent =>
  !!e && typeof e === "object" && "fileKey" in e;
const isMsgEvent = (e: any): e is MsgEvent =>
  !!e && typeof e === "object" && "msg" in e;

const blobs: {
  [k: string]: {
    meta: Omit<FileEvent, "chunk">;
    chunks: ArrayBuffer[];
    getTotalChunksSize: () => number;
  };
} = {};

export type ConnectionState = {
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
    | "calling-peer"
    | "call-connected";
  isPeerTyping: boolean;
  prog: { [fileKey: string]: { msg: string; isDone: boolean } };
};

const getInitState = (): ConnectionState => ({
  selfId: humanid(" ").toLowerCase(),
  peerId: "",
  msg: "",
  msgs: [],
  status: "enter-self-id",
  isPeerTyping: false,
  prog: {},
});

export type ConnectionActions = {
  setSelfId: (e: { target: { value: string } }) => void;
  setPeerId: (e: { target: { value: string } }) => void;
  setMsg: (e: { target: { value: string } }) => void;
  publishToBroker: (onOpen?: () => unknown) => Promise<void>;
  connectPeer: () => void;
  emit: () => void;
  receive: (e: any) => void;
  callPeer: () => void;
  endCall: () => void;
  dispose: () => void;
  backToPeerSelection: () => void;
  autoConnectToPeer: (peerIs: string) => void;
  sendFile: (f: File) => Promise<void>;
  downloadFile: (k: string) => void;
};

let _peer: Peer | undefined;
let _dataCon: DataConnection | undefined;
let _selfMediaStream: MediaStream | undefined;
let _peerMediaStream: MediaStream | undefined;
let _peerMediaCon: MediaConnection | undefined;

const getPeerJs = async () => {
  const PeerJs = (await import("peerjs")).default;
  return PeerJs;
};

const getPeer = () => {
  if (!_peer) {
    throw new Error(
      "peer not initialized, your public id has not been published to the connection broker"
    );
  }
  return _peer;
};

const getDataConn = () => {
  if (!_dataCon) {
    throw new Error(
      "data connection not initialized, you are not connected to a peer"
    );
  }
  return _dataCon;
};

const createSelfMediaStream = async () => {
  try {
    _selfMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    return _selfMediaStream;
  } catch (e) {
    alert("cant find audio video device");
    return;
  }
};

export const getSelfMediaStream = () => {
  if (!_selfMediaStream) {
    throw new Error(
      "media stream not initialized, you are not in a call with a peer"
    );
  }
  return _selfMediaStream;
};

export const getPeerMediaStream = () => {
  if (!_peerMediaStream) {
    throw new Error(
      "media stream not initialized, you are not in a call with a peer"
    );
  }
  return _peerMediaStream;
};

const disposeVideo = () => {
  _selfMediaStream?.getTracks().forEach((t) => t.stop());
  _peerMediaStream?.getTracks().forEach((t) => t.stop());
  _peerMediaCon?.close();
};

const disposeSession = () => {
  disposeVideo();
  connectionStore.getState().backToPeerSelection();
};

const onPing = deb(disposeSession, 5000);

let stopPing: undefined | (() => void);
const startPinging = () => {
  stopPing?.();
  const i = setInterval(() => {
    const e: RPC = { rpc: "start-ping" };
    _dataCon?.send(e);
  }, 3000);
  stopPing = () => {
    clearInterval(i);
  };
};

const onPeerType = deb(() => {
  connectionStore.setState({ isPeerTyping: false });
}, 5000);

const omitted = new Set("1234567890-=[];'\\,./`!@#$%^&*()_+|\":?><~".split(""));

const cleanId = (s: string) => {
  return s
    .toLowerCase()
    .split("")
    .map((c) => (omitted.has(c) ? "" : c))
    .join("")
    .replace(/\s+/g, " ");
};

export const connectionStore = create<ConnectionState & ConnectionActions>(
  (set, get) => ({
    ...getInitState(),
    autoConnectToPeer: (peerId) => {
      set({
        ...getInitState(),
        peerId,
      });

      get().publishToBroker(() => {
        get().connectPeer();
      });
    },
    dispose: () => {
      get().endCall();
      set(getInitState());
    },
    backToPeerSelection: () => {
      stopPing?.();
      disposeVideo();
      _dataCon?.close();
      set({ peerId: "", status: "awaiting-peer", msg: "", msgs: [] });
    },
    setSelfId: (e) => set({ selfId: cleanId(e.target.value) }),
    setPeerId: (e) => set({ peerId: cleanId(e.target.value) }),
    setMsg: (e) => {
      set({ msg: e.target.value });
      const ev: RPC = { rpc: "on-peer-type" };
      _dataCon?.send(ev);
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
            get().endCall();
            get().backToPeerSelection();
          }
        }
      };

      window.addEventListener("visibilitychange", callEnder);
      window.addEventListener("pagehide", callEnder);

      _peer.on("disconnected", get().backToPeerSelection);
      _peer.on("close", get().backToPeerSelection);
      _peer.on("error", get().backToPeerSelection);
      _peer.on("open", () => {
        set({ status: "awaiting-peer" });
        onOpen?.();
      });

      _peer.on("connection", (c) => {
        startPinging();
        _dataCon = c;
        _dataCon.on("close", get().backToPeerSelection);
        _dataCon.on("error", get().backToPeerSelection);
        _dataCon.on("iceStateChanged", (s) => {
          if (s === "closed" || s === "failed") {
            get().backToPeerSelection();
          }
        });
        _dataCon.on("data", (data) => {
          get().receive(data as any);
        });
        set({ status: "connected", peerId: c.peer });
      });
      _peer.on("call", (call) => {
        const { peerId } = get();
        if (!peerId) {
          throw new Error("cant connect to peer without id");
        }

        _peerMediaCon = call;
        _peerMediaCon.on("error", get().endCall);
        _peerMediaCon.on("close", get().endCall);
        _peerMediaCon.on("iceStateChanged", (s) => {
          if (s === "closed" || s === "failed") {
            get().endCall();
          }
        });

        _peerMediaCon.on("stream", (peerMediaStream) => {
          _peerMediaStream = peerMediaStream;
          set({ status: "call-connected" });
        });

        const willAnswer = confirm(`answer call from ${peerId}?`);

        if (!willAnswer) {
          get().endCall();
          return;
        }

        createSelfMediaStream().then((selfStream) => {
          if (!selfStream) {
            get().endCall();
            return;
          }

          call.answer(selfStream);
        });
      });
    },
    connectPeer: () => {
      const peerId = get().peerId.trim();
      set({ peerId });
      if (!peerId) {
        return;
      }

      set({ status: "connecting-peer" });

      _dataCon = getPeer().connect(peerId, { reliable: true });

      _dataCon.on("open", () => {
        startPinging();
        set({ status: "connected" });
      });
      _dataCon.on("error", get().backToPeerSelection);
      _dataCon.on("close", get().backToPeerSelection);
      _dataCon.on("data", (data) => {
        get().receive(data as any);
      });
      _dataCon.on("iceStateChanged", (s) => {
        if (s === "closed" || s === "failed") {
          get().backToPeerSelection();
        }
      });
    },
    callPeer: () => {
      const { peerId } = get();
      if (!peerId) {
        throw new Error("cant connect to peer without id");
      }

      set({ status: "calling-peer" });

      createSelfMediaStream().then((selfStream) => {
        if (!selfStream) {
          get().endCall();
          return;
        }

        _peerMediaCon = getPeer().call(peerId, selfStream);
        _peerMediaCon.on("error", get().endCall);
        _peerMediaCon.on("close", get().endCall);
        _peerMediaCon.on("iceStateChanged", (s) => {
          if (s === "closed" || s === "failed") {
            get().endCall();
          }
        });

        _peerMediaCon.on("stream", (peerMediaStream) => {
          _peerMediaStream = peerMediaStream;
          set({ status: "call-connected" });
        });
      });
    },
    emit: () => {
      const { msg, selfId, peerId, receive } = get();
      const e: MsgEvent = {
        senderId: selfId,
        createdAt: Date.now(),
        msg,
      };

      if (!msg) return;

      set((p) => ({ msg: "", msgs: [...p.msgs, e] }));
      getDataConn().send(e);
    },
    sendFile: async (f: File) => {
      const now = Date.now();
      const senderId = get().selfId;
      const msg = f.name;
      const fileKey = senderId + now;
      const chunks = await chunkFile(f);
      const getTotalChunksSize = () => {
        return chunks.reduce((acc, cur) => acc + cur.byteLength, 0);
      };
      blobs[fileKey] = {
        chunks,
        getTotalChunksSize,
        meta: {
          senderId,
          fileKey,
          msg,
          createdAt: now,
          fileName: f.name,
          totalBytes: f.size,
          chunkIndex: 0,
        },
      };

      // only send the first chunk, then wait for the peer to acknowledge
      // otherwise you may break the data connection
      // because your peer is trying to drink water from a firehose
      const e: FileEvent = { ...blobs[fileKey].meta, chunk: chunks[0] };
      getDataConn().send(e);
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
      const { meta, chunks, getTotalChunksSize } = blobs[k];
      if (!meta.fileName) {
        alert("file not found");
        return;
      }

      if (getTotalChunksSize() !== meta.totalBytes) {
        alert("file still downloading");
        return;
      }

      const url = window.URL.createObjectURL(new Blob(chunks));
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = meta.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    receive: (ev) => {
      if (isRpc(ev)) {
        const { rpc } = ev;
        ((): void => {
          if (rpc === "end-call") {
            disposeVideo();
            set({ status: "connected" });
            return;
          }
          if (rpc === "on-peer-type") {
            connectionStore.setState({ isPeerTyping: true });
            onPeerType();
            return;
          }
          if (rpc === "start-ping") {
            onPing();
            return;
          }
          if (rpc === "acknowledge-chunk") {
            const b = blobs[ev.fileKey];
            const chunkSize = b.chunks[0].byteLength;
            if (!b || chunkSize === undefined) {
              alert("missing chunks for file " + ev.fileKey);
              return;
            }
            const nextChunkI = ev.chunkIndexReceived + 1;
            const nextChunk = b.chunks[nextChunkI];
            const receivedBytes = (() => {
              let res = 0;
              for (let i = 0; i <= ev.chunkIndexReceived; i++) {
                res += b.chunks[i].byteLength;
              }
              return res;
            })();
            set((p) => ({
              prog: {
                ...p.prog,
                [ev.fileKey]: {
                  msg: `${pb(receivedBytes)} / ${pb(b.meta.totalBytes)}`,
                  isDone: !nextChunk,
                },
              },
            }));
            if (!nextChunk) {
              return;
            }
            const e: FileEvent = {
              ...b.meta,
              chunkIndex: nextChunkI,
              chunk: nextChunk,
            };
            getDataConn().send(e);
            return;
          }
          return rpc;
        })();
        return;
      }

      if (isFileEvent(ev)) {
        const rpc: RPC = {
          rpc: "acknowledge-chunk",
          chunkIndexReceived: ev.chunkIndex,
          fileKey: ev.fileKey,
        };
        _dataCon?.send(rpc);

        // first chunk
        if (!blobs[ev.fileKey]) {
          const { chunk, ...rest } = ev;
          const meta = rest;
          const chunks: ArrayBuffer[] = [chunk];
          const getTotalChunksSize = () => {
            return chunks.reduce((acc, cur) => acc + cur.byteLength, 0);
          };

          blobs[ev.fileKey] = {
            meta,
            chunks,
            getTotalChunksSize,
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

          return;
        }

        // next chunk
        blobs[ev.fileKey].chunks.push(ev.chunk);
        const prog = blobs[ev.fileKey!]!.getTotalChunksSize();
        set((p) => ({
          prog: {
            ...p.prog,
            [ev.fileKey!]: {
              msg: `${pb(prog)} / ${pb(ev.totalBytes ?? 0)}`,
              isDone: prog === ev.totalBytes,
            },
          },
        }));

        return;
      }

      if (isMsgEvent(ev)) {
        set((p) => ({
          msgs: [...p.msgs, ev],
        }));
      }
    },
    endCall: () => {
      disposeVideo();
      const e: RPC = { rpc: "end-call" };
      _dataCon?.send(e);
      set({ status: "connected" });
    },
  })
);

export const connectionActions = connectionStore.getState();
