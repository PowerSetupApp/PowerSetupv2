# PS-8 — Amazon Produkt-Import (ASIN / URL)

**Status:** Planned  
**Ziel:** Admin importiert Produktdaten (Creators API primär, HTML-Scraper Fallback), KI extrahiert Specs — siehe Amazon-Abschnitt im Rewrite-Plan.

## Kurzscope

- Code unter `src/lib/amazon/` (api, scraper, extractor, index, types) wie in [REWRITE_PLAN.md](../REWRITE_PLAN.md) „Amazon-Integration (Admin)“.
- ENV: `AMAZON_*`, `USE_MOCK_AMAZON` für lokal.
- Überlappung mit Admin-UI: [PS-7-admin-panel.md](PS-7-admin-panel.md) (Produkt importieren).

## Architektur-Referenz

- [REWRITE_PLAN.md](../REWRITE_PLAN.md) — Amazon-Tabelle, neue Struktur, Referenzordner `docs/reference/amazon/`.

## Definition of Done (MVP)

- [ ] Import-Pfad API → Scraper bei Fehler
- [ ] Mock-Modus für Entwicklung dokumentiert

Vollständige Spec: bei Bedarf mit `/requirements` vertiefen.
