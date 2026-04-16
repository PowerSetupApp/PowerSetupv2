# PowerSetup — Agent Context

Mobile-first Next.js 16 Web-App. Camping-Elektrik-Planer für Anfänger.
8-Schritt Wizard → Algorithmus → KI-Empfehlungen → PDF-Schaltplan.

**Zwei Oberflächen:** Endnutzer sehen **nur** Wizard + Ergebnis (und Folgeflows wie PDF). Der **Admin** (`/admin/*`) ist ausschließlich für Betreiber — anderes Publikum, andere UI-Priorität (funktional vollständig laut Spec). Kurzüberblick: [docs/reference/ADMIN-AGENT-BRIEF.md](docs/reference/ADMIN-AGENT-BRIEF.md).

## Immer zuerst lesen

- [features/INDEX.md](features/INDEX.md) — **Feature-Specs** PS-1 … PS-9 (kuratierte Umsetzungs-Checklisten)
- [REWRITE_PLAN.md](REWRITE_PLAN.md) — **Phasen & Zielstruktur** (Rewrite, Ordnerbaum, Alt→Neu)
- `.context/architecture.md` — **Kontext-Atlas:** kompakte Ordnerübersicht, Modul-Zuständigkeiten, Kopplungen/Blast-Radius (Ziel ≤ ~180 Zeilen; keine Regeln/Domain hier)
- `.context/domain.md` — Fachbegriffe (PSH, DoD, MPPT, Ah, Wp etc.)
- `.context/conventions.md` — Coding-Standards, Patterns

## Referenz-Material (read-only, nie bearbeiten)

- `docs/reference/algorithm/` — Original-Algorithmus (9 Phasen, 2500 Zeilen)
- `docs/reference/schema.prisma` — Original Prisma Schema (15 Modelle)
- `docs/reference/schemas/` — Original Zod-Schemas
- `docs/reference/amazon/` — Amazon Creators API + Scraper
- `docs/reference/recommendation/` — Original Recommendation Engine
- `docs/reference/old/` — Legacy-App `**src/`** (read-only Snapshot, weitgehend vollständig)
- `docs/reference/admin/` — **Funktions-Inventar Admin** (Markdown pro Bereich; bei fachlicher Änderung aktualisieren)
- `docs/reference/ADMIN-AGENT-BRIEF.md` — **Einstieg Admin vs Nutzer**, Links zu PS-7 + Detaildocs
- `features/PS-7-admin-panel.md` — **Admin-Umsetzungscheckliste** (Definition of Done)

## Skills

Quelltext für alle Skills liegt unter `**.agents/skills/<name>/SKILL.md`** — dort aktualisieren. Die Cursor-Regeln unter `.cursor/rules/` verweisen nur noch darauf (keine doppelte Pflege).

- `/requirements` — Neues Feature planen, Spec schreiben
- `/architecture` — Technisches Design, Architektur-Entscheidungen
- `/frontend` — React/Next.js UI bauen; bei **sichtbarer Oberfläche** zuerst `.agents/skills/frontend/SKILL.md` **und** die dort verlinkten Anhänge `design-anthropic-frontend.md` + `ui-ux-pro-max.md` mitdenken (optional: `scripts/search.py`). Cursor-Pflicht: `.cursor/rules/frontend.mdc`.
- `/backend` — API Routes, Prisma Queries, DB-Logik
- `/qa` — Testen + Security Audit
- `/deploy` — Vercel Deployment (nur manuell)

### Zusätzlich installiert (skills.sh, vollständige Regeln im jeweiligen Ordner)

Kurzverweise in den PowerSetup-Skills oben; keine Regeln hier duplizieren.


