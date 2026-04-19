"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderTree,
  Image,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Tags,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Produkte", icon: Package },
  { href: "/admin/brands", label: "Marken", icon: Tags },
  { href: "/admin/categories", label: "Kategorien", icon: FolderTree },
  { href: "/admin/media", label: "Mediathek", icon: Image },
  { href: "/admin/consumer-devices", label: "Verbraucher", icon: Zap },
  { href: "/admin/consumer-categories", label: "Verbr.-Kategorien", icon: Layers },
  { href: "/admin/results", label: "Ergebnisse", icon: FileText },
  { href: "/admin/settings", label: "Einstellungen", icon: Settings },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: (typeof navItems)[number]["icon"];
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-200 ease-out",
        active
          ? "bg-primary/12 font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
      {label}
    </Link>
  );
}

function NavLinksStatic() {
  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition duration-200 ease-out",
            "hover:bg-accent/60 hover:text-foreground",
          )}
        >
          <item.icon className="size-5 shrink-0 opacity-90" aria-hidden />
          {item.label}
        </Link>
      ))}
    </>
  );
}

function AdminNavLinks() {
  return (
    <>
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-muted/25">
      <a
        href="#admin-main"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:shadow-lg motion-reduce:transition-none"
      >
        Zum Inhalt springen
      </a>
      <div className="flex min-h-dvh flex-col md:flex-row">
        <aside className="z-40 flex w-full shrink-0 flex-col border-b border-border/80 bg-card/95 backdrop-blur-sm max-md:max-h-[min(50dvh,22rem)] md:sticky md:top-0 md:h-dvh md:w-[17rem] md:border-b-0 md:border-r">
          <div className="border-b border-border/70 px-4 py-4 sm:px-5 sm:py-5">
            <p className="font-display text-lg font-normal tracking-tight text-foreground">PowerSetup</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Admin">
            <Suspense fallback={<NavLinksStatic />}>
              <AdminNavLinks />
            </Suspense>
          </nav>
          <div className="border-t border-border/70 p-3">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition duration-200 ease-out hover:bg-accent/60 hover:text-foreground"
            >
              <LogOut className="size-5 shrink-0" aria-hidden />
              Zur Website
            </Link>
          </div>
        </aside>
        <main id="admin-main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
