import create from "zustand";
import { publishSelfToBroker } from "./connection";

export type ConnectionState = {
  status:
    | "enter-self-id"
    | "connecting-self"
    | "awaiting-peer"
    | "connected"
    | "disconnected";
  selfId: string;
  messageStack: string[];
};

export type ConnectionActions = {
  initSelf: () => Promise<void>;
  setSelfId: (e: { target: { value: string } }) => void;
};

export const connectionStore = create<ConnectionState & ConnectionActions>(
  (set, get) => ({
    selfId: "",
    status: "enter-self-id",
    messageStack: [],

    setSelfId: (e) => set({ selfId: e.target.value }),
    initSelf: async () => {
      const id = get().selfId;
      if (!id) {
        throw new Error("cant init self without id");
      }

      set({ status: "connecting-self" });
      await publishSelfToBroker(id);
      set({ status: "awaiting-peer" });
    },
  })
);

const { setSelfId, initSelf } = connectionStore.getState();
export const connectionActions = { setSelfId, initSelf };
