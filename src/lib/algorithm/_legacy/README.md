# `_legacy/` — Frozen snapshot of the previous 9-phase algorithm

This folder is a **backup only**. Nothing under here is imported by the live
application code and nothing here is executed in tests.

## What lives here

- `calculate.ts` — old orchestrator (9 phases, trace / mermaid, settings merge).
- `types.ts` — old `AlgorithmInput` / `AlgorithmOutput` + `AlgorithmSettingsData`
  + `ComponentClasses`. The two Prisma-shaped settings types have been re-homed
  as a *dormant* file at `../legacy-settings-types.ts` so the admin
  „Algorithmus" panel keeps compiling. The file here is the historical source.
- `constants.ts` — old numeric defaults (PSH matrix, Wp/m², DoD, roof
  orientation, charger hours, …).
- `settings-adapter.ts` — old `mergeAlgorithmSettings` adapter (DB → input).
- `trace.ts` / `mermaid.ts` — old trace + Mermaid visualization.
- `phases/*` — phases 1–8 + apply-overrides + settings helper + barrel.
- `*.test.ts` / `__snapshots__/` — Vitest suites for the old algorithm.
- `constants-backup.json` — schema defaults and the live `AlgorithmSettings`
  row captured at the point of the rewrite. If the admin panel is ever
  re-wired to the new algorithm, use this as the reference set.

## Why

The new algorithm under `../` is a 1:1 TypeScript port of
`docs/reference/algorithm/camper_electrics_sizing.py` (spec:
`docs/reference/algorithm/inputs.md`). It is a pure function with hardcoded
constants and no DB adapter.

This snapshot is kept so we can cross-check intermediate numbers and behavior
while the new algorithm is being validated in production. It must NEVER be
imported from app code.

## Enforcement

- `vitest.config.ts` excludes `src/lib/algorithm/_legacy/**` from the test
  run so the frozen test files don't execute (and their imports don't leak
  back into the active graph).
- `.eslintignore` excludes the same path so dead code here doesn't produce
  lint errors during refactors.

If you see anything under `src/` importing from `@/lib/algorithm/_legacy/*`,
that is a bug — please delete the import.
