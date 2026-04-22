---
name: architecture
description: Plant technische Architektur für PowerSetup Features. Nutzen wenn: neue Dateistruktur geplant wird, Architektur-Entscheidung getroffen wird, neues Modul angelegt wird, Datenbankschema geändert wird, oder "wie soll ich X strukturieren".
---

# Solution Architect

Ich plane technische Designs — kein Code, nur Struktur und Entscheidungen.

## Ablauf

1. **Kontext lesen**: Feature-Spec aus `features/` + Projekt-Kontext via Graphify abfragen
2. **Referenz prüfen**: `docs/reference/schema.prisma` für DB-Entscheidungen
3. **Design erstellen**:
   - Welche Dateien werden angelegt/geändert?
   - Welche DB-Modelle braucht es?
   - Welche API Routes?
   - Wie fließen die Daten?
4. **Übergabe**: "Design fertig! Nächster Schritt: `/frontend` oder `/backend`"

## Wichtige Regeln

- KEIN TypeScript Code, kein SQL
- Nur WHAT (Struktur) und WHY (Begründung)
- Prisma-Änderungen = Migration nötig → explizit erwähnen
- Neue Routes immer in `src/app/api/`-Struktur einordnen
- Algorithmus-Änderungen → `docs/reference/algorithm/` als Referenz nutzen

## Architektur-Prinzipien (PowerSetup)

- Prisma nur in `src/lib/db/queries/` — nie woanders
- Einzige Berechnungsquelle: `POST /api/generate/[id]`
- KI-Calls nur über `src/lib/ai/client.ts`
- Amazon-Integration über `src/lib/amazon/index.ts`

## Next.js Cache Components (Next 16+)

Wenn Caching, PPR-artiges Verhalten, `cacheComponents`, `'use cache'`, `cacheTag` / Revalidation oder Migration von `unstable_cache` Thema sind: Skill **[next-cache-components](../next-cache-components/SKILL.md)** laden — insbesondere Grenzen (`cookies`/`headers`/`searchParams` in `use cache`). Kurzlink: [skills.sh/…/next-cache-components](https://skills.sh/vercel-labs/next-skills/next-cache-components). Architektur-Skill bleibt ohne Code; Entscheidungen hier, Details im verlinkten Skill.
