import create from "zustand";
import { connectToPeer, publishSelfToBroker } from "./connection-instance";

export type ConnectionState = {
  status:
    | "enter-self-id"
    | "connecting-self"
    | "awaiting-peer"
    | 'connecting-peer'
    | "connected"
    | "disconnected";
  selfId: string;
  peerId: string;
  messageStack: string[];
};

export type ConnectionActions = {
  initSelf: () => Promise<void>;
  setSelfId: (e: { target: { value: string } }) => void;
  setPeerId: (e: { target: { value: string } }) => void;
  setPeer: () => Promise<void>
};

export const connectionStore = create<ConnectionState & ConnectionActions>(
  (set, get) => ({
    selfId: "",
    peerId: "",
    status: "enter-self-id",
    messageStack: [],

    setSelfId: (e) => set({ selfId: e.target.value }),
    setPeerId: (e) => set({ peerId: e.target.value }),
    initSelf: async () => {
      const id = get().selfId;
      if (!id) {
        throw new Error("cant init self without id");
      }

      set({ status: "connecting-self" });
      await publishSelfToBroker(id);
      set({ status: "awaiting-peer" });
    },
    setPeer: async () => {
      try {
        set({status: 'connecting-peer'})
        await connectToPeer(get().peerId);
      } catch {
        set({status: 'awaiting-peer'})
      }
    }
  })
);

export const connectionActions = connectionStore.getState();
