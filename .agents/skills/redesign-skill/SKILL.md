---
name: redesign-skill
description: Apply a complete project redesign from design sources (Claude Design handoff exports, screenshots, mockups, or mixed) to an existing codebase. Use when the user provides design materials and wants the project visually re-implemented with 100% clean migration — no legacy design artifacts, no orphan code. The skill enforces an approval gate before adding pages or features that do not exist in the current project. Tech-stack agnostic.
disable-model-invocation: true
---

# redesign-skill

Systematically migrates an existing project to a new design. Inputs are design sources the user provides — typically a Claude Design handoff bundle, screenshots, mockups, or a mix. The skill walks 8 phases that end in a fully-migrated project with zero legacy design code left behind.

## When to use this skill

Trigger when the user:

- Hands over a folder that looks like a design handoff (e.g., contains `tokens.css`, `*Wireframes.html`, JSX prototypes, `assets/`).
- Provides screenshots of a new design and asks to apply them.
- Says "redesign this project", "neues Design anwenden", "migrate to the new design", or similar.
- Requests cleanup of old styles after a new design has been partially applied.

Do NOT use this skill for: small visual tweaks, single-component restyles, copy changes, or backend refactors.

## Inputs the skill accepts

Three input shapes. Identify which one(s) apply before starting Phase 1.

| Shape | Detection signal | Reference |
|-------|------------------|-----------|
| Claude Design Export | Folder containing `README.md` mentioning "handoff bundle from Claude Design", a `project/` subfolder with `tokens.css`, one or more `*Wireframes.html`, and JSX files | `references/claude-design-export.md` |
| Screenshots / images | One or more image files (PNG/JPG) representing target screens | `references/screenshot-analysis.md` |
| Mixed | Any combination of the above, possibly with text notes | Both references; treat token files as authoritative for color values |

## Core principles

1. **100% clean.** No old design files, no dead CSS classes, no unused assets, no shadow theme remnants. The project after migration must contain only the new design system.
2. **Tech-agnostic.** Inspect the target project first. Map the design system idiomatically into whatever stack exists (CSS variables, Tailwind theme, SCSS, styled-components, Vue CSS vars, etc.). Do not switch the stack unless explicitly asked.
3. **Ask before inventing.** If a page, component, or feature exists in the design but not in the project, never silently create it. Collect all such items and ask the user in one batch (Phase 5).
4. **Tokens first, then components.** Establish the design system layer (colors, typography, spacing, radii, shadows, motion) before touching components. Components must consume tokens, never hardcoded values.
5. **Single source of truth.** When the design provides a token file, that file is authoritative for color/spacing/typography. Screenshots are authoritative for layout but not for exact hex values.
6. **Reversible until the cleanup commit.** Implementation phases edit/replace; cleanup is a distinct, reviewable phase with its own report.

## Workflow

The skill runs in 8 phases. Do not skip phases or merge them. Output the phase number in user-facing updates so progress is traceable.

### Phase 1 — Source Inventory

Goal: know exactly what the user gave you.

Steps:
1. List every file/folder the user pointed to. Classify each by shape (export / screenshot / mixed / notes).
2. For each Claude Design Export folder: open `README.md` first — it often names which file the user had open at handoff time. That file is your starting point.
3. Detect UI language (German, English, etc.) and capture domain vocabulary in a short list. Use the original language in user-facing UI strings unless told otherwise.
4. Note any conflicts between sources (e.g., screenshot shows different button color than `tokens.css`). Park them; resolve in Phase 4 by asking the user.
5. Output: short inventory table — file → shape → role (e.g., "tokens.css → export → design system source").

If the input is a Claude Design Export, follow `references/claude-design-export.md` for parsing rules.
If the input contains screenshots, follow `references/screenshot-analysis.md`.

### Phase 2 — Design System Extraction

Goal: produce a complete, structured design system manifest.