| Skill                                                                      | skills.sh                                                                                             | Wann nutzen                                                                                                                                    |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [web-design-guidelines](.agents/skills/web-design-guidelines/SKILL.md)     | [skills.sh/…/web-design-guidelines](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines) | UI/A11y-Audit gegen Vercel Web Interface Guidelines                                                                                            |
| [next-cache-components](.agents/skills/next-cache-components/SKILL.md)     | [skills.sh/…/next-cache-components](https://skills.sh/vercel-labs/next-skills/next-cache-components)  | Next.js 16+ `cacheComponents` / `'use cache'` / Tags                                                                                           |
| [pdf](.agents/skills/pdf/SKILL.md)                                         | [skills.sh/anthropics/skills/pdf](https://skills.sh/anthropics/skills/pdf)                            | PDF erzeugen, splitten, extrahieren, Formulare (nicht nur „eine Route“)                                                                        |
| [stripe-best-practices](.agents/skills/stripe-best-practices/SKILL.md)     | [skills.sh/…/stripe-best-practices](https://skills.sh/stripe/agent-toolkit/stripe-best-practices)     | Optional: Webhooks/Checkout/Billing-Muster (Produkt nutzt **PayPal** für Credits — siehe [REWRITE_PLAN.md](REWRITE_PLAN.md) Tech Stack / PS-6) |
| [systematic-debugging](.agents/skills/systematic-debugging/SKILL.md)       | [skills.sh/…/systematic-debugging](https://skills.sh/obra/superpowers/systematic-debugging)           | Bugs, flaky Tests, Build-Fails — vor dem Fix                                                                                                   |
| [test-driven-development](.agents/skills/test-driven-development/SKILL.md) | [skills.sh/…/test-driven-development](https://skills.sh/obra/superpowers/test-driven-development)     | Neue oder geänderte Logik in `src/lib/` oder APIs — rot-grün-refactor                                                                          |


## Tests & CI

- **Unit / Integration:** Vitest ist die sinnvolle Standardwahl für TypeScript und Next.js; Details und Ablauf: `.agents/skills/test-driven-development/SKILL.md`. Cursor-Regel bei Testdateien: `.cursor/rules/testing.mdc`.
- **E2E (optional):** Playwright erst sinnvoll, wenn kritische User-Flows stabil regressionstestbar sein sollen; der **interne Browser in Cursor** ersetzt das nicht (kein automatisierter Gatekeeper in CI).
- **GitHub Actions:** Liegt `.github/workflows/ci.yml` im Repo, prüfen ob `package.json` an der **Wurzel** existiert — ohne Wurzel-App überspringt der Workflow Install/Test (dieses Kontext-Repo bleibt grün). Sobald die PowerSetup-App hier oder in einem anderen Repo mit CI liegt: `npm run lint` / `npm run test` per `package.json` anbinden (`--if-present` ist im Workflow schon berücksichtigt).

## Kritische Regeln

- Kein direkter `prisma`-Import außerhalb `src/lib/db/queries/` (nie in API Routes oder Komponenten)
- Kein `any` — alle Types Zod-inferred
- **Zeilenbudget:** UI-Komponenten max. **~150 Zeilen** pro Datei (Rest auslagern); **API-Route-Dateien** (`route.ts`) max. **~80 Zeilen** — Logik nach `src/lib/` delegieren (Details: `.context/conventions.md`)
- Einzige Berechnungsquelle: `POST /api/generate/[id]`
- Nach strukturellen Änderungen (siehe gleiche Trigger wie in `.cursor/rules/general.mdc` → Abschnitt „Kontext-Atlas“): `.context/architecture.md` im selben Arbeitsgang aktualisieren; bei Wachstum Einträge zusammenführen oder streichen, Zielgröße einhalten
- Neue Features zuerst via `/requirements` spezifizieren, dann coden

## Produkt-Flow (Kernlogik)

```
Wizard-Eingaben
     ↓
src/lib/algorithm/calculate.ts  (9 Phasen, pure functions)
→ Berechnet Specs: z.B. "Batterie mind. 200Ah, LiFePO4, 12V"
     ↓
src/lib/recommendation/prefilter.ts
→ Filtert Prisma-DB nach Specs + Scoring
→ Top N Produkte pro Kategorie
     ↓
src/lib/recommendation/ai-selector.ts
→ Gemini 2.0 primär, OpenAI GPT-4o Fallback
→ Wählt beste 2-3 pro Kategorie + Erklärung
     ↓
Ergebnis-Seite + optionaler PDF-Schaltplan (kostenpflichtig)
```

