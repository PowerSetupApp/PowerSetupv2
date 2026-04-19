# Legacy app snapshot (`docs/reference/old/`)

Weitgehend vollständiger **`src/`**-Ausschnitt der früheren PowerSetup-Next.js-App. **Nicht** als lauffähiges Projekt gedacht (kein `node_modules`, `@/`-Aliase, ggf. fehlende Root-Dateien wie `package.json` im Ordner selbst).

**Zweck:** Read-only **Quelle der Wahrheit** für Verhalten, Texte, Felder und APIs beim Rewrite — ergänzt durch kuratierte Summaries unter [`../admin/`](../admin/README.md) und [`../ADMIN-AGENT-BRIEF.md`](../ADMIN-AGENT-BRIEF.md).

## Enthalten (typisch)

- `src/app/admin/**` — gesamtes Admin-UI.
- `src/app/api/admin/**` — Admin-APIs (siehe Liste in [`../admin/api-routes.md`](../admin/api-routes.md)).
- `src/app/actions/**` — Server Actions (Settings, Brands, Algorithm, …).
- `src/components/admin/**` — Admin-Komponenten.
- `src/lib/**`, weiterer App-Code je nach Kopie.

## Bekannte Lücke / Inkonsistenz

- **`POST /api/admin/brands`:** wird von Produktseiten per `fetch` aufgerufen, liegt im Snapshot **nicht** als `route.ts` vor. Marken-Admin nutzt **Server Actions**. Beim Neubau vereinheitlichen (siehe [`../admin/api-routes.md`](../admin/api-routes.md)).

## Mediathek-Seite vs. Modal

- **`admin/media/page.tsx`** kann je nach Stand Demo oder echte Galerie sein.
- **Produktfluss:** [`MediaModal`](../old/src/components/admin/media-modal.tsx) + [`POST .../media/upload`](../old/src/app/api/admin/media/upload/route.ts) ist der relevante Upload-Pfad.
