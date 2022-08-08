import create from "zustand";
import type { Peer, DataConnection } from "peerjs";
import humanid from 'human-id'

type MsgEvent = {
  senderId: string;
  receiverId: string;
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
};

const getInitState = (): ConnectionState => ({
  selfId: humanid('-').toLowerCase(),
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
  callPeer: () => void;
  emit: () => void;
  receive: (e: MsgEvent) => void;
};

let _peer: Peer | null = null;
let _dataCon: DataConnection | null;

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
    },
    callPeer: () => {
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
    emit: () => {
      const { msg, selfId, peerId, receive } = get();
      const e: MsgEvent = {
        senderId: selfId,
        receiverId: peerId,
        createdAt: Date.now(),
        msg,
      };

      if (!msg) return;

      set((p) => ({ msg: "", msgs: [...p.msgs, e] }));
      getDataConn().send(e);
    },
    receive: (e) => {
      console.log(e);

      set((p) => ({
        msgs: [...p.msgs, e],
      }));
    },
  })
);

export const connectionActions = connectionStore.getState();
