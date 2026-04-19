import type { AlgorithmInput } from "@/lib/algorithm/types";

import { areRequiredCableLengthsValid } from "./cable-length-keys";

/** Pro Schritt: Mindestanforderungen bevor „Weiter“ erlaubt ist (MVP). */
export function validateWizardStep(step: number, input: AlgorithmInput): boolean {
  switch (step) {
    case 1:
      return true;
    case 2: {
      if (input.energySources.length < 1) return false;
      if (input.energySources.includes("solar")) {
        if (input.roofAreas.length < 1) return false;
        return input.roofAreas.every(
          (a) => a.name.length >= 1 && Number.isFinite(a.length) && a.length > 0 && Number.isFinite(a.width) && a.width > 0,
        );
      }
      return true;
    }
    case 3:
      return input.consumers.length >= 1;
    case 4:
      return true;
    case 5:
      return true;
    case 6:
      return areRequiredCableLengthsValid(input);
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

/** Schritte 1–7 müssen valide sein, um ein Result zu speichern / zu berechnen (Schritt 8). */
export function isWizardCompleteForSubmission(input: AlgorithmInput): boolean {
  for (let step = 1; step <= 7; step += 1) {
    if (!validateWizardStep(step, input)) return false;
  }
  return true;
}
