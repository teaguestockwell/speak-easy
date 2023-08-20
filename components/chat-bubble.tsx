/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Button } from "./button";
import cn from "./chat-bubble.module.css";

const imgExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];

const isImgLike = (f: File, msg: string) => {
  const imgLike = imgExtensions.some(
    (ext) =>
      f.type?.toLowerCase?.()?.endsWith(ext) ||
      msg?.toLowerCase()?.endsWith(ext) ||
      f.name.toLowerCase().endsWith(ext)
  );
  console.log({ imgLike, f, msg });
  return imgLike;
};

export type ChatBubbleProps = {
  variant: "mine" | "theirs";
  createdAt: number;
  msg: string;
  downloadFile?: () => unknown;
  getFile?: () => File | undefined;
};

const _ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  (p, ref) => {
    const time = new Date(p.createdAt).toLocaleTimeString();
    const style = {
      alignSelf: p.variant === "theirs" ? "flex-start" : "flex-end",
    };
    const [src, setSrc] = React.useState<string>()
    React.useEffect(() => {
      const f = p.getFile?.();
      if (f && isImgLike(f, p.msg)) {
        setSrc(URL.createObjectURL(f))
      }

      return () => {
        if (src) {
          URL.revokeObjectURL(src);
        }
      };
    }, [!p.getFile, p.msg]);
    return (
      <div ref={ref} className={cn.root} style={style}>
        {!p.downloadFile && <span className={cn.msg}>{p.msg}</span>}
        {src && <img alt={p.msg} src={src} className={cn.img} />}
        {p.downloadFile && !src && (
          <Button className={cn.button} onClick={p.downloadFile}>
            {p.msg}
          </Button>
        )}
        <span className={cn.time}>{time}</span>
      </div>
    );
  }
);

_ChatBubble.displayName = "chat-bubble";

export const ChatBubble = React.memo(_ChatBubble);
