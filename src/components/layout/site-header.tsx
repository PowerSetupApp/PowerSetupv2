import type { ReactNode } from "react";

import { ThemeMenu } from "@/components/layout/theme-menu";

interface SiteHeaderProps {
  children?: ReactNode;
}

/** Obere Leiste: Inhalt links, Erscheinungsbild-Menü rechts — luftig, touch-freundlich. */
export function SiteHeader({ children }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">{children}</div>
        <ThemeMenu />
      </div>
    </header>
  );
}
