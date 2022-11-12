import React from "react";
import { ChatBubble } from "../../components";
import { WithMainAxisFlexDir } from "../../hooks";
import {
  connectionStore,
  getSelfMediaStream,
  getPeerMediaStream,
  connectionActions,
  MsgEvent,
} from "./connection-store";
import cn from "./content.module.css";

const ConnectedChatBubble = (p: MsgEvent) => {
  const { selfId } = connectionStore.getState();
  const prog = connectionStore((s) => s.prog[p.fileKey ?? ""]);

  return (
    <ChatBubble
      key={p.createdAt + p.senderId}
      variant={selfId === p.senderId ? "mine" : "theirs"}
      msg={prog ? p.msg + " " + prog.msg : p.msg}
      createdAt={p.createdAt}
      downloadFile={
        prog?.isDone
          ? () => connectionActions.downloadFile(p.fileKey!)
          : undefined
      }
    />
  );
};

export const Content = (): JSX.Element | null => {
  const status = connectionStore((s) => s.status);
  const msgs = connectionStore((s) => s.msgs);
  const [selfVideo] = React.useState(React.createRef<HTMLVideoElement>());
  const [peerVideo] = React.useState(React.createRef<HTMLVideoElement>());
  React.useLayoutEffect(() => {
    if (status === "call-connected" && selfVideo.current && peerVideo.current) {
      selfVideo.current.srcObject = getSelfMediaStream();
      peerVideo.current.srcObject = getPeerMediaStream();
      selfVideo.current.play();
      peerVideo.current.play();
    }
  });

  const flex = <div className={cn.flex} />;

  if (status === "enter-self-id") {
    return flex;
  }
  if (status === "connecting-self") {
    return flex;
  }
  if (status == "awaiting-peer") {
    return flex;
  }
  if (status === "connecting-peer") {
    return flex;
  }
  if (status === "connected") {
    return (
      <div className={cn.msg}>
        {msgs.map((m) => (
          <ConnectedChatBubble key={m.createdAt + m.senderId} {...m} />
        ))}
      </div>
    );
  }
  if (status === "calling-peer") {
    return flex;
  }
  if (status === "call-connected") {
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
  return status;
};
