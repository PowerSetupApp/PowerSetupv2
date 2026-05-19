# Reference — Strict Cleanup Checklist

Used in Phase 7 of `SKILL.md`. The goal is **zero legacy design code** in the project after migration. This file defines exactly what to sweep, how to verify each candidate, and how to format the Cleanup Report the user signs off on.

## Sweep categories

Walk these in order. For each candidate file/symbol, confirm with a grep pass before adding it to the Cleanup Report.

### 1. Old token / theme files

Look for and evaluate:

- Dedicated token files that are now superseded (e.g., `theme.css`, `variables.scss`, `_colors.scss`, `tokens.old.css`).
- Theme objects passed into providers (`oldTheme.ts`, `legacyTheme.js`).
- Legacy color/spacing sections inside `tailwind.config.*` that have been replaced.
- Multiple competing token sources after migration (only one source of truth should remain).

If a file mixes old and new tokens, do not delete it — edit it down to the new tokens only.

### 2. CSS classes no longer referenced

For each `.css` / `.scss` / `.module.css` file touched during Phase 6:

1. List every class selector defined in the file.
2. For each class, grep across the project (templates, JSX, Vue, Svelte, etc.) for usages.
3. Classes with zero hits → cleanup candidates.
4. Special cases: classes used dynamically (e.g., `cn(\`btn-${variant}\`)`) are easy to miss. Inspect any template-string class composition before declaring a class dead.

### 3. Components no longer used

Triggered by:

- Items marked `OBSOLETE (delete)` in the Phase 5 approval batch.
- Components silently replaced during Phase 6 because a new primitive subsumed them.

For each candidate:

1. Grep for the component name across the project.
2. Verify zero remaining imports.
3. Check for indirect references (string-based dynamic imports, route configs, registry maps).
4. Add to Cleanup Report only if confirmed unused.

### 4. Unused assets

Walk the asset directory (images, icons, fonts, SVGs):

- For each file, grep for its filename across the project.
- Files with zero references → cleanup candidates.
- Watch for assets referenced via dynamic paths (`require(\`./icons/${name}.svg\`)`) — preserve those even if grep misses literal matches.

Special care:

- **Fonts.** If the new design uses different fonts, remove old font files AND the `@font-face` declarations / `<link>` tags / Tailwind font config entries that loaded them.
- **Favicons / app icons.** Replace if the new design provides them. Do not leave a mismatched favicon.

### 5. Stories, demos, sandboxes

If the project has Storybook, Histoire, or similar:

- Find stories tied to deleted components → delete stories too.
- Find stories that reference old token names or CSS classes → update or delete.

If the project has demo pages or `/sandbox` routes built around the old design → update or delete based on Phase 5 decisions.

### 6. Dead imports

After component replacements, files often retain imports that are no longer used:

- Run the linter (most projects flag `no-unused-vars` / `unused-imports`).
- Manually scan files touched in Phase 6 for imports that point to deleted modules.

### 7. Legacy build / styling configuration

Scan top-level config files for residue:

- `postcss.config.*` plugins tied to the old setup (e.g., a plugin that processed a removed SCSS partial).
- `tailwind.config.*` plugin entries no longer used.
- `vite.config.*` / `webpack.config.*` aliases that point to deleted directories.
- Storybook addons configured against deleted modules.
- Global styles imported in the entry file but no longer needed.

### 8. Renamed / duplicated tokens

If the migration introduced new token names while old names linger as aliases (`--old-name: var(--new-name)`), evaluate:

- If components still reference old names → migrate the references, then drop the alias.
- If nothing references old names → drop the alias outright.

The end state should have **no aliases bridging old and new names**. The new names are the only names.

### 9. Comments referencing old design

Search for comments mentioning the old design system, old component names, or "legacy" / "deprecated" / "old". These are usually safe to delete as part of cleanup. Do not delete comments that document business logic.

## Verification rules per candidate

Before adding a file to the Cleanup Report:

1. **Grep search** for the file's basename and any exported symbol names across the entire project. Zero hits required.
2. **Dynamic-reference check.** Look for template-string imports, `require()` calls, or registry maps that might reference the file indirectly.
3. **Test-suite check.** Confirm no test imports the file. If a test does, decide together with the user whether the test stays or goes.
4. **Build-time configuration check.** Confirm the file is not listed in any config file's `include`, `entry`, `paths`, or `alias` fields.

If any check is uncertain → mark the candidate as **needs review** in the report rather than as **delete**, and ask the user.

## Files that must NOT be deleted during cleanup

Even when they appear unused, leave alone:

- Test files, test fixtures, snapshot folders.
- CI/CD configs (`.github/`, `.gitlab-ci.yml`, etc.).
- Lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`).
- License files, contributor docs, READMEs.
- `.gitignore`, `.editorconfig`, `.prettierrc`, etc.
- Type definitions for runtime APIs that have no compile-time references.
- Anything outside the design layer (backend code, API clients, data models, business logic).

If the design migration accidentally orphans test files because a component was deleted, surface that to the user — do not delete the tests; they may need to be updated for the new component.

## Cleanup Report template

Produce this report in Phase 7 and present it to the user before any deletions are committed. Save it as `REDESIGN-CLEANUP-REPORT.md` at the project root (or another agreed location).

```markdown
# Redesign Cleanup Report

Generated for the migration from <old design label> to <new design label>.

## Summary

- Deletion candidates: <N>
- Files needing review: <M>
- Total LOC removed (approx): <X>

## To delete (confirmed unused)

| Path | Type | Reason |
|------|------|--------|
| src/styles/old-tokens.css | tokens | Superseded by src/styles/tokens.css from new design |
| src/components/legacy/Banner.tsx | component | Replaced by src/components/Hero.tsx; zero remaining imports |
| public/assets/old-logo.svg | asset | Replaced by public/assets/mark.svg; zero references |
| ... | ... | ... |

## Needs review (uncertain)

| Path | Reason for uncertainty |
|------|------------------------|
| src/components/Banner.test.tsx | Test for deleted Banner.tsx — should this be deleted or updated for the new Hero component? |
| ... | ... |

## To keep (intentionally retained)

| Path | Reason |
|------|--------|
| src/components/legacy/PrintTemplate.tsx | Used by reports module; not part of the visual redesign scope |
| ... | ... |

## Config edits

| File | Edit |
|------|------|
| tailwind.config.js | Removed deprecated colors.brand-old block; removed unused fontFamily.serifLegacy entry |
| postcss.config.js | Removed plugin postcss-legacy-vars |
| ... | ... |
```

## Process for Phase 7

1. Build the report by walking the sweep categories.
2. Verify every candidate per the rules above.
3. Present the report to the user in a single message.
4. Wait for explicit confirmation. If `AskUserQuestion` is available, offer per-section options (delete all / review one-by-one / cancel) — otherwise ask in plain text.
5. Apply deletions in a dedicated commit, separate from Phase 6 implementation commits.
6. Re-run build/lint/type-check after deletion. Any failure → restore the file, mark it for review, and continue.

## Final exit criterion

Phase 7 is complete when:

- The Cleanup Report is approved by the user.
- All approved deletions are applied.
- Build + lint + type-check all pass.
- A grep for any old token name, old class name, or old asset filename returns zero results.
