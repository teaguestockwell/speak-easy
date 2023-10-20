import cn from "./top-nav.module.css";
import { connectionStore, useStore } from "./connection-store";
import { Icon } from "../../components/icon";
import { copyTextToClipboard } from "./copy-to-clipboard";

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

const NoopIcon = () => <Icon onClick={() => {}} name={null} />;

export const TopNav = (): JSX.Element | null => {
  const status = useStore((s) => s.status);
  const peerId = useStore((s) => s.peerId);
  const selfId = useStore((s) => s.selfId);

  if (status === "enter-self-id") {
    return null;
  }
  if (status === "connecting-self") {
    return null;
  }
  if (status == "awaiting-peer") {
    return (
      <Nav
        left={
          <Icon
            name="back"
            onClick={() => connectionStore.lpc.backToSelfIdSelection()}
          />
        }
        center={<span>connect to peer</span>}
        right={<NoopIcon />}
      />
    );
  }
  if (status === "connecting-peer") {
    return null;
  }
  if (status === "connected") {
    return (
      <Nav
        left={
          <Icon
            name="back"
            onClick={() => connectionStore.lpc.backToPeerSelection(undefined)}
          />
        }
        center={<span>peer id: {peerId}</span>}
        right={
          <Icon
            name="call"
            onClick={() => connectionStore.lpc.requestCall(undefined)}
          />
        }
      />
    );
  }
  if (status === "calling-peer") {
    return null;
  }
  if (status === "select-media") {
    return null;
  }
  if (status === "call-connected") {
    return (
      <Nav
        left={
          <Icon
            name="back"
            onClick={() => connectionStore.lpc.endCall(undefined)}
          />
        }
        center={<span>{peerId}</span>}
        right={<NoopIcon />}
      />
    );
  }
  return status;
};
