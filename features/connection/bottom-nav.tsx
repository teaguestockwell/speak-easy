import { Button } from "../../components";
import cn from "./bottom-nav.module.css";
import { connectionActions, connectionStore } from "./connection-store";

export const BottomNav = (): JSX.Element | null => {
  const s = connectionStore((s) => s);

  if (s.status === "enter-self-id") {
    return (
      <div className={cn.root}>
        <div className={cn.col}>
          <label>enter your id</label>
          <input
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
        <Button className={cn.but} onClick={connectionActions.publishToBroker}>
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
        <label>enter peer id</label>
        <input
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
        <textarea
          value={s.msg}
          onChange={connectionActions.setMsg}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              connectionActions.emit();
              e.preventDefault();
            }
          }}
        />
        <div className={cn.row}>
          <Button className={cn.but} onClick={connectionActions.emit}>
            send
          </Button>
        </div>
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
