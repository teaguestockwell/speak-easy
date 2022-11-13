import { Button, Upload } from "../../components";
import { Icon } from "../../components/icon";
import cn from "./bottom-nav.module.css";
import { connectionActions, connectionStore } from "./connection-store";

export const BottomNav = (): JSX.Element | null => {
  const s = connectionStore((s) => s);

  if (s.status === "enter-self-id") {
    return (
      <div className={cn.root}>
        <div className={cn.col}>
          <label htmlFor="your id">your id</label>
          <input
            id="your id"
            value={s.selfId}
            onChange={connectionActions.setSelfId}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                connectionActions.publishToBroker();
                e.preventDefault();
              }
            }}
          />
        </div>
        <Button
          className={cn.but}
          onClick={() => connectionActions.publishToBroker()}
        >
          next
        </Button>
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
        <input
          id="peer id"
          value={s.peerId}
          onChange={connectionActions.setPeerId}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              connectionActions.connectPeer();
              e.preventDefault();
            }
          }}
        />
        <Button className={cn.but} onClick={connectionActions.connectPeer}>
          connect
        </Button>
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
          <Upload onFile={connectionActions.sendFile} />
          <textarea
            aria-label="message peer"
            className={cn.ta}
            value={s.msg}
            onChange={connectionActions.setMsg}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                connectionActions.emit();
                e.preventDefault();
              }
            }}
          />
          <Icon
            sx={{ marginBottom: 4 }}
            name="comment"
            onClick={connectionActions.emit}
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
