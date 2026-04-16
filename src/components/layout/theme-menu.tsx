"use client";

import * as React from "react";
import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeMenu() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? resolvedTheme : "light";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 min-h-11 min-w-11 shrink-0 touch-manipulation rounded-xl border-border/80 transition duration-200 ease-out"
          aria-label="Erscheinungsbild"
        >
          {mounted && active === "dark" ? <Moon className="size-5" aria-hidden /> : <Sun className="size-5" aria-hidden />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          "z-50 min-w-[11rem] rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none",
        )}
      >
        <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Erscheinungsbild
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 h-px bg-border" />
        <DropdownMenuItem
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-none transition duration-200 ease-out focus:bg-accent data-[highlighted]:bg-accent"
          onSelect={() => setTheme("light")}
        >
          <Sun className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">Hell</span>
          {active === "light" ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm outline-none transition duration-200 ease-out focus:bg-accent data-[highlighted]:bg-accent"
          onSelect={() => setTheme("dark")}
        >
          <Moon className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">Dunkel</span>
          {active === "dark" ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
