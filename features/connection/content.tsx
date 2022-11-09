import React from "react";
import { ChatBubble } from "../../components";
import { WithMainAxisFlexDir } from "../../hooks";
import {
  connectionStore,
  getSelfMediaStream,
  getPeerMediaStream,
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

  const flex = <div className={cn.flex} />;

  if (s.status === "enter-self-id") {
    return flex;
  }
  if (s.status === "connecting-self") {
    return flex;
  }
  if (s.status == "awaiting-peer") {
    return flex;
  }
  if (s.status === "connecting-peer") {
    return flex;
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
    return flex;
  }
  if (s.status === "call-connected") {
    return (
      <WithMainAxisFlexDir>
        {(flexDirection) => {
          const vidStyle: React.CSSProperties = {
            width: flexDirection === "row" ? "45%" : undefined,
            height: flexDirection === "column" ? "45%" : undefined,
            flex: "1",
            objectFit: "cover",
            borderRadius: "var(--rad)",
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
