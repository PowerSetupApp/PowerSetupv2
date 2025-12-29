"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { getGeneralSettings, updateGeneralSettings } from "@/app/actions/general-settings";
import { toast } from "sonner"; // Assuming sonner is used, or use console/alert if not

export function AmazonSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [partnerTag, setPartnerTag] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const settings = await getGeneralSettings();
            setPartnerTag(settings.amazonPartnerTag);
        } catch (error) {
            console.error("Failed to load settings:", error);
            // toast.error("Fehler beim Laden der Einstellungen");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateGeneralSettings({ amazonPartnerTag: partnerTag });
            // toast.success("Einstellungen gespeichert");
        } catch (error) {
            console.error("Failed to save settings:", error);
            // toast.error("Fehler beim Speichern");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Amazon Partnerprogramm</CardTitle>
                    <CardDescription>Hinterlege hier deinen Partner-Tag, um Provisionen zu erhalten.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="partnerTag">Partner Tag</Label>
                        <Input
                            id="partnerTag"
                            placeholder="z.B. test-21"
                            value={partnerTag}
                            onChange={(e) => setPartnerTag(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                            Dieser Tag wird automatisch an alle Amazon-Produktlinks angehängt.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Speichern
                </Button>
            </div>
        </div>
    );
}
