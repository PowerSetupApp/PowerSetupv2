import { redirect } from "next/navigation";

import { listWizardConsumerTemplates } from "@/lib/db/wizard-consumer-templates";

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

export default async function WizardPage({ params }: PageProps) {
  const { step: segments } = await params;

  if (!segments?.length) {
    redirect("/wizard/1");
  }

  const step = parseStep(segments);
  const normalized = String(step);
  if (segments[0] !== normalized) {
    redirect(`/wizard/${normalized}`);
  }

  const consumerTemplates = await listWizardConsumerTemplates();

  return <WizardClient step={step} consumerTemplates={consumerTemplates} />;
}
