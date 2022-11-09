import cn from "./top-nav.module.css";
import { connectionActions, connectionStore } from "./connection-store";
import { Icon } from "../../components/icon";

const Nav = (p: {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}) => {
  return (
    <div className={cn.root}>
      <div className={cn.left}>{p.left}</div>
      <div className={cn.center}>{p.center}</div>
      <div className={cn.right}>{p.right}</div>
    </div>
  );
};

export const TopNav = (): JSX.Element | null => {
  const s = connectionStore((s) => s);

  if (s.status === "enter-self-id") {
    return null;
  }
  if (s.status === "connecting-self") {
    return null;
  }
  if (s.status == "awaiting-peer") {
    return <Nav center={<span>{"my id: " + s.selfId}</span>} />;
  }
  if (s.status === "connecting-peer") {
    return null;
  }
  if (s.status === "connected") {
    return (
      <Nav
        left={
          <Icon name="back" onClick={connectionActions.backToPeerSelection} />
        }
        center={<span>{s.peerId}</span>}
        right={<Icon name="call" onClick={connectionActions.callPeer} />}
      />
    );
  }
  if (s.status === "calling-peer") {
    return null;
  }
  if (s.status === "call-connected") {
    return (
      <Nav
        left={<Icon name="back" onClick={connectionActions.endCall} />}
        center={<span>{s.peerId}</span>}
      />
    );
  }
  return s.status;
};
