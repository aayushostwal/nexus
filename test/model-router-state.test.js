"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { modelRouterStatus, setRouterMode } = require("../scripts/core");
const { isModelRouterEnabled } = require("../scripts/model-router-state");

function makeTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "nexus-router-"));
}

test("model router is enabled by default", () => {
  const repoRoot = makeTempRepo();
  const originalCwd = process.cwd();
  process.chdir(repoRoot);

  try {
    assert.equal(isModelRouterEnabled(), true);
  } finally {
    process.chdir(originalCwd);
  }
});

test("model router command toggles state and reports status", () => {
  const repoRoot = makeTempRepo();
  const originalCwd = process.cwd();
  process.chdir(repoRoot);

  try {
    const disabled = setRouterMode("disable").join("\n");
    assert.match(disabled, /disabled/i);
    assert.equal(isModelRouterEnabled(), false);

    const status = modelRouterStatus().join("\n");
    assert.match(status, /disabled/i);

    const enabled = setRouterMode("enable").join("\n");
    assert.match(enabled, /enabled/i);
    assert.equal(isModelRouterEnabled(), true);
  } finally {
    process.chdir(originalCwd);
  }
});
