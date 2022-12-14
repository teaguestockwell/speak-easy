import React from "react";
import { ChatBubble } from "../../components";
import { WithMainAxisFlexDir } from "../../hooks";
import {
  connectionStore,
  getSelfMediaStream,
  getPeerMediaStream,
  connectionActions,
  MsgEvent,
  FileEvent,
} from "./connection-store";
import cn from "./content.module.css";

const ConnectedChatBubble = (p: MsgEvent) => {
  const { selfId } = connectionStore.getState();
  const prog = connectionStore((s) => s.prog[(p as FileEvent).fileKey ?? ""]);

  return (
    <ChatBubble
      key={p.createdAt + p.senderId}
      variant={selfId === p.senderId ? "mine" : "theirs"}
      msg={prog ? p.msg + "\n" + prog.msg : p.msg}
      createdAt={p.createdAt}
      downloadFile={
        prog?.isDone
          ? () => connectionActions.downloadFile((p as FileEvent).fileKey!)
          : undefined
      }
    />
  );
};

export const Content = (): JSX.Element | null => {
  const status = connectionStore((s) => s.status);
  const msgs = connectionStore((s) => s.msgs);
  const selfVideo = React.useRef<HTMLVideoElement>(null)
  const peerVideo = React.useRef<HTMLVideoElement>(null)
  React.useEffect(() => {
    if (status === "call-connected") {
      getSelfMediaStream().then((self) => {
        if (selfVideo.current && self) {
          selfVideo.current!.srcObject = self;
        }
      })
      getPeerMediaStream().then((peer) => {
        if (peerVideo.current && peer) {
          peerVideo.current!.srcObject = peer;
        }
      })
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
  if (status === "select-media") {
    return null;
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
              <video ref={selfVideo} style={vidStyle} muted playsInline autoPlay />
              <video ref={peerVideo} style={vidStyle} playsInline autoPlay controls />
            </div>
          );
        }}
      </WithMainAxisFlexDir>
    );
  }
  return status;
};
