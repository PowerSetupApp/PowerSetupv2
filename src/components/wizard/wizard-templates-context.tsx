"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";

export type WizardTemplatesValue = {
  consumerTemplates: WizardConsumerTemplate[];
  consumerCatalogError: string | null;
};

const WizardTemplatesContext = createContext<WizardTemplatesValue | null>(null);

export function WizardTemplatesProvider({
  value,
  children,
}: {
  value: WizardTemplatesValue;
  children: ReactNode;
}) {
  return <WizardTemplatesContext.Provider value={value}>{children}</WizardTemplatesContext.Provider>;
}

export function useWizardTemplates(): WizardTemplatesValue {
  const ctx = useContext(WizardTemplatesContext);
  if (!ctx) {
    throw new Error("useWizardTemplates must be used within WizardTemplatesProvider");
  }
  return ctx;
}
