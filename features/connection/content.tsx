import React from "react";
import { ChatBubble, Button } from "../../components";
import { WithMainAxisFlexDir } from "../../hooks";
import {
  connectionStore,
  getSelfMediaStream,
  getPeerMediaStream,
  connectionActions,
} from "./connection-store";
import cn from "./content.module.css";

export const Content = (): JSX.Element | null => {
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
    return null;
  }
  if (s.status === "connecting-self") {
    return null;
  }
  if (s.status == "awaiting-peer") {
    return null;
  }
  if (s.status === "connecting-peer") {
    return null;
  }
  if (s.status === "connected") {
    return (
      <div className={cn.msg}>
        {s.msgs.map((m) => (
          <ChatBubble
            key={m.createdAt + m.senderId}
            variant={s.selfId === m.senderId ? "mine" : "theirs"}
            msg={m.msg}
            createdAt={m.createdAt}
          />
        ))}
      </div>
    );
  }
  if (s.status === "calling-peer") {
    return null;
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
              <Button onClick={connectionActions.endCall}>end call</Button>
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
