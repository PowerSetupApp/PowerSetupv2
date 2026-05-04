import type { ResultProductCard } from "@/lib/db/queries/products";
import type { AISelectionItem } from "@/lib/recommendation/types";
import type { SolarWiringRecommendation } from "@/lib/recommendation/wiring/types";
import type { ResultProductLine } from "@/lib/results/build-product-display-lines";

function reasonForProduct(productId: string, aiSelections: AISelectionItem[]): string | null {
  const hit = aiSelections.find((s) => s.productId === productId);
  const r = hit?.reasonDe?.trim();
  return r ? r : null;
}

export interface ProductRecommendationListProps {
  lines: ResultProductLine[];
  products: ResultProductCard[];
  aiSelections: AISelectionItem[];
  solarWiring?: SolarWiringRecommendation | null;
}

export function ProductRecommendationList({
  lines,
  products,
  aiSelections,
  solarWiring,
}: ProductRecommendationListProps) {
  if (lines.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">
        Noch keine passenden Produkte in der Datenbank — Admin-Katalog erweitern.
      </section>
    );
  }

  const productById = new Map(products.map((c) => [c.id, c]));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Empfohlene Produkte</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Auswahl aus dem Katalog; Links können Affiliate-Links (Amazon) sein. Fehlt ein sinnvoller
          Treffer, erscheint ein Hinweis statt „beste schwache“ Alternative.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {lines.map((line, i) => {
          if (line.type === "unmet") {
            return (
              <li
                key={`unmet-${i}-${line.bucket}-${line.contextDe ?? ""}`}
                className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
                role="status"
              >
                {line.contextDe ? (
                  <p className="font-medium text-foreground">
                    {line.contextDe}
                    <span className="text-muted-foreground"> — {line.messageDe}</span>
                  </p>
                ) : (
                  <p>{line.messageDe}</p>
                )}
              </li>
            );
          }
          const p = productById.get(line.productId);
          if (!p) {
            return (
              <li
                key={`miss-${i}-${line.productId}`}
                className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
              >
                Produkt (ID) konnte nicht aus dem Katalog geladen werden — bitte Seite neu laden oder
                Admin prüfen.
              </li>
            );
          }
          const reason = reasonForProduct(p.id, aiSelections);
          const context = line.contextDe?.trim();
          const wiringBlock =
            line.bucket === "solar" && solarWiring && solarWiring.description ? (
              <p className="text-sm text-primary/90">
                Empfohlene Verschaltung: {solarWiring.description}
                {solarWiring.rationale !== "kein-feasible" ? (
                  <>
                    {" "}
                    (MPP ca. {Math.round(solarWiring.arrayVoltageVmppV)} V, Voc Kälte ca.{" "}
                    {Math.round(solarWiring.arrayVoltageVocColdV * 10) / 10} V)
                  </>
                ) : null}
              </p>
            ) : null;
          return (
            <li
              key={`${p.id}-${i}-${context ?? ""}`}
              className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm sm:flex-row sm:items-stretch sm:gap-5"
            >
              <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-muted/40 sm:h-auto sm:w-40">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- externe Händler-URLs ohne feste Domain-Whitelist
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-full w-full object-contain p-2"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Kein Bild
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{p.categoryName}</p>
                <p className="font-semibold leading-snug text-foreground">{p.name}</p>
                {context ? <p className="text-sm text-primary/90">{context}</p> : null}
                {wiringBlock}
                {reason ? <p className="text-sm text-muted-foreground">{reason}</p> : null}
              </div>
              <div className="flex shrink-0 flex-col justify-center sm:items-end">
                {p.affiliateUrl ? (
                  <a
                    href={p.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#FF9900] px-5 text-sm font-semibold text-[#111] shadow-sm transition hover:bg-[#ec8a00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Bei Amazon ansehen
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Kein Link hinterlegt</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
