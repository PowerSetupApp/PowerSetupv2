"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Plus, X, Check } from "lucide-react";
import { PresetDevice } from "@/lib/data/preset-devices"; // Type reuse
import { useTranslations } from "next-intl";

interface DeviceSearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddDevices: (devices: PresetDevice[]) => void;
    systemVoltage: '12V' | '24V' | '48V';
    availableDevices: PresetDevice[]; // New prop
}

export function DeviceSearchModal({
    open,
    onOpenChange,
    onAddDevices,
    systemVoltage,
    availableDevices,
}: DeviceSearchModalProps) {
    const t = useTranslations("Wizard.Step4");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedDevices, setSelectedDevices] = React.useState<PresetDevice[]>([]);

    const searchResults = React.useMemo(() => {
        if (!searchQuery) return availableDevices;
        const lowerQuery = searchQuery.toLowerCase();
        return availableDevices.filter(d =>
            d.name.toLowerCase().includes(lowerQuery) ||
            (d.keywords && d.keywords.some(k => k.toLowerCase().includes(lowerQuery)))
        );
    }, [searchQuery, availableDevices]);

    const isSelected = (deviceId: string) => {
        return selectedDevices.some(d => d.id === deviceId);
    };

    const handleToggleDevice = (device: PresetDevice) => {
        if (isSelected(device.id)) {
            setSelectedDevices(prev => prev.filter(d => d.id !== device.id));
        } else {
            setSelectedDevices(prev => [...prev, device]);
        }
    };

    const handleFinish = () => {
        onAddDevices(selectedDevices);
        setSelectedDevices([]);
        setSearchQuery("");
        onOpenChange(false);
    };

    const handleClose = () => {
        setSelectedDevices([]);
        setSearchQuery("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t("DeviceModal.title")}</DialogTitle>
                </DialogHeader>

                {/* Selected Devices Chips */}
                {selectedDevices.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                        {selectedDevices.map(device => (
                            <button
                                key={device.id}
                                onClick={() => handleToggleDevice(device)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                                    "bg-primary/10 text-primary text-sm font-medium",
                                    "hover:bg-primary/20 transition-colors"
                                )}
                            >
                                <span>{device.icon}</span>
                                <span>{device.name}</span>
                                <X className="h-3.5 w-3.5 ml-1" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("DeviceModal.search_placeholder")}
                        className="pl-10 h-12"
                        autoFocus
                    />
                </div>

                {/* Device List */}
                <div className="max-h-[300px] overflow-y-auto space-y-1 -mx-2 px-2">
                    {searchResults.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t("DeviceModal.no_results")}
                        </div>
                    ) : (
                        searchResults.map(device => {
                            const selected = isSelected(device.id);
                            return (
                                <button
                                    key={device.id}
                                    onClick={() => handleToggleDevice(device)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg",
                                        "transition-all duration-150",
                                        selected
                                            ? "bg-primary/10 border border-primary"
                                            : "hover:bg-muted border border-transparent"
                                    )}
                                >
                                    <span className="text-2xl">{device.icon}</span>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium">{device.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            ~{device.defaultPower}W • {device.defaultVoltage}
                                        </div>
                                    </div>
                                    {selected ? (
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    ) : (
                                        <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        {t("DeviceModal.cancel")}
                    </Button>
                    <Button
                        onClick={handleFinish}
                        disabled={selectedDevices.length === 0}
                        className="gap-2"
                    >
                        <Check className="h-4 w-4" />
                        {t("DeviceModal.finish")} ({selectedDevices.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
