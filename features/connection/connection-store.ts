import type { Peer } from "peerjs";
import create from "zustand";

export type ConnectionState = {
  selfId: string | undefined;
  status: 'enter-self-id' | 'connecting-self' | 'awaiting-peer' | 'connected' | 'disconnected'
  messageStack: string[];
};

export type ConnectionActions = {
  initSelf: () => Promise<void>
  setSelfId: (e: {target: {value: string}}) => void
};

let self: Peer | null = null;
export const getSelf = () => {
  if (!self) {
    throw new Error('peer not initialized');
  }
  return self
}

export const useConnection = create<ConnectionState & ConnectionActions>()((set, get) => ({
  selfId: undefined,
  status: 'enter-self-id',
  messageStack: [],


  setSelfId: (e) => set({selfId: e.target.value}),
  initSelf: async () => {
    console.log
    const id = get().selfId
    if (!id) {
      throw new Error('cant init self without id')
    }

    set({status: 'connecting-self'});

    const Self = (await import("peerjs")).default;

    self = new Self(id);
    self.on("open", () => {
      console.log("open");
    });

    self.on('connection', (conn) => {
      console.log("connection", conn.peer);
      conn.on('data', (data) => {
        console.log('data', data);
      })
    })

    set({status: 'awaiting-peer'});
  }
}));

const { initSelf, setSelfId } = useConnection.getState();
export const connectionActions = { initSelf, setSelfId };