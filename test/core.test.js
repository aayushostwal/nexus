"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { classifyTodo, renderTodos } = require("../scripts/core");

function cliFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nexus-core-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const env = { ...process.env, NEXUS_HOME: path.join(root, "state"), NEXUS_TODO_FILE: path.join(root, "todos", "TODOS.md"), NO_COLOR: "1" };
  return { env, run: (...args) => spawnSync(process.execPath, [path.join(__dirname, "../bin/nexus.js"), ...args], { env, encoding: "utf8" }) };
}

test("classifies tasks by domain, with a general fallback", () => {
  for (const [text, label] of [["Fix pytest failures", "Python"], ["Review Claude Code", "Claude"], ["Check AWS CloudWatch", "AWS"], ["Reply to Outlook invite", "Outlook"], ["Buy pencils", "General"]]) {
    assert.equal(classifyTodo(text), label);
  }
});

test("renders open tasks by group, honoring limits and excluding done tasks", () => {
  const output = renderTodos([
    { done: true, label: "Python", text: "Completed" },
    { done: false, label: "Python", text: "Fix pytest" },
    { done: false, label: "Work", text: "Send report" },
    { done: false, label: "Work", text: "Later" },
  ], { color: false, limit: 2 });
  assert.match(output, /\[Python\]/);
  assert.match(output, /Fix pytest/);
  assert.match(output, /\[Work\]/);
  assert.doesNotMatch(output, /Completed|Later|\u001b/);
  assert.equal(renderTodos([]), "Nexus TODOs: no open items.");
});

test("CLI adds and lists literal task text in independent storage across processes", (t) => {
  const { env, run } = cliFixture(t);
  const text = "Review $& and $1 and $(echo unsafe) and `literal`";
  const added = run("add", text);
  assert.equal(added.status, 0, added.stderr);
  assert.match(added.stdout, /Added \[Work\]/);
  assert.equal(run("add", "Follow up tomorrow").status, 0);
  const listed = run("todos", "--no-color", "--limit", "2");
  assert.equal(listed.status, 0, listed.stderr);
  assert.ok(listed.stdout.includes(text));
  assert.ok(listed.stdout.indexOf("Follow up tomorrow") < listed.stdout.indexOf(text));
  assert.ok(fs.readFileSync(env.NEXUS_TODO_FILE, "utf8").includes(text));
});

test("multiline task input remains a single retrievable TODO", (t) => {
  const { run } = cliFixture(t);
  assert.equal(run("add", "Fix first line\nthen second line").status, 0);
  const result = run("todos", "--no-color");
  assert.ok(result.stdout.includes("Fix first line then second line"), result.stdout);
});

test("CLI rejects empty tasks, unknown commands, and malformed limits", (t) => {
  const { run } = cliFixture(t);
  for (const args of [["add", "   "], ["unknown"], ["todos", "--limit", "0"], ["todos", "--limit", "2junk"], ["todos", "--limit", "1.5"], ["todos", "--limit"]]) {
    assert.equal(run(...args).status, 1, args.join(" "));
  }
});

test("all plugin and marketplace versions match the canonical manifest", () => {
  const canonical = require("../.claude-plugin/plugin.json").version;
  for (const filename of [".codex-plugin/plugin.json", ".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json"]) {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"));
    assert.equal(manifest.version, canonical, filename);
    for (const plugin of manifest.plugins || []) assert.equal(plugin.version, canonical, filename);
  }
});