Steps:
1. Extract design tokens: color scales, semantic color aliases, typography (families, sizes, weights, line-heights, letter-spacings), spacing scale, radii, shadows, motion (durations, easings), layout constants (container widths, form widths), embedded patterns/textures.
2. List font dependencies (e.g., Google Fonts CDN, self-hosted) and how they are loaded.
3. Inventory assets: every SVG, image, icon. Note dimensions and intended usage where the design indicates it.
4. Capture the typography hierarchy as named roles (page title, section head, card title, body, caption, metadata) with their token mappings.
5. Output: a single design-system manifest in your context (or a working notes file) covering all of the above.

### Phase 3 — Project Analysis

Goal: understand the target codebase well enough to plan a clean migration.

Steps:
1. Identify the tech stack (framework, styling approach, build tooling).
2. Locate the current design layer: theme files, token files, global stylesheets, Tailwind config, CSS-in-JS theme objects.
3. Walk the routing/page structure. List every existing page/route.
4. Inventory existing reusable components (buttons, inputs, cards, navigation, layouts).
5. Locate the asset directory (images, icons, fonts).
6. Note any infrastructure files that must stay (tests, CI, build configs, type definitions, lockfiles).
7. Output: a project inventory — stack summary, existing pages, existing components, existing token files, asset directory.

### Phase 4 — Gap Analysis

Goal: a single mapping table between design and project.

Build a table with three categories:

| Category | Meaning | Action in later phases |
|----------|---------|------------------------|
| `REDESIGN` | Component/page exists in both — visual implementation must change | Re-implement in Phase 6 |
| `NEW` | Exists only in the new design — not in the current project | Approval gate in Phase 5 |
| `OBSOLETE` | Exists only in the project — removed or replaced in the new design | Confirm + delete in Phase 7 |

Also list any **conflicts** parked from Phase 1 (source A says X, source B says Y) for resolution in Phase 5.

### Phase 5 — Approval Gate (critical)

Goal: never write code for a `NEW` item without explicit user approval, and never delete an `OBSOLETE` item that may carry business logic without confirmation.

Rules:
- Collect ALL `NEW`, `OBSOLETE`, and conflict items first. Do not ask one-by-one mid-flow.
- Present the full batch in a single structured prompt. If the harness has `AskUserQuestion`, use it with one question per item; otherwise present a numbered list and ask the user to reply with decisions per number.
- For each `NEW` item, offer three options: **implement now / defer (track in summary) / ignore (do not build)**.
- For each `OBSOLETE` item, offer three options: **delete / keep but unstyle / keep as-is (do not migrate)**.
- For each conflict, present both candidate values and ask which wins.
- **Do not write or delete any code in Phase 5.** This phase is purely decisional.
- Output: an approved plan listing the final scope of `REDESIGN`, `NEW (approved)`, `NEW (deferred)`, `OBSOLETE (delete)`, `OBSOLETE (keep)`, and conflict resolutions.

### Phase 6 — Implementation

Goal: apply the redesign in a stable, dependency-respecting order.

Order matters. Implement in this sequence:

1. **Tokens / theme layer.** Replace existing token files with the new design system. Adapt to the project's stack: write CSS variables, extend a Tailwind theme, replace SCSS variable files, update a theme object — whatever is idiomatic. Keep the structure of the new tokens; do not rename token keys to match old code.
2. **Global styles.** Reset/base styles, body defaults, font loading, focus-ring rules, selection colors.
3. **Global layouts/shells.** App shell, header, footer, sidebar, nav, page containers.
4. **Reusable primitives.** Buttons, inputs, selects, switches, cards, callouts, dialogs.
5. **Composite components.** Forms, tables, dashboards, lists, hero sections.
6. **Pages / routes.** Each `REDESIGN` page; then approved `NEW` pages.
7. **Assets.** Replace icons/images with the new ones from the design export. Update all references.

