"use client";

import { useEffect, useState } from "react";

import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

export function useLiveSummaryPreview(input: AlgorithmInput, enabled: boolean) {
  const [output, setOutput] = useState<AlgorithmOutput | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOutput(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/wizard/algorithm-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData: input }),
          signal: ac.signal,
        });
        if (!res.ok) {
          if (!ac.signal.aborted) setOutput(null);
          return;
        }
        const body = (await res.json()) as { output?: AlgorithmOutput };
        if (!ac.signal.aborted) {
          setOutput(body.output ?? null);
        }
      } catch {
        if (!ac.signal.aborted) setOutput(null);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [input, enabled]);

  return { output, loading };
}
