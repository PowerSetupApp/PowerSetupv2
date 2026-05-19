"use client";

import { LoadingSpinner } from "@/components/ui/loading-indicator";
import { Step8AlgorithmPreview } from "@/components/wizard/steps/step-8-algorithm-preview";
import type { AlgorithmOutput } from "@/lib/algorithm/types";

export function Step8PreviewBlock({
  loading,
  error,
  output,
  onAddBag200,
}: {
  loading: boolean;
  error: string | null;
  output: AlgorithmOutput | null;
  onAddBag200?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoadingSpinner className="size-4" />
          Berechnung auf dem Server …
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {output ? <Step8AlgorithmPreview output={output} onAddBag200={onAddBag200} /> : null}
    </div>
  );
}
