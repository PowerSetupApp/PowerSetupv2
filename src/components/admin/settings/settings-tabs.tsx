"use client";

import { AmazonSettingsPanel } from "@/components/admin/settings/amazon-settings-panel";
import { AISettingsPanel } from "@/components/admin/settings/ai-settings-panel";
import { AlgorithmSettingsPanel } from "@/components/admin/settings/algorithm-settings-panel";
import { AlgorithmTestPanel } from "@/components/admin/settings/algorithm-test-panel";
import { CatalogDataSettings } from "@/components/admin/settings/catalog-data-settings";
import { PricingSettingsPanel } from "@/components/admin/settings/pricing-settings-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminSettingsTabs() {
  return (
    <Tabs defaultValue="ai" className="w-full">
      <TabsList className="h-auto min-h-10 w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="ai">KI &amp; Modelle</TabsTrigger>
        <TabsTrigger value="algorithm">Algorithmus</TabsTrigger>
        <TabsTrigger value="algorithm-test">Algorithmus testen</TabsTrigger>
        <TabsTrigger value="pricing">Preise</TabsTrigger>
        <TabsTrigger value="amazon">Amazon</TabsTrigger>
        <TabsTrigger value="data">Daten</TabsTrigger>
      </TabsList>
      <TabsContent value="ai">
        <AISettingsPanel />
      </TabsContent>
      <TabsContent value="algorithm">
        <AlgorithmSettingsPanel />
      </TabsContent>
      <TabsContent value="algorithm-test">
        <AlgorithmTestPanel />
      </TabsContent>
      <TabsContent value="pricing">
        <PricingSettingsPanel />
      </TabsContent>
      <TabsContent value="amazon">
        <AmazonSettingsPanel />
      </TabsContent>
      <TabsContent value="data">
        <CatalogDataSettings />
      </TabsContent>
    </Tabs>
  );
}
