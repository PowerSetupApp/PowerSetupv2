#!/usr/bin/env python3
"""
postToolUse hook: nudge the agent when a structural path was written.
Reads hook JSON from stdin; prints JSON to stdout. Fail-open on any error.
"""
from __future__ import annotations

import json
import sys


# Substrings in normalized paths (forward slashes, lowercased) that warrant checking the Kontext-Atlas.
STRUCTURAL_FRAGMENTS: tuple[str, ...] = (
    "src/app/",
    "src/proxy",
    "prisma/",
    "next.config.",
    "src/store/",
    "src/lib/algorithm/",
    "src/lib/recommendation/",
    "src/lib/db/",
    "src/lib/ai/",
    "src/lib/amazon/",
    "src/lib/pdf/",
    "src/lib/payments/",
)


def _normalize(p: str) -> str:
    return p.replace("\\", "/").lower()


def _extract_path(tool_input: object) -> str | None:
    if isinstance(tool_input, str):
        try:
            tool_input = json.loads(tool_input)
        except json.JSONDecodeError:
            return None
    if not isinstance(tool_input, dict):
        return None
    for key in (
        "path",
        "file_path",
        "target_file",
        "relative_workspace_path",
        "file",
    ):
        v = tool_input.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def _is_structural(path_norm: str) -> bool:
    if ".cursor/hooks/" in path_norm:
        return False
    if ".context/architecture.md" in path_norm:
        return False
    if path_norm.endswith("package.json") and "node_modules" not in path_norm:
        return True
    return any(frag in path_norm for frag in STRUCTURAL_FRAGMENTS)


def main() -> None:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            print("{}", flush=True)
            return
        data = json.loads(raw)
    except Exception:
        print("{}", flush=True)
        return

    path = _extract_path(data.get("tool_input"))
    if not path:
        print("{}", flush=True)
        return

    norm = _normalize(path)
    if not _is_structural(norm):
        print("{}", flush=True)
        return

    msg = (
        "[Kontext-Atlas] Strukturrelevante Datei wurde geschrieben. "
        "Falls sich Ownership, Flows oder Kopplungen geändert haben: `.context/architecture.md` "
        "im selben Durchlauf anpassen (Zielgröße / Konsolidierung beachten)."
    )
    print(json.dumps({"additional_context": msg}), flush=True)


if __name__ == "__main__":
    main()
