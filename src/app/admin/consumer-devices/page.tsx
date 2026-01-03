
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function ConsumerDevicesPage() {
    const categories = await prisma.consumerCategory.findMany({
        include: {
            devices: {
                orderBy: { sortOrder: "asc" },
            },
        },
        orderBy: {
            sortOrder: "asc",
        },
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Verbraucher-Geräte</h1>
                    <p className="text-muted-foreground">
                        Konfigurieren Sie die Geräte für den Wizard
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/consumer-devices/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Neues Gerät
                    </Link>
                </Button>
            </div>

            {categories.map((cat) => (
                <div key={cat.id} className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <span className="text-xl">{cat.icon}</span>
                        <h2 className="text-lg font-semibold">{cat.name}</h2>
                        <span className="text-sm text-muted-foreground ml-auto">
                            {cat.devices.length} Geräte
                        </span>
                    </div>

                    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-6 py-4 font-medium w-16">Icon</th>
                                    <th className="text-left px-6 py-4 font-medium">Name</th>
                                    <th className="text-left px-6 py-4 font-medium">Standard-Werte</th>
                                    <th className="text-left px-6 py-4 font-medium">Optionen</th>
                                    <th className="text-center px-6 py-4 font-medium">Featured</th>
                                    <th className="text-right px-6 py-4 font-medium">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {cat.devices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            Keine Geräte in dieser Kategorie.
                                        </td>
                                    </tr>
                                ) : (
                                    cat.devices.map((device) => (
                                        <tr key={device.id} className="hover:bg-muted/30">
                                            <td className="px-6 py-4 text-xl">{device.icon}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{device.name}</div>
                                                {device.i18nKey && (
                                                    <div className="text-xs text-muted-foreground font-mono">
                                                        {device.i18nKey}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm space-y-1">
                                                <div>⚡ {device.defaultPower} W</div>
                                                <div>🔌 {['12V', '24V', '48V', 'user'].includes(device.defaultVoltage) ? 'System' : device.defaultVoltage}</div>
                                                <div>🕒 {Math.round(device.defaultHoursPerDay * 60)} min/Tag</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {device.isCooling && (
                                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">Kühlgerät</span>
                                                    )}
                                                    {device.showFixedOption && (
                                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">Fest verbaut Option</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {device.isFeatured && (
                                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/admin/consumer-devices/${device.id}`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
