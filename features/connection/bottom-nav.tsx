import { Upload } from "../../components";
import { Icon } from "../../components/icon";
import cn from "./bottom-nav.module.css";
import { useStore, connectionStore } from "./connection-store";

export const BottomNav = (): JSX.Element | null => {
  const s = useStore((s) => s);

  if (s.status === "enter-self-id") {
    return (
      <div className={cn.root}>
        <label htmlFor="your id">your id</label>
        <div className={cn.row}>
          <input
            className={cn.input}
            id="your id"
            autoComplete="off"
            value={s.selfId}
            onChange={connectionStore.lpc.setSelfId}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                connectionStore.lpc.publishToBroker(undefined);
                e.preventDefault();
              }
            }}
          />
          <Icon
            name="arrowUp"
            onClick={() => connectionStore.lpc.publishToBroker(undefined)}
          />
        </div>
      </div>
    );
  }
  if (s.status === "connecting-self") {
    return null;
  }
  if (s.status == "awaiting-peer") {
    return (
      <div className={cn.root}>
        <label htmlFor="peer id">peer id</label>
        <div className={cn.row}>
          <input
            className={cn.input}
            id="peer id"
            autoComplete="off"
            value={s.peerId}
            onChange={connectionStore.lpc.setPeerId}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                connectionStore.lpc.connectPeer(undefined);
                e.preventDefault();
              }
            }}
          />
          <Icon
            name="arrowUp"
            onClick={() => connectionStore.lpc.connectPeer(undefined)}
          />
        </div>
      </div>
    );
  }
  if (s.status === "connecting-peer") {
    return null;
  }
  if (s.status === "connected") {
    return (
      <div className={cn.root}>
        {s.isPeerTyping && (
          <div className={cn.row}>
            <span>{s.peerId + " is typing..."}</span>
          </div>
        )}
        <div className={cn.row}>
          <Upload onFile={connectionStore.lpc.sendFile} />
          <input
            aria-label="message peer"
            className={cn.input}
            autoComplete="off"
            value={s.msg}
            onChange={connectionStore.lpc.setMsg}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                connectionStore.lpc.sendMsg(undefined);
                e.preventDefault();
              }
            }}
          />
          <Icon
            name="arrowUp"
            onClick={() => connectionStore.lpc.sendMsg(undefined)}
          />
        </div>
      </div>
    );
  }
  if (s.status === "calling-peer") {
    return null;
  }
  if (s.status === "select-media") {
    return null;
  }
  if (s.status === "call-connected") {
    return null;
  }
  return s.status;
};
