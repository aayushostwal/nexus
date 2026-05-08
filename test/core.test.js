"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { classifyTodo, renderTodos } = require("../scripts/core");

test("classifies todos by obvious domain", () => {
  assert.equal(classifyTodo("Fix pytest failures in parser"), "Python");
  assert.equal(classifyTodo("Review Claude Code workflow"), "Claude");
  assert.equal(classifyTodo("Check AWS CloudWatch errors"), "AWS");
  assert.equal(classifyTodo("Reply to Outlook calendar invite"), "Outlook");
});

test("renders grouped todos without color", () => {
  const output = renderTodos(
    [
      { done: false, label: "Python", text: "Fix pytest", created: "2026-05-08T00:00:00.000Z" },
      { done: false, label: "Work", text: "Send report", created: "2026-05-08T00:00:00.000Z" },
    ],
    { color: false }
  );

  assert.match(output, /\[Python\]/);
  assert.match(output, /Fix pytest/);
  assert.match(output, /\[Work\]/);
  assert.match(output, /Send report/);
});

test("plugin manifests match package version", () => {
  const packageVersion = require("../package.json").version;
  const versionCounter = fs.readFileSync("VERSION", "utf8").trim();
  const codex = JSON.parse(fs.readFileSync(".codex-plugin/plugin.json", "utf8"));
  const claude = JSON.parse(fs.readFileSync(".claude-plugin/plugin.json", "utf8"));
  const marketplace = JSON.parse(fs.readFileSync(".claude-plugin/marketplace.json", "utf8"));
  const expectedVersion = `${packageVersion.split(".")[0]}.${versionCounter}.0`;

  assert.equal(packageVersion, expectedVersion);
  assert.equal(codex.version, packageVersion);
  assert.equal(claude.version, packageVersion);
  assert.equal(marketplace.version, packageVersion);
  assert.equal(marketplace.plugins[0].version, packageVersion);
});
