import cn from "./top-nav.module.css";
import { connectionActions, connectionStore } from "./connection-store";
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

export const TopNav = (): JSX.Element | null => {
  const status = connectionStore((s) => s.status);
  const peerId = connectionStore((s) => s.peerId);
  const selfId = connectionStore((s) => s.selfId);

  if (status === "enter-self-id") {
    return null;
  }
  if (status === "connecting-self") {
    return null;
  }
  if (status == "awaiting-peer") {
    return (
      <Nav
        center={
          <div className={cn.centerRow}>
            <span>your id: {selfId}</span>
            <Icon
              name="share"
              onClick={() => {
                const url =
                  window.location.origin +
                  window.location.pathname +
                  `?peer=${encodeURIComponent(selfId)}`;
                copyTextToClipboard(
                  url,
                  () =>
                    alert(
                      "copied url to your clipboard, please share with a peer so they can auto connect"
                    ),
                  () =>
                    alert(
                      `${url}\n\nplease share this url with a peer so they can auto connect`
                    )
                );
              }}
            />
          </div>
        }
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
          <Icon name="back" onClick={connectionActions.backToPeerSelection} />
        }
        center={<span>peer id: {peerId}</span>}
        right={<Icon name="call" onClick={connectionActions.requestCall} />}
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
        left={<Icon name="back" onClick={connectionActions.endCall} />}
        center={<span>{peerId}</span>}
      />
    );
  }
  return status;
};
