"use strict";

const assert = require("node:assert/strict");
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
