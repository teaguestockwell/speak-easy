/* eslint-disable @next/next/no-img-element */
import React from "react";
import qr from "qrcode";
import cn from "./qr-code.module.css";

export type QrCodeProps = {
  link: string;
};

export const QrCode = (props: QrCodeProps) => {
  const [error, setError] = React.useState(props.link ? "" : "no link");
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    qr.toCanvas(ref.current, props.link, { width: 1000 }).catch(setError);
  }, [props.link]);

  if (error) {
    console.error("qr code", error);
    return null;
  }

  return <canvas className={cn.root} ref={ref} />;
};
