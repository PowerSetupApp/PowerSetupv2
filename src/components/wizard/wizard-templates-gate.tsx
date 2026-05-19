"use client";

import type { ReactNode } from "react";

import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";

import { WizardTemplatesProvider } from "./wizard-templates-context";

export function WizardTemplatesGate({
  consumerTemplates,
  consumerCatalogError,
  children,
}: {
  consumerTemplates: WizardConsumerTemplate[];
  consumerCatalogError: string | null;
  children: ReactNode;
}) {
  return (
    <WizardTemplatesProvider value={{ consumerTemplates, consumerCatalogError }}>
      {children}
    </WizardTemplatesProvider>
  );
}
