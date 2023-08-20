/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Button } from "./button";
import cn from "./chat-bubble.module.css";

const imgExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
  "tiff",
  "ico",
  "psd",
];
const videoExtensions = [
  "mp4",
  "webm",
  "ogg",
  "mov",
  "avi",
  "wmv",
  "flv",
  "mkv",
  "mpg",
  "mpeg",
  "m4v",
  "3gp",
  "vob",
  "mp3",
  "wav",
  "flac",
  "aac",
  "m4a",
  "wma",
  "ape",
];

const oneOf = (f: File, msg: string, arr: string[]) => {
  const name = f.name?.toLowerCase() ?? "";
  const type = f.type?.toLowerCase() ?? "";
  const message = msg.toLowerCase() ?? "";
  return arr.some(
    (e) => name.endsWith(e) || type.endsWith(e) || message.endsWith(e)
  );
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
    const [src, setSrc] = React.useState<string>();
    const [mediaType, setMediaType] = React.useState<"img" | "video">();
    React.useEffect(() => {
      const f = p.getFile?.();
      if (f) {
        setSrc(URL.createObjectURL(f));
      }

      if (f && oneOf(f, p.msg, imgExtensions)) {
        setMediaType("img");
      } else if (f && oneOf(f, p.msg, videoExtensions)) {
        setMediaType("video");
      }

      return () => {
        if (src) {
          URL.revokeObjectURL(src);
        }
      };
    }, [!p.getFile, p.msg]);
    return (
      <div ref={ref} className={cn.root} style={style}>
        {src && mediaType === "img" && (
          <img
            alt={p.msg}
            src={src}
            className={cn.img}
            onError={() => setMediaType(undefined)}
          />
        )}
        {src && mediaType === "video" && (
          <video
            src={src}
            className={cn.img}
            controls
            playsInline
            onError={() => setMediaType(undefined)}
          />
        )}
        {!p.downloadFile && <span className={cn.msg}>{p.msg}</span>}
        {p.downloadFile && (
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
