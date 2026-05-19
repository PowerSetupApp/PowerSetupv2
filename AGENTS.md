# PowerSetup — Agent Context

Behavioral guidelines to reduce common LLM coding mistakes. Apply these first, then project-specific rules below.

Tradeoff: these guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that your changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if fewer unnecessary changes land in diffs, fewer rewrites happen due to overcomplication, and clarifying questions happen before implementation mistakes.

## Graphify

This project has a graphify knowledge graph at `graphify-out/`.
- Before architecture/codebase answers, read `graphify-out/GRAPH_REPORT.md`.
- If `graphify-out/wiki/index.md` exists, use it before reading many raw files.
- For cross-module relation questions, prefer `graphify query`, `graphify path`, and `graphify explain`.
- After modifying code files in this session, run `graphify update .`.

## Projekt-Kontext

Mobile-first Next.js 16 app for camping electrical planning: 8-step wizard -> algorithm -> AI recommendations -> optional PDF wiring plan.
User flow and admin flow are separate (`/admin/*` is operator-only).

- Main feature/spec index: [features/INDEX.md](features/INDEX.md)
- Rewrite plan and target structure: [REWRITE_PLAN.md](REWRITE_PLAN.md)
- Admin overview: [docs/reference/ADMIN-AGENT-BRIEF.md](docs/reference/ADMIN-AGENT-BRIEF.md)
- Admin checklist: [features/PS-7-admin-panel.md](features/PS-7-admin-panel.md)
- Detailed workflows and skills: [.cursor/rules/general.mdc](.cursor/rules/general.mdc) and `.agents/skills/`

