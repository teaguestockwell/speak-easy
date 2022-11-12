import { Icon } from "./icon";
import cn from "./upload.module.css";
import React from "react";

export type UploadProps = {
  onFile: (f: File) => unknown;
};

export const Upload = (props: UploadProps) => {
  const ref = React.useRef<HTMLInputElement>();
  return (
    <div
      tabIndex={0}
      className={cn.root}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          ref.current?.click();
        }
      }}
    >
      <input
        ref={ref as any}
        className={cn.input}
        type="file"
        tabIndex={-1}
        onChange={(e) => {
          e.preventDefault();
          const f = e.target.files?.[0];
          if (!f) {
            return;
          }
          props.onFile(f);
        }}
      />
      <Icon
        sx={{ zIndex: 1 }}
        name="plus"
        onClick={() => {
          ref.current?.click();
        }}
        buttonProps={{
          tabIndex: -1,
        }}
      />
    </div>
  );
};
