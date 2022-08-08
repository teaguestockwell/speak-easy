import React from "react";
import cn from "./connection.module.css";
import { connectionStore, connectionActions } from "./connection-store";

export const Nav = () => {
  const s = connectionStore((s) => s);
  const [c, cc] = React.useState(0);

  return (
    <div className={cn.navRoot}>
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
      <div className={cn.root}>
        <label>enter your id</label>
        <input value={s.selfId} onChange={connectionActions.setSelfId} />
        <button onClick={connectionActions.publishToBroker}>done</button>
      </div>
    );
  }

  if (s.status === "connecting-self") {
    return (
      <div className={cn.root}>
        <span>publishing your id</span>
      </div>
    );
  }

  if (s.status == "awaiting-peer") {
    return (
      <div className={cn.root}>
        <label>enter peer id</label>
        <input value={s.peerId} onChange={connectionActions.setPeerId} />
        <button onClick={connectionActions.callPeer}>connect</button>
      </div>
    );
  }

  if (s.status === "connecting-peer") {
    return (
      <div className={cn.root}>
        <span>connecting to peer</span>
      </div>
    );
  }

  if (s.status === "connected") {
    return (
      <div className={cn.root}>
        <label>enter a msg</label>
        <input value={s.msg} onChange={connectionActions.setMsg} />
        <button onClick={connectionActions.emit}>send</button>
        {s.msgs.map((m) => (
          <pre key={m.createdAt + m.receiverId}>
            {JSON.stringify(m, null, 2)}
          </pre>
        ))}
      </div>
    );
  }

  return s.status;
};
