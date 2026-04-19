"use client";

import { Bug, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Step8DebugPanel } from "@/components/wizard/steps/step-8-debug-panel";
import type { DebugTraceState } from "@/components/wizard/steps/use-wizard-step8-debug-trace";
import { cn } from "@/lib/utils";

type Props = {
  canSubmit: boolean;
  debugOpen: boolean;
  onDebugOpenChange: (open: boolean) => void;
  debugState: DebugTraceState;
  exportJson: string;
};

export function Step8DebugFab({
  canSubmit,
  debugOpen,
  onDebugOpenChange,
  debugState,
  exportJson,
}: Props) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          "fixed z-40 size-12 rounded-full border border-border/80 shadow-lg",
          "bottom-[calc(5.5rem+env(safe-area-inset-bottom)+0.5rem)] right-4 sm:right-6",
        )}
        aria-haspopup="dialog"
        aria-expanded={debugOpen}
        aria-label="Entwickler-Ansicht öffnen"
        onClick={() => onDebugOpenChange(true)}
      >
        <Bug className="size-5" aria-hidden />
      </Button>

      <Dialog open={debugOpen} onOpenChange={onDebugOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Entwickler-Ansicht</DialogTitle>
            <DialogDescription>
              Zwischenwerte des Algorithmus und JSON-Export für Support &amp; Debugging.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="debug" className="w-full">
            <TabsList>
              <TabsTrigger value="debug">Zwischenwerte</TabsTrigger>
              <TabsTrigger value="json">JSON-Export</TabsTrigger>
            </TabsList>
            <TabsContent value="debug" className="max-h-[55vh] overflow-y-auto pr-1">
              <Step8DebugPanel
                canSubmit={canSubmit}
                enabled={canSubmit && debugOpen}
                onToggle={() => {}}
                state={debugState}
                hideToggle
              />
            </TabsContent>
            <TabsContent value="json" className="flex flex-col gap-2">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void copyJson()}>
                  {copied ? (
                    <Check className="size-4 text-emerald-600" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                  {copied ? "Kopiert" : "Kopieren"}
                </Button>
              </div>
              <textarea
                readOnly
                value={exportJson}
                className="min-h-[280px] w-full rounded-xl border border-border/70 bg-muted/20 p-3 font-mono text-xs text-foreground"
                onFocus={(e) => e.currentTarget.select()}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
