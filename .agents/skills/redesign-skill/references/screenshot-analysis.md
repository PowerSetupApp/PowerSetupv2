# Reference — Redesign from Screenshots

Use this guide in Phase 1 (Source Inventory) and Phase 2 (Design System Extraction) of `SKILL.md` whenever screenshots are part of the input. Screenshots are weaker than a token file — colors and spacings are estimated, not authoritative — so the workflow leans heavily on user confirmation.

## What screenshots can tell you authoritatively

- **Layout** — placement, hierarchy, grid structure, what is above/below/beside what.
- **Component identity** — buttons, inputs, cards, headers, navigation.
- **Visual state coverage** — hover, error, empty, loading states (if multiple shots are provided).
- **Responsive intent** — if separate desktop and mobile shots exist.
- **Copy / labels / language** — exact text used in the UI.

## What screenshots cannot tell you reliably

- **Exact color hex values** — browser rendering, image compression, color profile mismatches all distort.
- **Exact pixel sizes** — DPI, zoom level, OS scaling all distort.
- **Font weights and metrics** — anti-aliasing differences obscure subtle weight differences.
- **Motion and easing** — invisible in a static image.
- **Interaction details** — what happens on click, focus order, keyboard handling.

Treat values from screenshots as **estimates pending confirmation**.

## Per-screenshot extraction routine

For each screenshot:

1. **Identify the screen.** Name it (e.g., "Login page", "Dashboard — overview", "Settings — profile tab"). Match it to an existing route/page in the project if possible (this becomes a `REDESIGN` entry in Phase 4) or flag as a new candidate (becomes `NEW`).
2. **Extract the layout structure.** Sketch the regions (header, sidebar, main, footer, modal, etc.) and how they nest.
3. **List the components.** Note each visible component type and its role (primary CTA, secondary button, input with label, icon button).
4. **Estimate the spacing scale.** Look for consistent gaps and infer a base unit (often 4px or 8px). Record the implied scale.
5. **Estimate the typography scale.** Identify distinct sizes/weights and assign roles (page title, section title, body, caption).
6. **Sample the color palette.** Pick out distinct colors — backgrounds, text, borders, accents, semantic colors (success/warning/danger). Record approximate hex values.
7. **Note any patterns or textures** (background gradients, repeated icons, decorative imagery).
8. **Note the language** of the visible text.
9. **Flag inconsistencies** between screenshots — e.g., button radius differs across two shots, or two shots use different greens for "success".

Output: per-screenshot notes plus a consolidated draft design system manifest.

## Building a design system from screenshots

If no `tokens.css` is provided, derive a token set:

- **Colors.** Cluster sampled values into a small palette. Avoid recording every minor variation as a separate token — round to the nearest plausible value and propose a scale (e.g., 50 / 100 / 200 / … / 900) only if multiple shades of the same hue appear. Otherwise stick to flat semantic names (`--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent`).
- **Typography.** Propose 4–8 size tokens covering the roles you identified.
- **Spacing.** Propose an 8pt or 4pt scale.
- **Radii.** Usually 2–4 distinct values are enough.
- **Shadows.** Hard to estimate from a screenshot — propose a small set (sm/md/lg) and call it out for confirmation.

**Always present this derived token set to the user for confirmation before implementing it.** Use Phase 5 (Approval Gate) to do so.

## Resolving conflicts with other sources

When screenshots are mixed with other sources:

| Conflict | Resolution |
|----------|-----------|
| Token file says color X, screenshot looks like color Y | Token file wins. Note the screenshot variance for the user. |
| Token file has no entry for what the screenshot shows | The screenshot is the only signal — propose a new token, ask the user to confirm. |
| Two screenshots disagree | Surface both to the user in Phase 5. Do not pick one silently. |
| Screenshot disagrees with project's existing implementation | Decide via Phase 5 whether the screenshot defines the new state (overwrite project) or is itself out of date. |

## What to ask the user when screenshots are sparse

A handful of screenshots will not cover an entire app. In Phase 1, ask:

- **Which pages exist in the new design?** (Helps populate the `NEW` and `OBSOLETE` lists.)
- **Are there interaction states I should know about (hover, focus, disabled, error)?**
- **Is there a font specification I can rely on, or should I estimate from the screenshot?**
- **Is there a brand color reference (a hex code from the brand guidelines)?**
- **Should I assume responsive behavior (mobile/tablet/desktop), and if so, are mobile screenshots forthcoming?**

These questions go into Phase 5 alongside the `NEW` / `OBSOLETE` decisions to avoid mid-flow interruptions.

## Multimodal usage

When the harness supports image input:

- Read screenshots directly to extract layout and component identity.
- Use color sampling judiciously — verify any hex value of importance with the user.
- For text content, transcribe directly rather than re-typing from memory; copy is part of the design.

When the harness does not support image input:

- Ask the user to describe the screenshots, or to provide the design as a token file or markup instead.
- Do not invent visual details from the filename or surrounding context.

## Checklist before leaving Phase 2 (screenshot path)

- [ ] Every screenshot has been mapped to a screen name.
- [ ] A draft token set exists covering colors, typography, spacing, radii, shadows.
- [ ] Inconsistencies between screenshots are documented.
- [ ] A list of "things I cannot tell from screenshots alone" is prepared for Phase 5.
- [ ] UI language is identified.
- [ ] Asset gaps (icons, images that the screenshot implies but no source file exists) are flagged.
