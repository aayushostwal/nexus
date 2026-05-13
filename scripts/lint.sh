#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking JavaScript syntax"
node --check bin/nexus.js
node --check scripts/bump-version.js
node --check scripts/bootstrap-agent-docs.js
node --check scripts/core.js
node --check scripts/model-router-hook.js
node --check scripts/model-router-state.js
node --check scripts/log-stats.js
node --check scripts/stats-viewer.js
node --check scripts/sync-versions.js
node --check scripts/validate-codex-plugin.js
node --check .claude/hooks/post-response/log-stats.js
node --check pre-tool-use/model-router.js
node --check .codex-plugin/hooks/pre-tool-use/model-router.js
node --check .codex-plugin/hooks/session-start/model-router.js
node --check .codex-plugin/hooks/user-prompt-submit/model-router.js
node --check .codex-plugin/hooks/post-response/log-stats.js

echo "Checking Bash syntax"
bash -n scripts/lint.sh
bash -n hooks/pre-commit

echo "Checking JSON files"
node - <<'NODE'
const fs = require("fs");
const path = require("path");

const ignored = new Set([".git", ".npm-cache", ".tmp-nexus", "node_modules"]);
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
}

walk(".");

for (const file of files) {
  JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(file);
}
NODE

echo "Checking Codex plugin manifest"
node scripts/validate-codex-plugin.js

echo "Lint passed"
