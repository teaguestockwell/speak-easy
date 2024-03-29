import React from "react";
import { Button } from "./button";
import cn from "./icon.module.css";

// https://fluenticons.co/
const icons = {
  share:
    "M6.747 4h3.464a.75.75 0 0 1 .102 1.493l-.102.007H6.747a2.25 2.25 0 0 0-2.245 2.096l-.005.154v9.5a2.25 2.25 0 0 0 2.096 2.245l.154.005h9.5a2.25 2.25 0 0 0 2.245-2.096l.005-.154v-.498a.75.75 0 0 1 1.494-.101l.006.101v.498a3.75 3.75 0 0 1-3.55 3.745l-.2.005h-9.5a3.75 3.75 0 0 1-3.745-3.55l-.005-.2v-9.5a3.75 3.75 0 0 1 3.55-3.745l.2-.005h3.464-3.464ZM14.5 6.544V3.75a.75.75 0 0 1 1.187-.61l.082.069 5.994 5.75c.28.268.306.7.077.997l-.077.085-5.994 5.752a.75.75 0 0 1-1.262-.434l-.007-.107V12.45l-.321-.006c-2.658-.008-4.93 1.083-6.865 3.301-.496.568-1.425.132-1.306-.612.827-5.14 3.6-8.045 8.19-8.559l.302-.03V3.75v2.794Z",
  back: "M12.727 3.687a1 1 0 1 0-1.454-1.374l-8.5 9a1 1 0 0 0 0 1.374l8.5 9.001a1 1 0 1 0 1.454-1.373L4.875 12l7.852-8.313Z",
  call: "m7.772 2.439 1.076-.344c1.01-.322 2.087.199 2.52 1.217l.859 2.028c.374.883.167 1.922-.514 2.568L9.819 9.706c.116 1.076.478 2.135 1.084 3.177a8.678 8.678 0 0 0 2.271 2.595l2.275-.76c.863-.287 1.802.044 2.33.821l1.233 1.81c.615.904.505 2.15-.258 2.916l-.818.821c-.814.817-1.977 1.114-3.052.778-2.539-.792-4.873-3.143-7.003-7.053-2.133-3.916-2.886-7.24-2.258-9.968.264-1.148 1.081-2.063 2.149-2.404Z",
  endCall:
    "m21.949 12.993-.198 1.037c-.184.971-1.092 1.623-2.12 1.524l-2.047-.198c-.891-.086-1.651-.72-1.878-1.566l-.631-2.355c-.935-.383-1.965-.558-3.09-.526a8.102 8.102 0 0 0-3.14.708l-.392 2.205c-.148.836-.837 1.459-1.71 1.547l-2.035.204c-1.016.102-1.989-.544-2.277-1.51l-.31-1.038c-.308-1.031-.033-2.117.721-2.85 1.781-1.73 4.75-2.598 8.907-2.604 4.164-.005 7.225.857 9.185 2.588.825.728 1.21 1.806 1.015 2.834Z",
  videoCall:
    "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 1.643.397 3.23 1.145 4.65L2.029 20.94a.85.85 0 0 0 1.036 1.036l4.29-1.117A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10ZM12 8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h3Zm3 5.162v-2.324l1.734-1.642A.75.75 0 0 1 18 9.741v4.518a.75.75 0 0 1-1.266.545L15 13.162Z",
  plus: "M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 5a.75.75 0 0 0-.743.648l-.007.102v3.5h-3.5a.75.75 0 0 0-.102 1.493l.102.007h3.5v3.5a.75.75 0 0 0 1.493.102l.007-.102v-3.5h3.5a.75.75 0 0 0 .102-1.493l-.102-.007h-3.5v-3.5A.75.75 0 0 0 12 7Z",
  arrowUp:
    "M22 12.001c0-5.523-4.476-10-10-10-5.522 0-10 4.477-10 10s4.478 10 10 10c5.524 0 10-4.477 10-10Zm-14.53.28a.75.75 0 0 1-.073-.976l.073-.085 4-4a.75.75 0 0 1 .977-.073l.085.073 4 4.001a.75.75 0 0 1-.977 1.133l-.084-.072-2.72-2.722v6.691a.75.75 0 0 1-.649.744L12 17a.75.75 0 0 1-.743-.648l-.007-.102v-6.69l-2.72 2.72a.75.75 0 0 1-.976.073l-.084-.073Z",
} as const;

type IconProps = {
  size?: number;
  name: keyof typeof icons | null;
  color?: string;
  bgColor?: string;
  onClick?: () => unknown;
  sx?: React.CSSProperties;
  buttonProps?: React.ButtonHTMLAttributes<any>;
};

export const Icon = React.forwardRef<
  SVGSVGElement | HTMLButtonElement,
  IconProps
>((p, ref: any) => {
  const { size = 34, name, color = "var(--fc-0)", bgColor = "none", sx } = p;

  const i = name && (
    <svg
      ref={p.onClick ? undefined : (ref as any)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={icons[name]}
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
      ></path>
    </svg>
  );

  if (!p.onClick) {
    return i;
  }

  return (
    <Button
      className={
        p.buttonProps?.className
          ? p.buttonProps?.className + " " + cn.icon
          : cn.icon
      }
      {...p.buttonProps}
      style={{
        background: "none",
        color: "inherit",
        border: "none",
        font: "inherit",
        cursor: "pointer",
        outline: "inert",
        width: size,
        height: size,
        padding: 4,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: bgColor,
        boxShadow: "none",
        borderRadius: "var(--rad)",
        ...sx,
      }}
      ref={ref as any}
      onClick={p.onClick}
    >
      {i}
    </Button>
  );
});

Icon.displayName = "icon";
