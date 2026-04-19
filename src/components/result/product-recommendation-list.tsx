import type { AISelectionItem } from "@/lib/recommendation/types";
import type { ResultProductCard } from "@/lib/db/queries/products";

import { Button } from "@/components/ui/button";

export interface ProductRecommendationListProps {
  products: ResultProductCard[];
  aiSelections: AISelectionItem[];
}

function reasonForProduct(productId: string, aiSelections: AISelectionItem[]): string | null {
  const hit = aiSelections.find((s) => s.productId === productId);
  return hit?.reasonDe ?? null;
}

export function ProductRecommendationList({ products, aiSelections }: ProductRecommendationListProps) {
  if (products.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">
        Noch keine passenden Produkte in der Datenbank — Admin-Katalog erweitern.
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Empfohlene Produkte</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Auswahl aus dem Katalog; Links können Affiliate-Links (Amazon) sein.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {products.map((p) => {
          const reason = reasonForProduct(p.id, aiSelections);
          return (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{p.categoryName}</p>
                <p className="truncate font-semibold text-foreground">{p.name}</p>
                {reason ? <p className="mt-1 text-sm text-muted-foreground">{reason}</p> : null}
                {p.price != null ? (
                  <p className="mt-1 text-sm font-medium text-foreground">{p.price.toFixed(2)} €</p>
                ) : null}
              </div>
              {p.affiliateUrl ? (
                <Button asChild variant="default" className="h-11 shrink-0 rounded-xl">
                  <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
                    Zu Amazon
                  </a>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Kein Link hinterlegt</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
