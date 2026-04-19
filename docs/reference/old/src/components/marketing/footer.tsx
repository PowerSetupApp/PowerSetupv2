import Link from "next/link";
import { Zap } from "lucide-react";

const footerLinks = {
    produkt: [
        { label: "Features", href: "#features" },
        { label: "Preise", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
    ],
    unternehmen: [
        { label: "Über uns", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Kontakt", href: "/contact" },
    ],
    legal: [
        { label: "Impressum", href: "/impressum" },
        { label: "Datenschutz", href: "/datenschutz" },
        { label: "AGB", href: "/agb" },
    ],
};

export function MarketingFooter() {
    return (
        <footer className="border-t border-border/40 bg-muted/30">
            <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                Power<span className="text-amber-500">Setup</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Dein persönlicher Schaltplan-Konfigurator für Camper, Wohnmobile und Boote.
                        </p>
                    </div>

                    {/* Produkt */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                            Produkt
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.produkt.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Unternehmen */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                            Unternehmen
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.unternehmen.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                            Rechtliches
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} PowerSetup. Alle Rechte vorbehalten.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground/60">
                            Made with ⚡ in Germany
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
