# Admin API routes (snapshot under `docs/reference/old`)

Files found under [`../old/src/app/api/admin/`](../old/src/app/api/admin/):

| Method | Path | Role |
|--------|------|------|
| * | `products/route.ts` | List/create products |
| GET, PUT, DELETE | `products/[id]/route.ts` | Single product |
| * | `categories/route.ts` | List/create categories |
| GET, PUT, DELETE | `categories/[id]/route.ts` | Single category |
| GET, POST | `categories/[id]/filters/route.ts` | List/create filters |
| PUT, DELETE | `categories/[id]/filters/[filterId]/route.ts` | Update/delete filter |
| POST | `optimize-specs/route.ts` | AI compress product specs |
| POST | `seed-filters/route.ts` | Seed filter definitions (ops) |
| POST | `migrate/route.ts` | Migration helper (ops) |
| * | `consumer-devices/route.ts` | List/create devices |
| GET, PUT, DELETE | `consumer-devices/[id]/route.ts` | Single device |
| * | `consumer-categories/route.ts` | List/create consumer categories |
| GET, PUT, DELETE | `consumer-categories/[id]/route.ts` | Single consumer category |
| POST | `media/upload/route.ts` | Upload image → storage URL |

## Referenced by UI but missing from snapshot

- **`/api/admin/brands`** — `products/[id]/page.tsx` und `products/new/page.tsx` rufen `fetch("/api/admin/brands", { method: "POST", … })` auf; im Ordner `docs/reference/old/src/app/api/admin/` gibt es **keine** `brands/route.ts`.
- **Neubau:** (A) Route `app/api/admin/brands/route.ts` implementieren (Prisma + Auth), **oder** (B) Marken-Erstellung ausschließlich über **`createBrand`** etc. aus [`../old/src/app/actions/brands.ts`](../old/src/app/actions/brands.ts) führen und **alle** `fetch("/api/admin/brands")` durch Server-Action-Aufrufe ersetzen. Wichtig ist **Konsistenz**, kein toter Endpunkt.

## Auth

Alle `/api/admin/*`-Routen und `/admin/*`-Seiten müssen wie im Zielprojekt durch **`src/proxy.ts`** (Next.js *Proxy*, Basic Auth) bzw. Session/Headers geschützt sein (siehe `REWRITE_PLAN.md`; Legacy: `middleware.ts`).

## Non-`admin` but admin-adjacent

- Product import / Amazon services live under `src/lib/services/amazon/` and related components (see PS-8 / product dialogs).
