"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { runBootstrap, upsertManagedBlock } = require("../scripts/bootstrap-agent-docs");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "nexus-bootstrap-"));
}

test("bootstrap creates CLAUDE.md under claude home for claude runtime", () => {
  const targetRoot = makeTempDir();
  const stateRoot = makeTempDir();
  const result = runBootstrap({ targetRoot, stateRoot, runtime: "claude" });

  assert.equal(result.skipped, false);
  assert.equal(fs.existsSync(path.join(targetRoot, "CLAUDE.md")), true);
  assert.equal(fs.existsSync(path.join(targetRoot, "AGENT.md")), false);
  assert.equal(fs.existsSync(path.join(stateRoot, ".nexus", "bootstrap-state.json")), true);

  const claudeContent = fs.readFileSync(path.join(targetRoot, "CLAUDE.md"), "utf8");
  assert.match(claudeContent, /search for relevant skills first/i);
  assert.match(claudeContent, /token-optimizer skill/i);
});

test("bootstrap is idempotent once state and markers exist", () => {
  const targetRoot = makeTempDir();
  const stateRoot = makeTempDir();
  const first = runBootstrap({ targetRoot, stateRoot, runtime: "claude" });
  const second = runBootstrap({ targetRoot, stateRoot, runtime: "claude" });

  assert.equal(first.skipped, false);
  assert.equal(second.skipped, true);
});

test("bootstrap creates AGENT.md under codex home for codex runtime", () => {
  const targetRoot = makeTempDir();
  const stateRoot = makeTempDir();
  const result = runBootstrap({ targetRoot, stateRoot, runtime: "codex" });

  assert.equal(result.skipped, false);
  assert.equal(fs.existsSync(path.join(targetRoot, "AGENT.md")), true);
  assert.equal(fs.existsSync(path.join(targetRoot, "CLAUDE.md")), false);
});

test("managed block upsert preserves existing user content", () => {
  const targetRoot = makeTempDir();
  const filePath = path.join(targetRoot, "CLAUDE.md");
  fs.writeFileSync(filePath, "# Existing user instructions\n\nDo not delete this.\n", "utf8");

  upsertManagedBlock(filePath, "<!-- nexus-agent-kit:skills-first:start -->\nmanaged\n<!-- nexus-agent-kit:skills-first:end -->");
  const next = fs.readFileSync(filePath, "utf8");

  assert.match(next, /Existing user instructions/);
  assert.match(next, /managed/);
});
