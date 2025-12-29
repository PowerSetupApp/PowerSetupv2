import { AISettings } from "@/components/admin/settings/ai-settings";
import { AmazonSettings } from "@/components/admin/settings/amazon-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSettingsPage() {
    return (
        <div className="container mx-auto py-6 max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
                <p className="text-muted-foreground">
                    Konfiguriere Systemeinstellungen und KI-Verhalten.
                </p>
            </div>

            <Tabs defaultValue="ai" className="w-full">
                <TabsList>
                    <TabsTrigger value="ai">KI & Modelle</TabsTrigger>
                    <TabsTrigger value="amazon">Amazon</TabsTrigger>
                    <TabsTrigger value="general" disabled>Allgemein</TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="mt-6">
                    <AISettings />
                </TabsContent>
                <TabsContent value="amazon" className="mt-6">
                    <AmazonSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
