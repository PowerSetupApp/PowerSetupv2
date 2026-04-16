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
          className="shrink-0 touch-manipulation"
          aria-label="Erscheinungsbild"
        >
          {mounted && active === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn(
          "z-50 min-w-[10rem] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
        )}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Erscheinungsbild
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 h-px bg-border" />
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none focus:bg-accent"
          onSelect={() => setTheme("light")}
        >
          <Sun className="size-4 shrink-0" />
          <span className="flex-1">Hell</span>
          {active === "light" ? <Check className="size-4 shrink-0 text-primary" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none focus:bg-accent"
          onSelect={() => setTheme("dark")}
        >
          <Moon className="size-4 shrink-0" />
          <span className="flex-1">Dunkel</span>
          {active === "dark" ? <Check className="size-4 shrink-0 text-primary" /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
