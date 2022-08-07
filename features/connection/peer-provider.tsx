import { getConnection } from "./connection";

export const PeerProvider = () => {
  const con = getConnection()
  return <div>chat</div>;
};
