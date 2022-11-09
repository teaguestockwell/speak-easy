import cn from "./top-nav.module.css";
import { connectionStore } from "./connection-store";

export const TopNav = (): JSX.Element | null => {
  const s = connectionStore((s) => s);

  const nav = (
    <div className={cn.root}>
      <span>{"my id: " + s.selfId}</span>
    </div>
  );

  if (s.status === "enter-self-id") {
    return nav;
  }
  if (s.status === "connecting-self") {
    return null;
  }
  if (s.status == "awaiting-peer") {
    return nav;
  }
  if (s.status === "connecting-peer") {
    return null;
  }
  if (s.status === "connected") {
    return (
      <div className={cn.root}>
        <span>{s.peerId}</span>
      </div>
    );
  }
  if (s.status === "calling-peer") {
    return null;
  }
  if (s.status === "call-connected") {
    return null;
  }
  return s.status;
};
