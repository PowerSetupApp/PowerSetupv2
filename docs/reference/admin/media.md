# Admin — media (Mediathek)

Two different behaviours exist in the legacy snapshot.

## Product image picker — `MediaModal`

Source: [`../old/src/components/admin/media-modal.tsx`](../old/src/components/admin/media-modal.tsx)

- Drag-and-drop or file picker; uploads each file with `POST /api/admin/media/upload` (`FormData` field `file`).
- Response `{ name, url }`; URLs accumulate in modal until user selects one → passed to product `imageUrl`.

## Standalone page — `/admin/media`

Source: [`../old/src/app/admin/media/page.tsx`](../old/src/app/admin/media/page.tsx)

- Legacy-Datei kann **Demo-only** sein (`URL.createObjectURL`); im laufenden Projekt kann die Seite dagegen **echte** Galerie + Leerzustand zeigen („Noch keine Bilder hochgeladen“, Hinweis Bilder für Produkte zu nutzen).
- UI copy: PNG/JPG/WebP bis 5MB; **Hinweis** zu keinen externen Amazon-Bildern (DSGVO/Policy).

## Rewrite guidance

Treat **modal + upload API** as the canonical production path; replace the standalone page with either:

- A gallery backed by the same blob storage as `media/upload`, or
- Redirect/embed the real library browser.

See [`../old/src/app/api/admin/media/upload/route.ts`](../old/src/app/api/admin/media/upload/route.ts) in snapshot for server behaviour.
