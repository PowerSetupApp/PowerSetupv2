import type { AlgorithmInput } from "@/lib/algorithm/types";

/** Pro Schritt: Mindestanforderungen bevor „Weiter“ erlaubt ist (MVP). */
export function validateWizardStep(step: number, input: AlgorithmInput): boolean {
  switch (step) {
    case 1:
      return true;
    case 2:
      return input.energySources.length >= 1;
    case 3:
      return input.consumers.length >= 1;
    case 4:
      return true;
    case 5:
      return true;
    case 6:
      return Object.values(input.cableLengths).every((m) => m > 0);
    case 7:
      return true;
    case 8:
      return true;
    default:
      return false;
  }
}

/** Schritte 1 … (target-1) müssen gültig sein, um per Fortschrittsleiste vorzuspringen. */
export function canNavigateToStep(
  targetStep: number,
  activeStep: number,
  input: AlgorithmInput,
): boolean {
  if (targetStep < 1 || targetStep > 8) return false;
  if (targetStep === activeStep) return true;
  if (targetStep < activeStep) return true;
  for (let s = activeStep; s < targetStep; s += 1) {
    if (!validateWizardStep(s, input)) return false;
  }
  return true;
}

/** Für `ProgressSteps`: abgeschlossen = vor aktuellem Schritt und valide. */
export function completedWizardStepIds(activeStep: number, input: AlgorithmInput): number[] {
  const out: number[] = [];
  for (let id = 1; id < activeStep; id += 1) {
    if (validateWizardStep(id, input)) out.push(id);
  }
  return out;
}
