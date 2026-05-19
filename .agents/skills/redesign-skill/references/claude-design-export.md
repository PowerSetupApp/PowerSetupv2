# Reference — Parsing a Claude Design Export

A "Claude Design handoff bundle" is a folder produced by Claude Design as a structured handoff to a developer or AI agent. Use this guide in Phase 1 (Source Inventory) and Phase 2 (Design System Extraction) of `SKILL.md` whenever such a folder is among the inputs.

## Expected folder structure

```
<export-name>/
├── README.md                     # Handoff metadata + entry-point hint
└── project/
    ├── tokens.css                # Complete design system as CSS custom properties
    ├── *Wireframes.html          # One HTML entry point per major feature area
    ├── *.jsx                     # Mid-fidelity React prototypes (NOT production code)
    ├── .design-canvas.state.json # Canvas layout state (low signal — usually skip)
    └── assets/
        └── *.svg                 # Brand marks, patterns, decorative SVGs
```

Some bundles vary slightly. The canonical signal is **`README.md` mentioning "handoff bundle from Claude Design"** plus a `project/tokens.css` file. If both are present, treat the folder as an export.

## Reading order

1. **`README.md` first.** It usually states which file the user had open at handoff time. That file is your starting wireframe — the user's point of focus, and a strong hint about which feature is most important.
2. **`tokens.css` second.** This is the authoritative design system source. Extract every custom property: color scales, semantic aliases, typography, spacing, radii, shadows, motion, layout constants, and any embedded SVG patterns/textures referenced as data URLs.
3. **`*Wireframes.html` files third.** Each one represents a feature area (e.g., a wizard, a dashboard, a result page). Read them in the order suggested by the README, then any others. Each HTML file imports React via CDN and renders one or more **artboards** with explicit pixel dimensions — these dimensions hint at responsive breakpoints.
4. **JSX files fourth, by reference.** Open them only to inspect specific component structure, state, or visual specs needed for the implementation. Do not read everything top to bottom.
5. **`assets/`** last — copy SVGs into the target project's asset directory.

## tokens.css — what to extract

Every CSS custom property is part of the design system. Map systematically:

- **Color scales** (e.g., 10 stops per palette: 50 → 900). Capture all stops, not just used ones.
- **Semantic color aliases** (e.g., `--bg-1`, `--fg-1`, `--border-focus`, `--brand`, `--success`, `--danger`). These are how components reference colors — preserve names.
- **Typography**: font families per role (display, body, mono), full type scale (e.g., `--text-xs` through `--text-5xl`), weights, line-heights, letter-spacings.
- **Spacing scale** (e.g., an 8pt grid: `--sp-0` through `--sp-16`).
- **Radii** (e.g., `--radius-xs` through `--radius-full`, plus per-element conventions like inputs/buttons/cards).
- **Shadows** with their RGBA bases (often warm-tinted, not pure black).
- **Motion**: easing curves, durations.
- **Layout constants**: container widths (`--container-max`), form widths (`--form-max`), breakpoints if defined.
- **Embedded SVG patterns**: data URLs assigned to custom properties (e.g., `--topo-pattern`). Keep them embedded — do not extract to separate files unless the project convention demands it.
- **Base element styles**: any `body`, `h1–h6`, `:focus-visible`, `::selection` rules at the bottom of the file.

Map these into the target project's idiomatic mechanism:

| Project stack | Where tokens live |
|---------------|-------------------|
| Plain CSS / CSS variables | `:root` block in a global stylesheet |
| Tailwind | `tailwind.config.js` `theme.extend` (colors, spacing, fontFamily, etc.) plus a global CSS layer for custom properties |
| SCSS | A `_tokens.scss` partial with `$variables`, exposed as CSS variables in `:root` if components rely on them at runtime |
| styled-components / Emotion | A `theme.ts` object passed via `<ThemeProvider>` |
| Vue | CSS variables in a global stylesheet, or a Pinia/composable theme object |

Preserve token names from the source where possible — components in the prototype reference them, and consistency makes the migration auditable.

## Wireframe HTML files — what to extract

Each `*Wireframes.html` is a small React app that renders one or more artboards. Pattern:

