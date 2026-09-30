"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { runBootstrap, upsertManagedBlock, buildManagedBlock, readPackageVersion, resolveRuntime } = require("../scripts/bootstrap-agent-docs");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nexus-bootstrap-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { targetRoot: path.join(root, "target"), stateRoot: path.join(root, "state"), runtime: "claude" };
}

for (const runtime of ["claude", "codex"]) {
  test(`bootstrap installs current manifest version in ${runtime}'s recognized instruction file`, (t) => {
    const options = { ...fixture(t), runtime };
    const result = runBootstrap(options);
    const filename = runtime === "codex" ? "AGENTS.md" : "CLAUDE.md";
    assert.equal(result.version, require("../.claude-plugin/plugin.json").version);
    assert.deepEqual(fs.readdirSync(options.targetRoot), [filename]);
    assert.match(fs.readFileSync(path.join(options.targetRoot, filename), "utf8"), /Skill instructions do not grant additional tool permissions/);
    assert.ok(fs.existsSync(path.join(options.stateRoot, "bootstrap-state.json")));
    assert.equal(fs.existsSync(path.join(options.stateRoot, ".nexus")), false);
    assert.equal(runBootstrap(options).skipped, true);
  });
}

test("preview writes neither instructions nor state", (t) => {
  const options = fixture(t);
  const result = runBootstrap({ ...options, dryRun: true });
  assert.equal(result.changes.length, 1);
  assert.deepEqual(result.updatedFiles, []);
  assert.equal(fs.existsSync(options.targetRoot), false);
  assert.equal(fs.existsSync(options.stateRoot), false);
});

test("updates stale managed content even when cached version matches; preserves surrounding bytes", (t) => {
  const options = fixture(t);
  runBootstrap(options);
  const file = path.join(options.targetRoot, "CLAUDE.md");
  const before = "# User rules\r\n\r\nKeep this spacing.  \r\n";
  const after = "\n\n\n# More user rules\n";
  const stale = buildManagedBlock(readPackageVersion()).replace("Use a relevant installed", "STALE: use a relevant installed");
  fs.writeFileSync(file, before + stale + after);
  assert.equal(runBootstrap(options).skipped, false);
  assert.equal(fs.readFileSync(file, "utf8"), before + buildManagedBlock(readPackageVersion()) + after);
});

test("a new manifest version refreshes the managed block", (t) => {
  const options = fixture(t);
  runBootstrap(options);
  const pluginRoot = path.join(options.stateRoot, "plugin-fixture");
  fs.mkdirSync(path.join(pluginRoot, ".claude-plugin"), { recursive: true });
  fs.writeFileSync(path.join(pluginRoot, ".claude-plugin/plugin.json"), JSON.stringify({ version: "99.1.0" }));
  const result = runBootstrap({ ...options, pluginRoot });
  assert.equal(result.skipped, false);
  assert.match(fs.readFileSync(path.join(options.targetRoot, "CLAUDE.md"), "utf8"), /version 99\.1\.0/);
});

test("Codex migration removes only the legacy managed block and preserves user instructions", (t) => {
  const options = { ...fixture(t), runtime: "codex" };
  fs.mkdirSync(options.targetRoot, { recursive: true });
  const legacy = path.join(options.targetRoot, "AGENT.md");
  fs.writeFileSync(legacy, "before\n" + buildManagedBlock("0.0.0") + "\nafter\n");
  runBootstrap(options);
  assert.equal(fs.readFileSync(legacy, "utf8"), "before\n\nafter\n");
  assert.ok(fs.existsSync(path.join(options.targetRoot, "AGENTS.md")));
});

test("removal preserves all user text, supports preview, and is idempotent", (t) => {
  const options = fixture(t);
  runBootstrap(options);
  const file = path.join(options.targetRoot, "CLAUDE.md");
  const content = "user prefix\n" + buildManagedBlock(readPackageVersion()) + "\nuser suffix\n";
  fs.writeFileSync(file, content);
  runBootstrap({ ...options, remove: true, dryRun: true });
  assert.equal(fs.readFileSync(file, "utf8"), content);
  runBootstrap({ ...options, remove: true });
  assert.equal(fs.readFileSync(file, "utf8"), "user prefix\n\nuser suffix\n");
  assert.equal(runBootstrap({ ...options, remove: true }).skipped, true);
});

test("malformed legacy markers prevent all instruction writes", (t) => {
  const options = { ...fixture(t), runtime: "codex" };
  fs.mkdirSync(options.targetRoot, { recursive: true });
  fs.writeFileSync(path.join(options.targetRoot, "AGENT.md"), "<!-- nexus-agent-kit:skills-first:start -->\nuser data");
  assert.throws(() => runBootstrap(options), /Malformed/);
  assert.equal(fs.existsSync(path.join(options.targetRoot, "AGENTS.md")), false);
  assert.equal(fs.existsSync(options.stateRoot), false);
});

test("symlink instructions are rejected without touching their destination", (t) => {
  const options = fixture(t);
  fs.mkdirSync(options.targetRoot, { recursive: true });
  const original = path.join(options.targetRoot, "original");
  fs.writeFileSync(original, "untouched");
  fs.symlinkSync(original, path.join(options.targetRoot, "CLAUDE.md"));
  assert.throws(() => runBootstrap(options), /non-regular file/);
  assert.equal(fs.readFileSync(original, "utf8"), "untouched");
});

test("upsert preserves existing text and rejects duplicate managed blocks", (t) => {
  const options = fixture(t);
  fs.mkdirSync(options.targetRoot, { recursive: true });
  const file = path.join(options.targetRoot, "CLAUDE.md");
  fs.writeFileSync(file, "Existing rules without a newline");
  const block = buildManagedBlock("1.0.0");
  upsertManagedBlock(file, block);
  assert.equal(fs.readFileSync(file, "utf8"), "Existing rules without a newline\n\n" + block + "\n");
  fs.appendFileSync(file, block);
  const original = fs.readFileSync(file, "utf8");
  assert.throws(() => upsertManagedBlock(file, block), /duplicate/);
  assert.equal(fs.readFileSync(file, "utf8"), original);
});

test("invalid runtimes fail before writing", (t) => {
  const options = fixture(t);
  assert.throws(() => runBootstrap({ ...options, runtime: "unknown" }), /runtime must/);
  assert.equal(fs.existsSync(options.targetRoot), false);
  assert.equal(resolveRuntime({ runtime: "codex" }), "codex");
});

test("CLI flags support a safe fresh-environment preview and reject unknown flags", (t) => {
  const options = fixture(t);
  const script = path.join(__dirname, "../scripts/bootstrap-agent-docs.js");
  const args = [script, "--runtime", "codex", "--target-root", options.targetRoot, "--state-root", options.stateRoot, "--dry-run"];
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /AGENTS\.md/);
  assert.equal(fs.existsSync(options.targetRoot), false);
  assert.equal(spawnSync(process.execPath, [script, "--wat"]).status, 1);
});
