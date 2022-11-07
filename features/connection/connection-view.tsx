import React from "react";
import cn from "./connection.module.css";
import {
  connectionStore,
  connectionActions,
  getSelfMediaStream,
  getPeerMediaStream,
} from "./connection-store";

export const Nav = () => {
  const s = connectionStore((s) => s);

  return (
    <div className={cn.topNavRoot}>
      <span>{"my id: " + s.selfId}</span>
      <span>{"peer id: " + s.peerId}</span>
    </div>
  );
};

export const ConnectionView = (): JSX.Element => {
  const s = connectionStore((s) => s);
  const [selfVideo] = React.useState(React.createRef<HTMLVideoElement>());
  const [peerVideo] = React.useState(React.createRef<HTMLVideoElement>());

  React.useLayoutEffect(() => {
    if (
      s.status === "call-connected" &&
      selfVideo.current &&
      peerVideo.current
    ) {
      selfVideo.current.srcObject = getSelfMediaStream();
      peerVideo.current.srcObject = getPeerMediaStream();
      selfVideo.current.play();
      peerVideo.current.play();
    }
  });

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
        <label>enter peers id</label>
        <input value={s.peerId} onChange={connectionActions.setPeerId} />
        <button onClick={connectionActions.connectPeer}>connect</button>
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
          <button onClick={connectionActions.callPeer}>call</button>
        </div>
        <div className={cn.msgsRoot}>
          {s.msgs.map((m) => (
            <pre
              key={m.createdAt + m.receiverId}
              style={{
                alignSelf: m.senderId === s.selfId ? "flex-end" : "flex-start",
              }}
            >
              {JSON.stringify(m, null, 2)}
            </pre>
          ))}
        </div>
      </>
    );
  }

  if (s.status === "calling-peer") {
    return (
      <>
        <div className={cn.bottomNavRoot}>
          <span>calling to peer...</span>
        </div>
      </>
    );
  }

  if (s.status === "call-connected") {
    return (
      <>
        <div className={cn.msgsRootCall}>
          <video ref={selfVideo} className={cn.selfVid} />
          <video ref={peerVideo} className={cn.peerVid} />
        </div>
      </>
    );
  }

  return s.status;
};
