"use strict";

const fs = require("node:fs");
const path = require("node:path");

const STATE_DIR = ".nexus";
const STATE_FILE = "model-router-state.json";

function resolveRepoRoot(options = {}) {
  const candidate =
    options.repoRoot ||
    options.context?.cwd ||
    process.env.CLAUDE_PROJECT_DIR ||
    process.cwd();
  return path.resolve(candidate);
}

function getStatePath(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  return path.join(repoRoot, STATE_DIR, STATE_FILE);
}

function readState(options = {}) {
  const statePath = getStatePath(options);
  if (!fs.existsSync(statePath)) {
    return { enabled: true, statePath };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return {
      enabled: parsed?.enabled !== false,
      statePath,
    };
  } catch {
    return { enabled: true, statePath };
  }
}

function isModelRouterEnabled(options = {}) {
  return readState(options).enabled;
}

function setModelRouterEnabled(enabled, options = {}) {
  const statePath = getStatePath(options);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(
    statePath,
    JSON.stringify(
      {
        enabled: Boolean(enabled),
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );
  return { enabled: Boolean(enabled), statePath };
}

module.exports = {
  getStatePath,
  isModelRouterEnabled,
  readState,
  resolveRepoRoot,
  setModelRouterEnabled,
};
