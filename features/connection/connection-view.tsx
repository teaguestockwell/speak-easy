import React from "react";
import cn from "./connection.module.css";
import { connectionStore, connectionActions } from "./connection-store";

export const Nav = () => {
  const s = connectionStore((s) => s);

  return (
    <div className={cn.topNavRoot}>
      <pre>
        {JSON.stringify(
          {
            "my id": s.selfId,
            "peer id": s.peerId,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
};

export const ConnectionView = (): JSX.Element => {
  const s = connectionStore((s) => s);

  if (s.status === "enter-self-id") {
    return (
      <div className={cn.bottomNavRoot}>
        <div className={cn.col}>
          <label>enter your id</label>
          <input
            className={cn.t}
            value={s.selfId}
            onChange={connectionActions.setSelfId}
          />
        </div>
        <button onClick={connectionActions.publishToBroker}>next</button>
      </div>
    );
  }

  if (s.status === "connecting-self") {
    return (
      <div className={cn.bottomNavRoot}>
        <span>publishing your id...</span>
      </div>
    );
  }

  if (s.status == "awaiting-peer") {
    return (
      <div className={cn.bottomNavRoot}>
        <div className={cn.col}>
          <label>enter peers id</label>
          <input
            className={cn.t}
            value={s.peerId}
            onChange={connectionActions.setPeerId}
          />
        </div>
        <button onClick={connectionActions.callPeer}>connect</button>
      </div>
    );
  }

  if (s.status === "connecting-peer") {
    return (
      <div className={cn.bottomNavRoot}>
        <span>connecting to peer...</span>
      </div>
    );
  }

  if (s.status === "connected") {
    return (
      <>
        <div className={cn.bottomNavRoot}>
          <textarea
            className={cn.text}
            value={s.msg}
            onChange={connectionActions.setMsg}
          />
          <button onClick={connectionActions.emit}>send</button>
        </div>
        <div className={cn.msgsRoot}>
          {s.msgs.map((m) => (
            <pre
              key={m.createdAt + m.receiverId}
              style={{ alignSelf: m.senderId === s.selfId ? "flex-end" : "flex-start" }}
            >
              {JSON.stringify(m, null, 2)}
            </pre>
          ))}
        </div>
      </>
    );
  }

  return s.status;
};
