import cn from "./connection.module.css";
import { connectionStore, connectionActions } from "./connection-store";

export const ConnectionView = () => {
  const s = connectionStore(s => s);

  if (s.status === "enter-self-id") {
    return (
      <div className={cn.root}>
        <label>enter your id</label>
        <input value={s.selfId} onChange={connectionActions.setSelfId} />
        <button onClick={connectionActions.initSelf}>done</button>
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

  if (s.status == 'awaiting-peer') {
    return (
      <div className={cn.root}>
        <span>await to connect to a peer</span>
        <label>enter peer id</label>
        <input value={s.peerId} onChange={connectionActions.setPeerId} />
        <button onClick={connectionActions.setPeer}>connect</button>
      </div>
    )
  }

  if (s.status === 'connecting-peer') {
    return (
      <div className={cn.root}>
        <span>connecting to peer</span>
      </div>
    )
  }

  if (s.status === 'connected') {
    return (
      <div className={cn.root}>
        <span>connected to {s.peerId}</span>
      </div>
    )
  }

  return <div>{s.status}</div>;
};
