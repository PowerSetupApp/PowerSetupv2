"use client";

import { Step1Basics } from "@/components/wizard/steps/step-1-basics";
import { Step2Energy } from "@/components/wizard/steps/step-2-energy";
import { Step3Consumers } from "@/components/wizard/steps/step-3-consumers";
import { Step4Travel } from "@/components/wizard/steps/step-4-travel";
import { Step5Autarky } from "@/components/wizard/steps/step-5-autarky";
import { Step6Cables } from "@/components/wizard/steps/step-6-cables";
import { Step7Brands } from "@/components/wizard/steps/step-7-brands";
import { Step8Review } from "@/components/wizard/steps/step-8-review";
import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";

export function WizardStepBody({
  step,
  consumerTemplates,
  consumerCatalogError,
}: {
  step: number;
  consumerTemplates: WizardConsumerTemplate[];
  consumerCatalogError: string | null;
}) {
  switch (step) {
    case 1:
      return <Step1Basics />;
    case 2:
      return <Step2Energy />;
    case 3:
      return (
        <Step3Consumers templates={consumerTemplates} catalogError={consumerCatalogError} />
      );
    case 4:
      return <Step4Travel />;
    case 5:
      return <Step5Autarky />;
    case 6:
      return <Step6Cables />;
    case 7:
      return <Step7Brands />;
    case 8:
      return <Step8Review />;
    default:
      return null;
  }
}
