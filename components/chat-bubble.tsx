import React from "react";
import { Button } from "./button";
import cn from "./chat-bubble.module.css";

export type ChatBubbleProps = {
  variant: "mine" | "theirs";
  createdAt: number;
  msg: string;
  downloadFile?: () => unknown;
};

const _ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  (p, ref) => {
    const time = new Date(p.createdAt).toLocaleTimeString();
    const style = {
      alignSelf: p.variant === "theirs" ? "flex-start" : "flex-end",
    };
    return (
      <div ref={ref} className={cn.root} style={style}>
        {!p.downloadFile && <span className={cn.msg}>{p.msg}</span>}
        {p.downloadFile && <Button onClick={p.downloadFile}>{p.msg}</Button>}
        <span className={cn.time}>{time}</span>
      </div>
    );
  }
);

_ChatBubble.displayName = "chat-bubble";

export const ChatBubble = React.memo(_ChatBubble);
