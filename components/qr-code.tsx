/* eslint-disable @next/next/no-img-element */
import React from "react";
import qr from "qrcode";
import cn from "./qr-code.module.css";

export type QrCodeProps = {
  link: string;
};

export const QrCode = (props: QrCodeProps) => {
  const [error, setError] = React.useState(props.link ? "" : "no link");
  const [value, setValue] = React.useState("");
  React.useEffect(() => {
    qr.toDataURL(props.link).then(setValue).catch(setError);
  }, [props.link]);

  if (error || !value) {
    return <span>{error}</span>;
  }

  return <img className={cn.root} alt={props.link} src={value} />;
};
