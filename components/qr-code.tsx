/* eslint-disable @next/next/no-img-element */
import React from "react";
import qr from "qrcode";
import cn from "./qr-code.module.css";
import { useTheme } from "next-themes";

export type QrCodeProps = {
  link: string;
};

export const QrCode = (props: QrCodeProps) => {
  const { theme } = useTheme();
  const [error, setError] = React.useState(props.link ? "" : "no link");
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    qr.toCanvas(ref.current, props.link, {
      width: 1000,
      color: {
        light: theme === "dark" ? "#fff" : "#000",
        dark: theme === "dark" ? "#000" : "#fff",
      },
    }).catch(setError);
  }, [props.link, theme]);

  if (error) {
    console.error("qr code", error);
    return null;
  }

  return <canvas className={cn.root} ref={ref} />;
};