```html
<!-- React + Babel via CDN -->
<script src="https://unpkg.com/react@.../umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@.../umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone@.../babel.min.js"></script>

<!-- Design system framework -->
<script type="text/babel" src="design-canvas.jsx"></script>
<script type="text/babel" src="ios-frame.jsx"></script>

<!-- Feature-specific components -->
<script type="text/babel" src="wizard-components.jsx"></script>
<script type="text/babel" src="wizard-steps-1-4.jsx"></script>

<!-- App composition -->
<script type="text/babel" data-presets="react">
  // <DesignCanvas> with <DCSection> and <DCArtboard> entries
</script>
```

What to extract:

- **Feature scope.** The HTML filename names the area (e.g., "Wizard", "Admin Dashboard", "Result").
- **Artboard list.** Each `<DCArtboard>` has an id, label, width, height. The width/height pairs reveal viewport sizes (e.g., 900×1080 desktop, 390×844 mobile).
- **Section labels.** Section labels are user-facing context (e.g., "Schritt 1 · Desktop"). Capture the language (German here) for UI string handling.
- **Imports list.** Tells you which JSX files compose this feature.

The `design-canvas.jsx` and `ios-frame.jsx` files are **prototype scaffolding** — they exist only to render the wireframes in a browser. Do not port them into the target project.

## JSX prototype files — how to read them

These files use:
- Inline styles (so the bundle is self-contained without a build step).
- Global React reference (no imports).
- Hard-coded mock data.
- Simple `useState` for interactivity.

They are **mid-fidelity prototypes**, not production code. Read them for:

- **Component API hints**: what props would a real version need.
- **Visual specs**: spacing, typography, colors used inline — but always verify against `tokens.css`.
- **State and interactivity expectations**: which fields are toggleable, which lists are expandable.
- **Mock data shape**: tells you what real data the production version will need.
- **Responsive variants**: a single component file often defines both desktop and mobile renderings.

Do NOT:
- Copy the file into the project.
- Keep inline styles in the production version.
- Keep the mock data — replace it with real data sources.
- Keep the global React reference — use the project's import conventions.

## Conventions seen in exports

These are recurring patterns; expect (but verify) them:

- **PascalCase** for React components: `WizardShell`, `Step1Content`, `ProgressSteps`.
- **camelCase** for utilities and data: `mockProducts`, `systemSummary`.
- **`dc-` CSS class prefix** for design-canvas internals — these are scaffolding-only and should not appear in production code.
- **`--`-prefixed CSS custom properties** with semantic groupings: scale-suffixed (`--sand-50`), role-named (`--bg-1`, `--brand`).
- **Variant suffixes** like `-a` and `-b` for design alternatives (`variant-a.jsx`, `result-variant-b.jsx`). The user usually picks one variant; if both are present, ask in Phase 5 which is the chosen direction.
- **Domain language baked in.** German exports use German UI strings and German variable names where the term is domain-specific (e.g., "Bordnetz", "Verbraucher"). Keep domain terms in the original language.

## Mock data — handle deliberately

Prototypes embed mock data inline:

```js
const stepMeta = [
  { n: 1, title: 'System-Basis', desc: '...', Content: Step1Content },
  // ...
];
```

In the production migration:
- Identify the real data source (API, store, file).
- Replace mock arrays with that source.
- Preserve the **shape** (field names, types) of the mock data when it implies a contract — surfacing it as a question if the project's existing data model differs.

## Artboard dimensions — interpretation

Artboard widths/heights are render targets, not container constraints. Map them to breakpoints:

- A 900–1280px desktop artboard usually corresponds to the project's "desktop" breakpoint, but use `--container-max` from `tokens.css` for actual container width.
- A 390–402px mobile artboard corresponds to a typical iPhone viewport. Use the project's existing mobile breakpoint or the design's stated breakpoint.

Do not hardcode the artboard dimensions as CSS widths.

## Assets

- Copy every file from `assets/` into the project's existing asset directory.
- Preserve filenames unless the project enforces a different convention.
- For SVG patterns embedded as data URLs in `tokens.css`, leave them embedded — components reference them via `var(--pattern-name)` already.

## Checklist before leaving Phase 2

- [ ] Every custom property in `tokens.css` is mapped or intentionally skipped (with reason).
- [ ] Every wireframe HTML file is opened at least once.
- [ ] Every JSX file's role is identified (shared scaffolding / feature components / variant).
- [ ] Every asset in `assets/` is accounted for.
- [ ] Domain vocabulary is captured.
- [ ] UI language is identified.
- [ ] Variant choices (if any) are flagged for Phase 5.
