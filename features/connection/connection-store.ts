import create from "zustand";
import type { Peer, DataConnection, MediaConnection } from "peerjs";
import humanid from "human-id";

export type MsgEvent = {
  senderId: string;
  createdAt: number;
  msg: string;
};

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
};

const getInitState = (): ConnectionState => ({
  selfId: humanid("-").toLowerCase(),
  peerId: "",
  msg: "",
  msgs: [],
  status: "enter-self-id",
});

export type ConnectionActions = {
  setSelfId: (e: { target: { value: string } }) => void;
  setPeerId: (e: { target: { value: string } }) => void;
  setMsg: (e: { target: { value: string } }) => void;
  publishToBroker: () => Promise<void>;
  connectPeer: () => void;
  emit: () => void;
  receive: (e: MsgEvent) => void;
  callPeer: () => void;
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
  } catch (e) {
    alert("cant find audio video device to call with");
  }
  return _selfMediaStream;
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

export const connectionStore = create<ConnectionState & ConnectionActions>(
  (set, get) => ({
    ...getInitState(),

    setSelfId: (e) => set({ selfId: e.target.value }),
    setPeerId: (e) => set({ peerId: e.target.value }),
    setMsg: (e) => set({ msg: e.target.value }),
    publishToBroker: async () => {
      const { selfId } = get();
      if (!selfId) {
        throw new Error("cant init self without id");
      }

      set({ status: "connecting-self" });

      const PeerJs = await getPeerJs();
      _peer = new PeerJs(selfId);

      _peer.on("open", () => {
        set({ status: "awaiting-peer" });
      });
      _peer.on("error", (e) => {
        alert(e.cause);
        set(getInitState());
      });
      _peer.on("connection", (c) => {
        _dataCon = c;
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

        const willAnswer = confirm(`answer call from ${peerId}?`);

        if (!willAnswer) {
          call.close();
          return;
        }

        createSelfMediaStream().then((selfStream) => {
          if (!selfStream) {
            call.close();
            return;
          }

          call.answer(selfStream);

          call.on("error", (e) => {
            alert(e.cause);
            set({ status: "connected" });
          });
          call.on("close", () => {
            alert("call ended");
            set({ status: "connected" });
          });
          call.on("stream", (peerMediaStream) => {
            _peerMediaStream = peerMediaStream;
            set({ status: "call-connected" });
          });
        });
      });
    },
    connectPeer: () => {
      const { peerId } = get();
      if (!peerId) {
        throw new Error("cant connect to peer without id");
      }

      set({ status: "connecting-peer" });

      _dataCon = getPeer().connect(peerId);

      _dataCon.on("open", () => {
        set({ status: "connected" });
      });
      _dataCon.on("error", (e) => {
        alert(e.cause);
        set({ status: "awaiting-peer", peerId: "" });
      });
      _dataCon.on("data", (data) => {
        get().receive(data as any);
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
          return;
        }

        _peerMediaCon = getPeer().call(peerId, selfStream);

        _peerMediaCon.on("error", (e) => {
          alert(e.cause);
          set({ status: "connected" });
        });
        _peerMediaCon.on("close", () => {
          alert("call ended");
          set({ status: "connected" });
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
    receive: (e) => {
      set((p) => ({
        msgs: [...p.msgs, e],
      }));
    },
  })
);

export const connectionActions = connectionStore.getState();
