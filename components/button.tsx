import React from "react";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<any>
>((p, ref) => {
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
});

Button.displayName = "button";