Implementation rules:
- Components consume tokens via the project's idiomatic mechanism — never hardcode hex values, pixel sizes, or typography settings that are tokenized.
- Do not copy JSX prototype code 1:1. Read it for structure, state, and visual specs; re-implement in the project's conventions.
- Replace mock data from the prototype with real data sources from the project.
- Preserve existing business logic in `REDESIGN` components — only the visual layer changes unless the new design implies a behavior change (which becomes a Phase 5 question).
- Keep UI text in the language the design uses (e.g., German). Do not translate unless asked.

### Phase 7 — Strict Cleanup

Goal: zero legacy design code remains.

Follow `references/cleanup-checklist.md`. Categories to sweep:

- Old token/theme files that are now superseded.
- CSS classes no longer referenced by any component.
- Components that were `OBSOLETE (delete)` or were silently replaced by primitives in Phase 6.
- Assets (images, icons, fonts, SVGs) with no remaining references.
- Storybook stories, demo pages, sandbox routes tied to the old design.
- Dead imports left after component replacement.
- Legacy build/styling configs (e.g., a stale PostCSS plugin, an old SCSS partial registered globally).

For every deletion candidate:
1. Verify it is genuinely unused (grep across the project).
2. Add it to the **Cleanup Report** with reason.
3. After the report is built, present it to the user in one batch and ask for confirmation before deleting.
4. Only delete after explicit confirmation. Do not commit deletions and edits in the same step — cleanup is its own commit.

The Cleanup Report uses the template in `references/cleanup-checklist.md`.

### Phase 8 — Verification

Goal: prove the migration is functionally and visually correct.

Steps:
1. Run the project's build, lint, and type-check commands. Resolve all errors before claiming completion. Do not bypass with flags like `--no-verify`.
2. Run the test suite if one exists.
3. Search the codebase for residue: old hex values, old token names, old class names, old asset filenames. Any hit means a missed cleanup — return to Phase 7 for that item.
4. Spot-check visually if possible (start the dev server, open key pages). Compare against the design source.
5. Output a **Migration Summary** for the user covering:
   - Tokens migrated (count and any renames).
   - Components redesigned (list).
   - New components/pages built (list with which ones were approved vs deferred).
   - Components/files deleted (link to Cleanup Report).
   - Open items: deferred features, manual follow-ups, unresolved questions.

## Decision rules

- **Source conflict** (token file vs screenshot vs notes): the user decides, asked in Phase 5.
- **Ambiguous asset usage** (an SVG with no clear placement spec): ask before inserting.
- **Uncertain deletion** (component might hold business logic): confirm in Phase 7 batch.
- **Unfamiliar domain vocabulary**: never paraphrase or translate domain terms; ask if unsure.
- **Stack change implied by the design** (e.g., design uses CSS variables but project uses SCSS variables): keep the project's stack and adapt; do not switch stacks without an explicit user request.

## Output format

The user receives, in order:

1. **Phase 4 Gap Analysis table** — categorized REDESIGN / NEW / OBSOLETE.
2. **Phase 5 Approval batch** — single prompt covering all decisions.
3. **Phase 7 Cleanup Report** — single prompt with deletion list and reasons.
4. **Phase 8 Migration Summary** — final report.

Each artifact is delivered as a clearly demarcated message section the user can scan.

## Anti-patterns

Do not:

- Implement a `NEW` feature without an approved Phase 5 decision.
- Leave old design code "just in case" — that violates the 100%-clean requirement.
- Hardcode color or spacing values when a token exists.
- Invent token names that aren't in the design source.
- Translate UI text into a different language than the design.
- Delete tests, CI configs, lockfiles, or unrelated infrastructure during cleanup.
- Copy JSX prototype files verbatim into the project.
- Merge implementation and cleanup into one commit.
- Skip the build/lint/type-check verification.

## References

| File | When to read |
|------|--------------|
| `references/claude-design-export.md` | Phase 1 and Phase 2 when a Claude Design handoff folder is among the inputs |
| `references/screenshot-analysis.md` | Phase 1 and Phase 2 when screenshots/images are among the inputs |
| `references/cleanup-checklist.md` | Phase 7, every time |
