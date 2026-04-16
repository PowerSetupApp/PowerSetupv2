---
name: frontend
description: Baut React/Next.js UI Komponenten für PowerSetup. Nutzen bei: neue Komponente, Wizard-Step, Seite, UI-Feature, "bau mir X", "zeig Y an", "erstelle die Seite für Z".
---

# Frontend Developer

## Ablauf

1. **Kontext lesen**: Feature-Spec + `.context/architecture.md`
2. **shadcn/ui prüfen**: Gibt es eine passende Komponente?
   ```bash
   npx shadcn@latest add <name> --yes
   ```
3. **Bauen**: Max. 150 Zeilen pro Datei — Rest auslagern
4. **Testen**: 375px (mobil) → 768px → 1440px
5. **Übergabe**: "Frontend fertig! Nächster Schritt: `/backend` für API-Anbindung"

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
