"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Client-only Mermaid-Renderer.
 *
 * Wird in der Debug-Ansicht von Wizard-Step 8 verwendet. Kein SSR, weil Mermaid
 * auf `document`/`DOMParser` angewiesen ist; stattdessen dynamisches Import beim
 * ersten Mount. Fehler werden inline angezeigt, damit ein kaputter Trace nicht
 * den kompletten Step versenkt.
 */
export interface MermaidDiagramProps {
  /** Mermaid-Quelltext (z. B. `flowchart TD\n  a --> b`). */
  source: string;
  /** Optionale Klasse für den Container. */
  className?: string;
  /** Test-ID für E2E/Component-Tests. */
  "data-testid"?: string;
}

let idCounter = 0;

export function MermaidDiagram({ source, className, ...rest }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSvg(null);

    async function render() {
      try {
        const mod = await import("mermaid");
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "default",
          flowchart: { htmlLabels: true, curve: "basis" },
        });
        idCounter += 1;
        const id = `mermaid-diagram-${idCounter}`;
        const { svg: rendered } = await mermaid.render(id, source);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Diagramm konnte nicht gerendert werden.");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-x-auto rounded-md border bg-muted/20 p-3", className)}
      {...rest}
    >
      {error ? (
        <pre className="whitespace-pre-wrap text-xs text-destructive">Mermaid-Fehler: {error}</pre>
      ) : svg ? (
        <div
          className="mermaid-container [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p className="text-xs text-muted-foreground">Rendere Diagramm …</p>
      )}
    </div>
  );
}

export default MermaidDiagram;
