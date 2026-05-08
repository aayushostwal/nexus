#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d .git ]]; then
  echo "This script must be run from a git repository." >&2
  exit 1
fi

mkdir -p .git/hooks
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "Installed pre-commit hook: .git/hooks/pre-commit"
