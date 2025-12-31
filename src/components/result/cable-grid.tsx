"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, ArrowRightLeft } from "lucide-react";
import Image from "next/image";

interface CableGridProps {
    products: any[];
    cableLengths?: Record<string, number | any>;
}

const ROUTE_LABELS: Record<string, string> = {
    'inverter_to_battery': 'Wechselrichter ↔ Versorgerbatterie',
    'starter_to_booster': 'Starterbatterie ↔ Ladebooster',
    'booster_to_service': 'Ladebooster ↔ Versorgerbatterie',
    'solar_to_regulator': 'Solarmodul (PV) ↔ Solar-Laderegler',
    'service_to_regulator': 'Solar-Laderegler ↔ Versorgerbatterie',
    'charger_to_service': 'Batterieladegerät ↔ Versorgerbatterie',
    'battery_to_fusebox': 'Versorgerbatterie ↔ Sicherungskasten',
};

// Helper: Infer route from reason text if "route" property is missing
function inferRouteFromReason(reason: string): string {
    const r = reason.toLowerCase();
    if (r.includes('wechselrichter') || r.includes('inverter')) return 'inverter_to_battery';
    if (r.includes('starter') && r.includes('booster')) return 'starter_to_booster';
    if (r.includes('booster') && (r.includes('versorger') || r.includes('batterie'))) return 'booster_to_service';
    // Order matters: "Solar -> Regulator" vs "Regulator -> Battery"
    // "Solar -> Regulator" usually mentions "Solar" or "PV"
    // "Regulator -> Battery" mentions "Regulator" and "Battery"
    if (r.includes('laderegler') && (r.includes('versorger') || r.includes('aufbau'))) return 'service_to_regulator';
    if (r.includes('solar') && r.includes('laderegler')) return 'solar_to_regulator';
    if (r.includes('solar')) return 'solar_to_regulator'; // Fallback

    if (r.includes('sicherung') || r.includes('fuse')) return 'battery_to_fusebox';
    return 'unknown';
}

export function CableGrid({ products, cableLengths }: CableGridProps) {
    if (!products || products.length === 0) return null;

    // 1. Group products by route
    const groups: Record<string, any[]> = {};

    products.forEach(p => {
        let route = p.route;
        if (!route) {
            route = inferRouteFromReason(p.reason || p.explanation || '');
        }
        if (!groups[route]) groups[route] = [];
        groups[route].push(p);
    });

    // Handle Amazon Click
    const handleAmazonClick = (e: React.MouseEvent, url: string) => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !(window as any).MSStream;
        if (isIOS) {
            e.preventDefault();
            window.location.href = url.replace(/^https?:\/\//, 'com.amazon.mobile.shopping.web://');
            setTimeout(() => window.open(url, '_blank'), 2500);
        } else {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(groups).map(([route, groupProducts]) => {
                const title = ROUTE_LABELS[route] || 'Kabel-Set';

                // --- LENGTH RESOLUTION ---
                // Priority 1: Exact match from Wizard Inputs (Source of Truth)
                let lengthDisplay: string | number | null = null;

                if (cableLengths) {
                    if (route === 'inverter_to_battery') lengthDisplay = cableLengths.serviceToInverter;
                    else if (route === 'starter_to_booster') lengthDisplay = cableLengths.starterToService;
                    else if (route === 'booster_to_service') lengthDisplay = cableLengths.boosterToService;
                    else if (route === 'solar_to_regulator') lengthDisplay = cableLengths.solarToRegulator;
                    else if (route === 'service_to_regulator') lengthDisplay = cableLengths.serviceToRegulator;
                    else if (route === 'battery_to_fusebox') lengthDisplay = cableLengths.batteryToFuseBox;
                }

                // Priority 2: Fallback to Product Attributes if wizard data missing
                if (!lengthDisplay) {
                    const firstProduct = groupProducts[0];
                    lengthDisplay = firstProduct.length || firstProduct.amount;
                }

                // Formatting
                if (lengthDisplay && !isNaN(parseFloat(lengthDisplay as string)) && !lengthDisplay.toString().match(/[a-zA-Z]/)) {
                    lengthDisplay = `${lengthDisplay} m`;
                } else if (lengthDisplay) {
                    // Ensure "m" is present if it's just a number string
                    // (Handled above by isNaN check, but here we catch existing strings like "1 Stück" vs "1 m")
                }

                // Shared Reason (take the longest one, usually slightly better)
                const sharedReason = groupProducts.reduce((prev, curr) =>
                    (curr.reason?.length > prev.reason?.length) ? curr : prev
                ).reason || groupProducts[0].explanation;

                return (
                    <Card key={route} className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                        {/* Header */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
                                {title}
                            </h3>
                            {lengthDisplay && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                                    {lengthDisplay}
                                </span>
                            )}
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Products Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {groupProducts.map((product, idx) => (
                                    <div key={idx} className="flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        {/* Image */}
                                        <div className="relative w-16 h-16 shrink-0 bg-white rounded border border-gray-100 p-1">
                                            {product.imageUrl ? (
                                                <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl">🔌</div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                                            <p className="text-sm font-medium leading-tight line-clamp-2" title={product.name}>
                                                {product.name}
                                            </p>
                                            <Button
                                                size="sm"
                                                className="w-full h-7 text-[10px] bg-[#FF9900] hover:bg-[#E68A00] text-white cursor-pointer"
                                                onClick={(e) => handleAmazonClick(e, product.affiliateUrl)}
                                            >
                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                Amazon
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Shared Reason */}
                            {sharedReason && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded text-sm text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/10">
                                    <span className="font-bold opacity-70 block mb-1 text-[10px] uppercase">Warum dieses Set?</span>
                                    {sharedReason}
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
