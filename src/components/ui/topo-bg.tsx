import * as React from "react";

import { cn } from "@/lib/utils";

export interface TopoBgProps extends React.HTMLAttributes<HTMLDivElement> {
  opacity?: number;
  size?: number;
  tint?: boolean;
}

export function TopoBg({ opacity = 1, size = 360, tint, className, style, ...props }: TopoBgProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", tint && "mix-blend-screen", className)}
      style={{
        backgroundImage: "var(--topo-pattern)",
        backgroundSize: `${size}px`,
        opacity,
        ...style,
      }}
      aria-hidden
      {...props}
    />
  );
}
