"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

const navItems = [
    { label: "Features", href: "#features" },
    { label: "Wie es funktioniert", href: "#how-it-works" },
    { label: "Preise", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
];

export function MarketingHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                        Power<span className="text-amber-500">Setup</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Button variant="ghost" asChild>
                        <Link href="/admin">Admin</Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 border-0">
                        <Link href="/wizard">Jetzt starten</Link>
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
                    <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="mt-4 flex flex-col gap-2">
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/admin">Admin</Link>
                            </Button>
                            <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 border-0">
                                <Link href="/wizard">Jetzt starten</Link>
                            </Button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
