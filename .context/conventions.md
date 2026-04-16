# PowerSetup — Coding Conventions

## TypeScript

- Kein `any` — alle Types Zod-inferred oder explizit definiert
- Props immer mit `interface Props { ... }` definiert
- Zod-Schemas in `src/lib/schemas/` — nie inline in Komponenten
- Server- und Client-Types sauber getrennt

## Komponenten

- Max. **150 Zeilen** pro Datei — danach Sub-Komponenten auslagern
- shadcn/ui zuerst prüfen, dann Custom bauen
- Tailwind CSS only — kein CSS Module, kein Inline-Style
- Standard: Server Component — `"use client"` nur wenn nötig

## Wizard Steps

Jeder Step = eigener Ordner:
```
src/components/wizard/steps/StepXName/
├── index.tsx           ← Haupt-Entry (max. 150 Zeilen)
└── SubComponent.tsx    ← Ausgelagert
```

## State Management

- Wizard-State: Zustand mit Persist, Slice-Struktur
- Kein direkter `localStorage`-Zugriff in Komponenten
- Server-State: Server Components oder API Routes — kein `useEffect` für Daten

## API Routes

- Max. **80 Zeilen** pro Route-Datei
- Logik gehört in `lib/` — nicht in die Route selbst
- Pflicht-Pattern:
  ```typescript
  const body = Schema.parse(await request.json())  // validate
  const result = await libFunction(body)            // delegate
  return Response.json(result)                      // return
  ```

## Datenbank

- Prisma **nur** in `src/lib/db/queries/`
- Jede Query-Funktion: typisiert, Fehler wird geworfen (kein silent fail)
- Kein raw SQL

## KI-Integration

- Alle Calls über `src/lib/ai/client.ts`
- Retry + Fallback ist in `client.ts` eingebaut — nicht manuell implementieren
- Token-Usage immer in `Result` persistieren

## Git

Format: `type(PS-X): kurze Beschreibung`

| Type | Wann |
|------|------|
| `feat` | Neues Feature |
| `fix` | Bugfix |
| `refactor` | Umbau ohne neues Verhalten |
| `test` | Tests hinzufügen/ändern |
| `docs` | Nur Dokumentation |
| `deploy` | Deploy-bezogen |
| `chore` | Tooling, Dependencies |

## Dateinamen

- Komponenten: `PascalCase.tsx` (z.B. `WizardShell.tsx`)
- Utils/Libs: `kebab-case.ts` (z.B. `ai-selector.ts`)
- API Routes: immer `route.ts` (Next.js Convention)
- Skills: immer `SKILL.md` (agentskills.io Standard)
