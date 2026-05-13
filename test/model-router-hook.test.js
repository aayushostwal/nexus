"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function loadRouter() {
  const modulePath = require.resolve("../pre-tool-use/model-router");
  delete require.cache[modulePath];
  return require("../pre-tool-use/model-router");
}

function restoreEnv(name, value) {
  if (typeof value === "undefined") {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

async function withIsolatedEnv(fn) {
  const originalHome = process.env.HOME;
  const originalCwd = process.cwd();
  const originalClaudeModel = process.env.CLAUDE_MODEL;
  const originalCodexModel = process.env.CODEX_MODEL;
  const originalRuntime = process.env.NEXUS_AI_RUNTIME;
  const originalSmallTokens = process.env.NEXUS_SMALL_PROMPT_MAX_TOKENS;
  const originalSmallWords = process.env.NEXUS_SMALL_PROMPT_MAX_WORDS;

  try {
    await fn();
  } finally {
    process.chdir(originalCwd);
    restoreEnv("HOME", originalHome);
    restoreEnv("CLAUDE_MODEL", originalClaudeModel);
    restoreEnv("CODEX_MODEL", originalCodexModel);
    restoreEnv("NEXUS_AI_RUNTIME", originalRuntime);
    restoreEnv("NEXUS_SMALL_PROMPT_MAX_TOKENS", originalSmallTokens);
    restoreEnv("NEXUS_SMALL_PROMPT_MAX_WORDS", originalSmallWords);
  }
}

test("session-start writes runtime state file without CLI toggles", async () => {
  await withIsolatedEnv(async () => {
    const repoRoot = makeTempDir("nexus-router-repo-");
    const homeRoot = makeTempDir("nexus-router-home-");
    process.chdir(repoRoot);
    process.env.HOME = homeRoot;
    process.env.CLAUDE_MODEL = "claude-sonnet-4-6-20250514";

    const claudeDir = path.join(homeRoot, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, "settings.json"),
      JSON.stringify({ model: "claude-sonnet-4-6-20250514" }, null, 2),
      "utf8"
    );

    const router = loadRouter();
    await router({
      hookEventName: "session-start",
      context: { cwd: repoRoot, session: { id: "claude-session-1" }, messageHistory: [] },
    });

    const statePath = path.join(repoRoot, ".nexus", "model-router-runtime.json");
    assert.equal(fs.existsSync(statePath), true);
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(state.runtime, "claude");
    assert.equal(state.enabled, true);
    assert.equal(state.action, "observed");
  });
});

test("user prompt submit switches to small model and restores on larger prompt", async () => {
  await withIsolatedEnv(async () => {
    const repoRoot = makeTempDir("nexus-router-repo-");
    const homeRoot = makeTempDir("nexus-router-home-");
    process.chdir(repoRoot);
    process.env.HOME = homeRoot;
    process.env.NEXUS_SMALL_PROMPT_MAX_TOKENS = "120";
    process.env.NEXUS_SMALL_PROMPT_MAX_WORDS = "20";

    const claudeDir = path.join(homeRoot, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });
    const settingsPath = path.join(claudeDir, "settings.json");
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ model: "claude-sonnet-4-6-20250514" }, null, 2),
      "utf8"
    );

    const router = loadRouter();
    await router({
      hookEventName: "user-prompt-submit",
      context: {
        cwd: repoRoot,
        session: { id: "claude-session-2" },
        messageHistory: [{ content: "Small ask: fix typo" }],
      },
    });

    let settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    assert.equal(settings.model, "claude-haiku-4-5-20251001");

    await router({
      hookEventName: "user-prompt-submit",
      context: {
        cwd: repoRoot,
        session: { id: "claude-session-2" },
        messageHistory: [
          {
            content:
              "Please design and explain a production rollout plan with validation, rollback criteria, dependency analysis, and exhaustive acceptance checks for this feature set.",
          },
        ],
      },
    });

    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    assert.equal(settings.model, "claude-sonnet-4-6-20250514");

    const statePath = path.join(repoRoot, ".nexus", "model-router-runtime.json");
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(state.action, "restored-large");
    assert.equal(state.currentModel, "claude-sonnet-4-6-20250514");
  });
});

test("codex session-start writes observed model state", async () => {
  await withIsolatedEnv(async () => {
    const repoRoot = makeTempDir("nexus-router-repo-");
    const homeRoot = makeTempDir("nexus-router-home-");
    process.chdir(repoRoot);
    process.env.HOME = homeRoot;
    process.env.CODEX_MODEL = "gpt-5.5";

    const router = loadRouter();
    await router({
      hookEventName: "session-start",
      context: { cwd: repoRoot, session: { id: "codex-session-1" }, messageHistory: [] },
    });

    const statePath = path.join(repoRoot, ".nexus", "model-router-runtime.json");
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(state.runtime, "codex");
    assert.equal(state.currentModel, "gpt-5.5");
  });
});
