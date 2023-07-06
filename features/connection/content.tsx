import React from "react";
import { Button, ChatBubble } from "../../components";
import { WithMainAxisFlexDir } from "../../hooks";
import {
  connectionStore,
  getSelfMediaStream,
  getPeerMediaStream,
  useStore,
  MsgEvent,
  FileEvent,
} from "./connection-store";
import cn from "./content.module.css";
import { QrCode } from "../../components/qr-code";
import { copyTextToClipboard } from "./copy-to-clipboard";
import { Icon } from "../../components/icon";

const ConnectedChatBubble = (p: MsgEvent) => {
  const { selfId } = connectionStore.get();
  const prog = useStore((s) => s.prog[(p as FileEvent).fileKey ?? ""]);

  return (
    <ChatBubble
      key={p.createdAt + p.senderId}
      variant={selfId === p.senderId ? "mine" : "theirs"}
      msg={prog ? p.msg + "\n" + prog.msg : p.msg}
      createdAt={p.createdAt}
      downloadFile={
        prog?.isDone
          ? () => connectionStore.lpc.downloadFile((p as FileEvent).fileKey!)
          : undefined
      }
    />
  );
};

export const Content = (): JSX.Element | null => {
  const status = useStore((s) => s.status);
  const msgs = useStore((s) => s.msgs);
  const selfId = useStore((s) => s.selfId);
  const selfVideo = React.useRef<HTMLVideoElement>(null);
  const peerVideo = React.useRef<HTMLVideoElement>(null);
  React.useLayoutEffect(() => {
    if (status === "call-connected") {
      getSelfMediaStream().then((self) => {
        if (selfVideo.current && self) {
          selfVideo.current!.srcObject = self;
        }
      });
      getPeerMediaStream().then((peer) => {
        if (peerVideo.current && peer) {
          peerVideo.current!.srcObject = peer;
        }
      });
    }
  });

  const flex = <div className={cn.flex} />;

  if (status === "enter-self-id") {
    return (
      <div className={cn.flexCol}>
        <Icon size={150} name="call" />
        <span className={cn.title}>Speak Easy</span>
        <span className={cn.subTitle}>
          encrypted peer to peer chat, video and file sharing
        </span>
      </div>
    );
  }
  if (status === "connecting-self") {
    return flex;
  }
  if (status == "awaiting-peer") {
    const url =
      window.location.origin +
      window.location.pathname +
      `?peer=${encodeURIComponent(selfId)}`;
    const copy = () => copyTextToClipboard(url);
    return (
      <div className={cn.flexCol}>
        <QrCode
          link={
            window.location.origin +
            window.location.pathname +
            `?peer=${encodeURIComponent(selfId)}`
          }
        />
        <span className={cn.title}>connect to peer</span>
        <span className={cn.subTitle}>your id is: {selfId}</span>
        <Button className={cn.but} onClick={copy}>
          copy magic link
        </Button>
      </div>
    );
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
              <video
                ref={selfVideo}
                style={vidStyle}
                muted
                playsInline
                autoPlay
              />
              <video
                ref={peerVideo}
                style={vidStyle}
                playsInline
                autoPlay
                controls
              />
            </div>
          );
        }}
      </WithMainAxisFlexDir>
    );
  }
  return status;
};
