---
name: frontend
description: Baut React/Next.js UI für PowerSetup (Wizard, shadcn/ui, Tailwind). Nutzen bei Komponenten, Steps, Seiten, UI-Features. Inkl. Design-Qualität (Anthropic frontend-design, siehe design-anthropic-frontend.md) und UI/UX-Pro-Max-Intelligenz (Styles, Paletten, UX-Regeln, siehe ui-ux-pro-max.md; optionale Suche per python scripts/search.py). Trigger auch bei Landing, Dashboard, Redesign, „weniger generisch“, Accessibility-Review.
---

# Frontend Developer

## Ablauf

1. **Kontext lesen**: Feature-Spec + Projekt-Kontext via Graphify abfragen
2. **Design-Pflicht bei sichtbarer UI** (Landing, Wizard, Marketing, Theme, „Redesign“, neue Seiten): **`design-anthropic-frontend.md`** + **`ui-ux-pro-max.md`** vollständig mitdenken; bei Farb/Typo/Layout-Entscheidungen optional `python .agents/skills/frontend/scripts/search.py "<thema>" --design-system -p "PowerSetup"` vom Repo-Root.
3. **shadcn/ui prüfen**: Gibt es eine passende Komponente?
   ```bash
   npx shadcn@latest add <name> --yes
   ```
4. **Bauen**: Max. 150 Zeilen pro Datei — Rest auslagern
5. **Testen**: 375px (mobil) → 768px → 1440px
6. **Übergabe**: "Frontend fertig! Nächster Schritt: `/backend` für API-Anbindung"

## Design- und UX-Leitlinien (mitlesen)

| Situation | Pflichtlektüre |
|-----------|----------------|
| Neue Flächen mit starker visueller Identität, Landing, Marketing, „nicht wie Standard-AI-UI“ | [design-anthropic-frontend.md](./design-anthropic-frontend.md) (Lizenz: [LICENSE-anthropic-frontend-design.txt](./LICENSE-anthropic-frontend-design.txt)) |
| UI-/UX-Entscheidungen, Farbsystem, Typografie, Layout-Patterns, Review, Dashboards, Charts | [ui-ux-pro-max.md](./ui-ux-pro-max.md) (Lizenz: [LICENSE-ui-ux-pro-max.txt](./LICENSE-ui-ux-pro-max.txt)) |

**Optional — UI/UX-Pro-Max-Datenbank** (vom Repository-Root):

```bash
python .agents/skills/frontend/scripts/search.py "<query>" --design-system -p "PowerSetup"
```

Weitere Domains und Stacks: siehe [ui-ux-pro-max.md](./ui-ux-pro-max.md) Abschnitt „How to Use This Skill“.

## `data/` und CSVs (Kontext sparen)

- **`data/*.csv` nicht bulk lesen** — keine vollständigen CSVs oder ganzen Ordner `data/` in den Model-Kontext laden (tausende Zeilen, hoher Token-Verbrauch ohne Nutzen).
- Stattdessen nur **`scripts/search.py`** mit konkreter Abfrage nutzen; Ergebnis bewusst klein halten.
- Große Begleitdateien (`ui-ux-pro-max.md`, `templates/`) **gezielt** öffnen, wenn die Aufgabe es braucht — nicht den gesamten Skill-Ordner rekursiv einlesen.

## UI/A11y-Audit (Vercel Web Interface Guidelines)

Wenn der Nutzer ein **Review**, **Audit** oder **Barrierefreiheit gegen Checkliste** will (nicht beim normalen Bauen): Skill **[web-design-guidelines](../web-design-guidelines/SKILL.md)** laden und dort den Ablauf nutzen — Guidelines live von Vercel holen, keine Regeln hier wiederholen. Katalog: [skills.sh/…/web-design-guidelines](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines).

## Konfliktregel: Projekt-Stack vs. freie Ästhetik

1. **Vorrang**: PowerSetup-Stack — shadcn/ui, Tailwind, Wizard-State (`src/store/wizard.ts`), 150-Zeilen-Regel, Server Components wo möglich.
2. **Darüber hinaus**: Richtung aus design-anthropic-frontend (Typo, Farbe, Motion, Layout) für Theme, Marketing und bewusst „eigenständige“ Oberflächen — z. B. über `next/font`, CSS-Variablen, Tokens — ohne shadcn-Primitives unnötig zu ersetzen.

## shadcn/ui Komponenten (immer zuerst prüfen)

Button, Input, Select, Checkbox, Switch, Dialog, Card, Badge,
Tabs, Dropdown, Tooltip, Progress, Slider, RadioGroup, Label

Import: `import { Button } from "@/components/ui/button"`

## Wizard-Steps Struktur

```
src/components/wizard/steps/StepXName/
├── index.tsx           ← Haupt-Komponente (max. 150 Zeilen)
├── SubComponent.tsx    ← Ausgelagerte Teile
└── AnotherPart.tsx
```

## Zustand

- Wizard-State nur über `src/store/wizard.ts` (Zustand)
- Kein direkter `localStorage`-Zugriff in Komponenten
- Slice-Struktur: je Step ein eigener Slice

## Server vs. Client

- Standard: Server Component
- `"use client"` nur wenn nötig (Event Handler, Hooks, Browser APIs)
- Daten-Fetching in Server Components, nicht in `useEffect`

## Qualitäts-Checkliste

- [ ] shadcn/ui genutzt wo möglich
- [ ] Tailwind only (kein Inline-Style, kein CSS Module)
- [ ] Responsive (375px zuerst)
- [ ] Touch-Targets ≥ 48x48px
- [ ] Loading-, Error- und **Empty**-States eingebaut
- [ ] Semantisches HTML + ARIA wo nötig
- [ ] Kein `any` Type
- [ ] Max. 150 Zeilen pro Datei
- [ ] Bei sichtbarkeitsstarker UI: design-anthropic-frontend + ui-ux-pro-max berücksichtigt
