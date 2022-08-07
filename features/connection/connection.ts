import type { Peer } from "peerjs";

let con: Peer | null = null;

export const getConnection = () => {
  if (!con) {
    throw new Error("peer not initialized");
  }
  return con;
};

export const publishSelfToBroker = async (id: string) => {
  const Self = (await import("peerjs")).default;
  con = new Self(id);

  con.on("open", () => {
    console.log("open");
  });

  con.on("connection", (conn) => {
    console.log("connection", conn.peer);
    conn.on("data", (data) => {
      console.log("data", data);
    });
  });
};
