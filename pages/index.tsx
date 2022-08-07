import type { NextPage } from "next";
import type { Peer } from "peerjs";
import Head from "next/head";
import React from "react";
import create from "zustand";

type P = {
  id: string;
};

type State = {
  pendingPeers: P[];
  connectedPeers: P[];
  messageStack: {[peerId: string]: string[]};
};

type Actions = {
  addMessage: (peerId: string, message: string) => void;
  addPendingPeer: (peer: P) => void;
  removePendingPeer: (peer: P) => void;
  upgradePendingPeer: (peer: P) => void;
  addConnectedPeer: (peer: P) => void;
  removeConnectedPeer: (peer: P) => void;
};

const useSlice = create<State & Actions>()((set) => ({
  pendingPeers: [],
  connectedPeers: [],
  messageStack: {},

  addMessage: (peerId, message) => {
    set(prev => {
      return {
        messageStack: {
          ...prev.messageStack,
          [peerId]: [...prev.messageStack[peerId], message],
        }
      }
    })
  },
  addPendingPeer: (peer) => {
    set((prev) => {
      return {
        pendingPeers: [...prev.pendingPeers, peer],
      };
    });
  },
  removePendingPeer: (peer) => {
    set((prev) => {
      return {
        pendingPeers: prev.pendingPeers.filter((p) => p.id !== peer.id),
      };
    });
  },
  upgradePendingPeer: (peer) => {
    set((prev) => {
      return {
        pendingPeers: prev.pendingPeers.filter((p) => p.id !== peer.id),
        connectedPeers: [...prev.connectedPeers, peer],
      };
    });
  },
  addConnectedPeer: (peer) => {
    set((prev) => {
      return {
        connectedPeers: [...prev.connectedPeers, peer],
      };
    });
  },
  removeConnectedPeer: (peer) => {
    set((prev) => {
      return {
        connectedPeers: prev.connectedPeers.filter((p) => p.id !== peer.id),
      };
    });
  },
}));

const SelfContext = React.createContext<Peer | null>(null);

const useSelf = () => {
  const ctx = React.useContext(SelfContext);
  if (!ctx) {
    throw new Error("useSelf must be used within a SelfProvider");
  }
  return ctx;
};

const SelfProvider = (props: React.PropsWithChildren<{}>) => {
  const [selfId, setSelfId] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [self, setSelf] = React.useState<Peer | null>(null);

  React.useEffect(() => {
    if (!done) {
      return;
    }

    (async () => {
      const Self = (await import("peerjs")).default;
      const newSelf = new Self(selfId);
      newSelf.on("open", () => {
        setSelf(newSelf);
        console.log("open", newSelf.id);
      });

      newSelf.on('connection', (conn) => {
        console.log("connection", conn.peer);
        conn.on('data', (data) => {
          console.log('data', data);
        })
      })
      
    })();
  }, [done]);

  if (!done) {
    return (
      <>
        <label>enter your id</label>
        <input value={selfId} onChange={(e) => setSelfId(e.target.value)} />
        <button onClick={() => setDone((p) => !p)}>
          {done ? "reset" : "done"}
        </button>
      </>
    );
  }

  if (!self) {
    return <div>loading...</div>;
  }

  return (
    <SelfContext.Provider value={self}>{props.children}</SelfContext.Provider>
  );
};

const AddPeer = () => {
  const [val, setVal] = React.useState("");

  return (
    <>
      <label>new peer id</label>
      <input value={val} onChange={(e) => setVal(e.target.value)} />
      <button
        onClick={() => {
          useSlice.getState().addPendingPeer({ id: val });
          setVal("");
        }}
      >
        add peer
      </button>
    </>
  );
};

const PeerPending = React.memo(
  (props: { id: string }) => {
    const self = useSelf();

    React.useEffect(() => {
      const pending = self.connect(props.id);

      pending.on("open", () => {
        pending.send('hello');
        useSlice.getState().upgradePendingPeer({ id: props.id });
      });

      pending.on("error", (err) => {
        alert(`failed to connect to ${props.id}: ${err}`);
        useSlice.getState().removePendingPeer({ id: props.id });
      });
    }, [self, props.id]);

    return (
      <div>
        <button
          onClick={() =>
            useSlice.getState().removePendingPeer({ id: props.id })
          }
        >
          cancel
        </button>
        <span>connecting to: {props.id}</span>
      </div>
    );
  },
  (prev, next) => prev.id === next.id
);
PeerPending.displayName = "PendingPeer";

const PeerConnection = React.memo(
  (props: { id: string }) => {
    const self = useSelf();

    return (
      <div>
        <button
          onClick={() =>
            useSlice.getState().removeConnectedPeer({ id: props.id })
          }
        >
          delete
        </button>
        <span>connected to: {props.id}</span>
      </div>
    );
  },
  (prev, next) => prev.id === next.id
);
PeerConnection.displayName = "Peer";

const Peers = () => {
  const [pending, connected] = useSlice((s) => [
    s.pendingPeers,
    s.connectedPeers,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AddPeer />
      {pending.map((p) => (
        <PeerConnection id={p.id} key={p.id} />
      ))}
      {connected.map((p) => (
        <PeerConnection id={p.id} key={p.id} />
      ))}
    </div>
  );
};

const App = () => {
  return (
    <SelfProvider>
      <Peers />
    </SelfProvider>
  );
};

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Speak Easy</title>
        <meta
          name="description"
          content="A peer to peer chat that is e2e encrypted"
        />
      </Head>
      <main>
        <App />
      </main>
    </div>
  );
};

export default Home;
