import type { ReactNode } from "react";

import { ThemeMenu } from "@/components/layout/theme-menu";

interface SiteHeaderProps {
  children?: ReactNode;
}

/** Obere Leiste: Inhalt links, Erscheinungsbild-Menü rechts. */
export function SiteHeader({ children }: SiteHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 sm:max-w-2xl">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">{children}</div>
        <ThemeMenu />
      </div>
    </header>
  );
}
