import Link from "next/link";
import { LayoutDashboard, Package, FolderTree, Image, LogOut, Zap, Tags, Settings, FileText } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/30">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r shadow-sm z-40">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold">PowerSetup</h1>
                    <p className="text-sm text-muted-foreground">Admin Dashboard</p>
                </div>

                <nav className="p-4 space-y-2">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/products"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Package className="h-5 w-5" />
                        Produkte
                    </Link>
                    <Link
                        href="/admin/categories"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                        <FolderTree className="h-5 w-5" />
                        Kategorien
                    </Link>
                    <Link
                        href="/admin/media"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Image className="h-5 w-5" />
                        Mediathek
                    </Link>
                    <Link
                        href="/admin/consumer-devices"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Zap className="h-5 w-5" />
                        Verbraucher
                    </Link>
                    <Link
                        href="/admin/consumer-categories"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Tags className="h-5 w-5" />
                        Verbr.-Kategorien
                    </Link>
                    <Link
                        href="/admin/results"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                        <FileText className="h-5 w-5" />
                        Ergebnisse
                    </Link>
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Settings className="h-5 w-5" />
                        Einstellungen
                    </Link>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                        <LogOut className="h-5 w-5" />
                        Zur Website
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
