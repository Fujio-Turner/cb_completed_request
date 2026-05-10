#!/usr/bin/env bash
# tests/lint.sh — run the same Python lint checks CI runs.
#
# Use this BEFORE pushing to avoid red CI builds:
#   bash tests/lint.sh           # check only
#   bash tests/lint.sh --fix     # check + auto-fix what's safely fixable
#
# CI uses the EXACT same `ruff` version (pinned in tests/requirements-dev.txt)
# and the EXACT same config (pyproject.toml at the repo root), so a clean
# local run guarantees a clean CI run.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Make sure ruff is available — if not, install dev deps into the active env.
if ! command -v ruff > /dev/null 2>&1; then
    echo "🟡 ruff not found — installing from tests/requirements-dev.txt"
    pip install -q -r tests/requirements-dev.txt
fi

PINNED="$(grep -E '^ruff==' tests/requirements-dev.txt | sed -E 's/^ruff==([^[:space:]#]+).*/\1/')"
INSTALLED="$(ruff --version | awk '{print $2}')"
if [ "$PINNED" != "$INSTALLED" ]; then
    echo "⚠️  ruff version mismatch — pinned=$PINNED installed=$INSTALLED"
    echo "    Run: pip install -r tests/requirements-dev.txt"
fi

TARGETS=(app/ tests/python/)

if [ "${1:-}" = "--fix" ]; then
    echo "🔧 ruff check --fix on: ${TARGETS[*]}"
    ruff check --fix "${TARGETS[@]}"
    echo "✅ Fixes applied. Re-run without --fix to verify clean state."
else
    echo "🔍 ruff check on: ${TARGETS[*]}"
    ruff check "${TARGETS[@]}"
    echo "✅ Lint passed — safe to push."
fi
