import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { StreamingFallback } from "@/components/streaming-fallback";
import { listWizardConsumerTemplates } from "@/lib/db/queries/wizard-consumer-templates";

import { WizardClient } from "./wizard-client";

type PageProps = {
  params: Promise<{ step?: string[] }>;
};

function parseStep(segments: string[] | undefined): number {
  if (!segments?.length) return 1;
  const raw = segments[0];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1 || n > 8) return 1;
  return n;
}

export default function WizardPage(props: PageProps) {
  return (
    <Suspense fallback={<StreamingFallback />}>
      <WizardPageBody {...props} />
    </Suspense>
  );
}

async function WizardPageBody({ params }: PageProps) {
  await connection();

  const { step: segments } = await params;

  if (!segments?.length) {
    redirect("/wizard/1");
  }

  const step = parseStep(segments);
  const normalized = String(step);
  if (segments[0] !== normalized) {
    redirect(`/wizard/${normalized}`);
  }

  const result = await listWizardConsumerTemplates();
  const consumerTemplates = result.ok ? result.data : [];
  const consumerCatalogError = result.ok ? null : result.message;

  return (
    <WizardClient
      step={step}
      consumerTemplates={consumerTemplates}
      consumerCatalogError={consumerCatalogError}
    />
  );
}
