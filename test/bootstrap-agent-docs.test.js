"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { runBootstrap, upsertManagedBlock } = require("../scripts/bootstrap-agent-docs");

function makeTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "nexus-bootstrap-"));
}

test("bootstrap creates CLAUDE.md with managed block for claude runtime", () => {
  const repoRoot = makeTempRepo();
  const result = runBootstrap({ repoRoot, runtime: "claude" });

  assert.equal(result.skipped, false);
  assert.equal(fs.existsSync(path.join(repoRoot, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(repoRoot, "AGENT.md")), false);
  assert.equal(fs.existsSync(path.join(repoRoot, ".nexus", "bootstrap-state.json")), true);

  const claudeContent = fs.readFileSync(path.join(repoRoot, "CLAUDE.md"), "utf8");
  assert.match(claudeContent, /search for relevant skills first/i);
});

test("bootstrap is idempotent once state and markers exist", () => {
  const repoRoot = makeTempRepo();
  const first = runBootstrap({ repoRoot, runtime: "claude" });
  const second = runBootstrap({ repoRoot, runtime: "claude" });

  assert.equal(first.skipped, false);
  assert.equal(second.skipped, true);
});

test("bootstrap creates AGENT.md for codex runtime", () => {
  const repoRoot = makeTempRepo();
  const result = runBootstrap({ repoRoot, runtime: "codex" });

  assert.equal(result.skipped, false);
  assert.equal(fs.existsSync(path.join(repoRoot, "AGENT.md")), true);
  assert.equal(fs.existsSync(path.join(repoRoot, "CLAUDE.md")), false);
});

test("managed block upsert preserves existing user content", () => {
  const repoRoot = makeTempRepo();
  const filePath = path.join(repoRoot, "CLAUDE.md");
  fs.writeFileSync(filePath, "# Existing user instructions\n\nDo not delete this.\n", "utf8");

  upsertManagedBlock(filePath, "<!-- nexus-agent-kit:skills-first:start -->\nmanaged\n<!-- nexus-agent-kit:skills-first:end -->");
  const next = fs.readFileSync(filePath, "utf8");

  assert.match(next, /Existing user instructions/);
  assert.match(next, /managed/);
});
