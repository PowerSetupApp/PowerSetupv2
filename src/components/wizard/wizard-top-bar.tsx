"use client";

import Link from "next/link";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import type { AlgorithmInput } from "@/lib/algorithm/types";

import { padWizardStep } from "./wizard-constants";

const innerMax = "mx-auto w-full max-w-[min(100%,var(--wizard-max-width))]";

export interface WizardTopBarProps {
  step: number;
  categoryLabel: string;
  input: AlgorithmInput;
}

function downloadWizardBackup(input: AlgorithmInput) {
  const blob = new Blob([JSON.stringify(input, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "powersetup-wizard-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function WizardTopBar({ step, categoryLabel, input }: WizardTopBarProps) {
  return (
    <header className="border-b border-border-1 bg-bg-2">
      <div
        className={`flex items-center justify-between px-4 py-3.5 min-[1100px]:px-10 min-[1100px]:py-[18px] ${innerMax}`}
      >
        <Link href="/" className="min-w-0 shrink">
          <Logo size={28} withText className="text-fg-1" />
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 pl-4">
          <p className="mono hidden text-right text-[13px] text-fg-2 sm:block">
            Schritt {padWizardStep(step)} / 08 ·{" "}
            <span className="text-amber-400">{categoryLabel}</span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            iconLeft={<Download className="size-4" aria-hidden />}
            onClick={() => downloadWizardBackup(input)}
          >
            <span className="hidden sm:inline">Fortschritt speichern</span>
          </Button>
        </div>
      </div>
      <div className={`border-t border-border-1/50 px-4 pb-2 sm:hidden ${innerMax}`}>
        <p className="mono text-center text-[12px] text-fg-2">
          Schritt {padWizardStep(step)} / 08 ·{" "}
          <span className="text-amber-400">{categoryLabel}</span>
        </p>
      </div>
    </header>
  );
}
