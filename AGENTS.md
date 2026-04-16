# PowerSetup — Agent Context

Mobile-first Next.js 16 Web-App. Camping-Elektrik-Planer für Anfänger.
8-Schritt Wizard → Algorithmus → KI-Empfehlungen → PDF-Schaltplan.

## Immer zuerst lesen

- `.context/architecture.md` — Dateistruktur, Module, Abhängigkeiten
- `.context/domain.md` — Fachbegriffe (PSH, DoD, MPPT, Ah, Wp etc.)
- `.context/conventions.md` — Coding-Standards, Patterns

## Referenz-Material (read-only, nie bearbeiten)

- `docs/reference/algorithm/` — Original-Algorithmus (9 Phasen, 2500 Zeilen)
- `docs/reference/schema.prisma` — Original Prisma Schema (13 Modelle)
- `docs/reference/schemas/` — Original Zod-Schemas
- `docs/reference/amazon/` — Amazon Creators API + Scraper
- `docs/reference/recommendation/` — Original Recommendation Engine

## Skills

Quelltext für alle Skills liegt unter **`.agents/skills/<name>/SKILL.md`** — dort aktualisieren. Die Cursor-Regeln unter `.cursor/rules/` verweisen nur noch darauf (keine doppelte Pflege).

- `/requirements` — Neues Feature planen, Spec schreiben
- `/architecture` — Technisches Design, Architektur-Entscheidungen
- `/frontend` — React/Next.js Komponenten bauen
- `/backend` — API Routes, Prisma Queries, DB-Logik
- `/qa` — Testen + Security Audit
- `/deploy` — Vercel Deployment (nur manuell)

## Kritische Regeln

- Kein direkter `prisma`-Import außerhalb `src/lib/db/queries/`
- Kein `any` — alle Types Zod-inferred
- Max. 150 Zeilen pro Komponenten-Datei → Rest auslagern
- Einzige Berechnungsquelle: `POST /api/generate/[id]`
- Prisma nur in `lib/db/queries/` — nie in API Routes direkt
- Nach jeder Architektur-Änderung: `.context/architecture.md` aktualisieren
- Neue Features zuerst via `/requirements` spezifizieren, dann coden

## Produkt-Flow (Kernlogik)

```
Wizard-Eingaben
     ↓
lib/algorithm/calculate.ts  (9 Phasen, pure functions)
→ Berechnet Specs: z.B. "Batterie mind. 200Ah, LiFePO4, 12V"
     ↓
lib/recommendation/prefilter.ts
→ Filtert Prisma-DB nach Specs + Scoring
→ Top N Produkte pro Kategorie
     ↓
lib/recommendation/ai-selector.ts
→ Gemini 2.0 primär, OpenAI GPT-4o Fallback
→ Wählt beste 2-3 pro Kategorie + Erklärung
     ↓
Ergebnis-Seite + optionaler PDF-Schaltplan (kostenpflichtig)
```
