import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { WizardStepBody } from "@/components/wizard/wizard-step-body";
import { WizardTemplatesGate } from "@/components/wizard/wizard-templates-gate";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  type DbReadResult,
} from "@/lib/db/prisma-errors";
import { listWizardConsumerTemplates } from "@/lib/db/queries/wizard-consumer-templates";
import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";
import { wizardStepFromParam } from "@/lib/wizard/wizard-step-from-param";

type PageProps = {
  params: Promise<{ step: string }>;
};

function WizardStepPageFallback() {
  return (
    <div className="flex min-h-[min(50vh,28rem)] flex-1 items-center justify-center px-4">
      <LoadingIndicator />
    </div>
  );
}

export default function WizardStepPage({ params }: PageProps) {
  return (
    <Suspense fallback={<WizardStepPageFallback />}>
      <WizardStepPageAsync params={params} />
    </Suspense>
  );
}

async function WizardStepPageAsync({ params }: PageProps) {
  await connection();

  const { step: raw } = await params;
  const step = wizardStepFromParam(raw);
  if (step === null) {
    redirect("/wizard/1");
  }
  if (String(step) !== raw) {
    redirect(`/wizard/${step}`);
  }

  const result = await loadConsumerTemplatesSafely();
  const consumerTemplates = result.ok ? result.data : [];
  const consumerCatalogError = result.ok ? null : result.message;

  return (
    <WizardTemplatesGate
      consumerTemplates={consumerTemplates}
      consumerCatalogError={consumerCatalogError}
    >
      <WizardStepBody step={step} />
    </WizardTemplatesGate>
  );
}

/** Verhindert Prisma-Infra-Crashes im Error-Overlay (z. B. Neon P1001, Schema-Drift). */
async function loadConsumerTemplatesSafely(): Promise<
  DbReadResult<WizardConsumerTemplate[]>
> {
  try {
    return await listWizardConsumerTemplates();
  } catch {
    return {
      ok: false,
      reason: "database_unavailable",
      message: DATABASE_UNAVAILABLE_MESSAGE,
    };
  }
}
