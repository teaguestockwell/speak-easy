import React from "react";
import cn from "./connection.module.css";
import {
  connectionStore,
  connectionActions,
  getSelfMediaStream,
  getPeerMediaStream,
  MsgEvent,
} from "./connection-store";
import { WithMainAxisFlexDir } from "../../hooks/use-main-axis-flex-dir";

export const Nav = () => {
  const s = connectionStore((s) => s);

  if (s.status === "call-connected") {
    return null;
  }

  return (
    <div className={cn.topNavRoot}>
      <span>{"my id: " + s.selfId}</span>
      <span>{"peer id: " + s.peerId}</span>
    </div>
  );
};

const _ChatBubble = (e: MsgEvent) => {
  const time = new Date(e.createdAt).toLocaleTimeString();
  const style = {
    alignSelf:
      e.senderId === connectionStore.getState().selfId
        ? "flex-end"
        : "flex-start",
  };
  return (
    <div className={cn.bubbleRoot} style={style}>
      <span className={cn.bubbleTxt}>{e.msg}</span>
      <span className={cn.bubbleTime}>{time}</span>
    </div>
  );
};

const ChatBubble = React.memo(_ChatBubble);

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
          <input value={s.selfId} onChange={connectionActions.setSelfId} />
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
            value={s.msg}
            onChange={connectionActions.setMsg}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                connectionActions.emit();
              }
            }}
          />
          <div className={cn.row}>
            <button className={cn.but} onClick={connectionActions.emit}>
              send
            </button>
            <button className={cn.but} onClick={connectionActions.callPeer}>
              call
            </button>
          </div>
        </div>
        <div className={cn.msgsRoot}>
          {s.msgs.map((m) => (
            <ChatBubble key={m.createdAt + m.senderId} {...m} />
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
      <WithMainAxisFlexDir>
        {(flexDirection) => {
          const vidStyle: React.CSSProperties = {
            width: flexDirection === "row" ? "48%" : undefined,
            height: flexDirection === "column" ? "48%" : undefined,
            flex: "1",
            objectFit: "cover",
          };
          return (
            <div className={cn.call} style={{ flexDirection }}>
              <video ref={selfVideo} style={vidStyle} muted />
              <video ref={peerVideo} style={vidStyle} />
            </div>
          );
        }}
      </WithMainAxisFlexDir>
    );
  }

  return s.status;
};
