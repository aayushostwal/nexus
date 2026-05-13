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

test("claude plugin ships the same hook surface as codex plugin", () => {
  const codexHooks = listFiles(path.join(__dirname, "..", ".codex-plugin", "hooks"));
  const claudeHooks = listFiles(path.join(__dirname, "..", ".claude-plugin", "hooks"));

  assert.deepEqual(claudeHooks, codexHooks);
});
