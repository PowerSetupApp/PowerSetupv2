"use client";

import { useTranslations } from "next-intl";
import { useWizardStore, SchematicType } from "@/lib/store/wizard-store";
import { CardSelection } from "@/components/ui/card-selection";
import { Palette, Ruler } from "lucide-react";

export function Step9Schematic() {
    const t = useTranslations("Wizard.Step10");
    const { schematicPreference, setSchematicPreference } = useWizardStore();

    const options = [
        {
            value: "simplified",
            title: t("simplified"),
            description: t("simplified_desc"),
            icon: <Palette className="h-6 w-6" />
        },
        {
            value: "technical",
            title: t("technical"),
            description: t("technical_desc"),
            icon: <Ruler className="h-6 w-6" />
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            <CardSelection
                options={options}
                value={schematicPreference}
                onChange={(val) => setSchematicPreference(val as SchematicType)}
                columns={2}
            />
        </div>
    );
}
