import { useStore } from "./connection-store";
import cn from "./loader.module.css";

export const Loader = (): JSX.Element | null => {
  const s = useStore((s) => s);
  const [text] = ((): [string] => {
    if (s.status === "enter-self-id") {
      return [""];
    }
    if (s.status === "connecting-self") {
      return ["publishing your id"];
    }
    if (s.status === "awaiting-peer") {
      return [""];
    }
    if (s.status === "connecting-peer") {
      return [`connecting to ${s.peerId}`];
    }
    if (s.status === "connected") {
      return [""];
    }
    if (s.status === "select-media") {
      return [""];
    }
    if (s.status === "calling-peer") {
      return [`calling ${s.peerId}`];
    }
    if (s.status === "call-connected") {
      return [""];
    }
    return s.status;
  })();

  const loader = (
    <div className={cn.root}>
      <div className={cn.spinner}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && <span>{text}</span>}
    </div>
  );

  if (s.status === "enter-self-id") {
    return null;
  }
  if (s.status === "connecting-self") {
    return loader;
  }
  if (s.status == "awaiting-peer") {
    return null;
  }
  if (s.status === "connecting-peer") {
    return loader;
  }
  if (s.status === "connected") {
    return null;
  }
  if (s.status === "select-media") {
    return null;
  }
  if (s.status === "calling-peer") {
    return loader;
  }
  if (s.status === "call-connected") {
    return null;
  }
  return s.status;
};
