"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function listFiles(root) {
  const entries = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.isFile()) {
        entries.push(path.relative(root, full).replace(/\\/g, "/"));
      }
    }
  }

  walk(root);
  return entries.sort();
}

function isExecutable(mode) {
  return (mode & 0o111) !== 0;
}

test("claude plugin ships the same hook surface as codex plugin", () => {
  const codexRoot = path.join(__dirname, "..", ".codex-plugin", "hooks");
  const claudeRoot = path.join(__dirname, "..", ".claude-plugin", "hooks");
  const codexHooks = listFiles(codexRoot);
  const claudeHooks = listFiles(claudeRoot);

  assert.deepEqual(claudeHooks, codexHooks);

  for (const relPath of codexHooks) {
    const codexMode = fs.statSync(path.join(codexRoot, relPath)).mode;
    const claudeMode = fs.statSync(path.join(claudeRoot, relPath)).mode;
    assert.equal(isExecutable(codexMode), true, `codex hook is not executable: ${relPath}`);
    assert.equal(isExecutable(claudeMode), true, `claude hook is not executable: ${relPath}`);
    assert.equal(
      isExecutable(claudeMode),
      isExecutable(codexMode),
      `executable bit mismatch for ${relPath}`
    );
  }
});
