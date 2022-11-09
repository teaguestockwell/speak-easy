import React from "react";

export const Button = React.forwardRef(
  (p: React.ButtonHTMLAttributes<any>, ref: any) => {
    const [_, __] = React.useState(0);
    return (
      <button
        {...p}
        ref={ref}
        key={_}
        onClick={(e) => {
          p.onClick?.(e);
          __((p) => p + 1);
        }}
      />
    );
  }
);

Button.displayName = "button";
