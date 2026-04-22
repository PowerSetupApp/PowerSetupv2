Lies **[AGENTS.md](AGENTS.md)** für den vollständigen Projekt-Kontext.

**Admin-Panel (Betreiber-UI):** [docs/reference/ADMIN-AGENT-BRIEF.md](docs/reference/ADMIN-AGENT-BRIEF.md) und [features/PS-7-admin-panel.md](features/PS-7-admin-panel.md) — getrennt vom Endnutzer-Wizard.

## graphify

This project has a graphify knowledge graph at graphify-out/. The graph corpus is limited by [.graphifyignore](.graphifyignore) (e.g. `docs/reference/old` and generated legacy SDK noise are excluded so the graph centers on the live app under `src/` and current reference docs).

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)