import React from "react";
import { Button } from "./button";

const icons = {
  back: "M12.727 3.687a1 1 0 1 0-1.454-1.374l-8.5 9a1 1 0 0 0 0 1.374l8.5 9.001a1 1 0 1 0 1.454-1.373L4.875 12l7.852-8.313Z",
  call: "m7.772 2.439 1.076-.344c1.01-.322 2.087.199 2.52 1.217l.859 2.028c.374.883.167 1.922-.514 2.568L9.819 9.706c.116 1.076.478 2.135 1.084 3.177a8.678 8.678 0 0 0 2.271 2.595l2.275-.76c.863-.287 1.802.044 2.33.821l1.233 1.81c.615.904.505 2.15-.258 2.916l-.818.821c-.814.817-1.977 1.114-3.052.778-2.539-.792-4.873-3.143-7.003-7.053-2.133-3.916-2.886-7.24-2.258-9.968.264-1.148 1.081-2.063 2.149-2.404Z",
  endCall:
    "m21.949 12.993-.198 1.037c-.184.971-1.092 1.623-2.12 1.524l-2.047-.198c-.891-.086-1.651-.72-1.878-1.566l-.631-2.355c-.935-.383-1.965-.558-3.09-.526a8.102 8.102 0 0 0-3.14.708l-.392 2.205c-.148.836-.837 1.459-1.71 1.547l-2.035.204c-1.016.102-1.989-.544-2.277-1.51l-.31-1.038c-.308-1.031-.033-2.117.721-2.85 1.781-1.73 4.75-2.598 8.907-2.604 4.164-.005 7.225.857 9.185 2.588.825.728 1.21 1.806 1.015 2.834Z",
  videoCall:
    "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 1.643.397 3.23 1.145 4.65L2.029 20.94a.85.85 0 0 0 1.036 1.036l4.29-1.117A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10ZM12 8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h3Zm3 5.162v-2.324l1.734-1.642A.75.75 0 0 1 18 9.741v4.518a.75.75 0 0 1-1.266.545L15 13.162Z",
  comment:
    "M5.25 18A3.25 3.25 0 0 1 2 14.75v-8.5A3.25 3.25 0 0 1 5.25 3h13.5A3.25 3.25 0 0 1 22 6.25v8.5A3.25 3.25 0 0 1 18.75 18h-5.785l-5.387 3.817A1 1 0 0 1 6 21.002V18h-.75Z",
} as const;

type IconProps = {
  size?: number;
  name: keyof typeof icons;
  color?: string;
  bgColor?: string;
  onClick?: () => unknown;
  sx?: React.CSSProperties
};

export const Icon = React.forwardRef<
  SVGSVGElement | HTMLButtonElement,
  IconProps
>((p, ref) => {
  const { size = 32, name, color = "var(--fc-0)", bgColor = "none", sx } = p;

  const i = (
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
        ...sx
      }}
      ref={ref as any}
      onClick={p.onClick}
    >
      {i}
    </Button>
  );
});

Icon.displayName = "icon";
