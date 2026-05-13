"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

function runStatsHook({ hookPath, runtime, sessionId, model }) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "nexus-stats-"));
  const event = {
    session_id: sessionId,
    timestamp: "2026-05-13T12:00:00.000Z",
    model,
    usage: {
      input_tokens: 120,
      output_tokens: 80,
    },
  };

  assert.ok(fs.existsSync(hookPath));

  const hookResult = spawnSync(process.execPath, [hookPath], {
    env: {
      ...process.env,
      HOME: home,
      CLAUDE_SESSION_ID: runtime === "claude" ? sessionId : process.env.CLAUDE_SESSION_ID,
      CODEX_SESSION_ID: runtime === "codex" ? sessionId : process.env.CODEX_SESSION_ID,
    },
    input: `${JSON.stringify(event)}\n`,
    encoding: "utf8",
  });

  assert.equal(hookResult.status, 0, hookResult.stderr);

  const statsFile = path.join(home, `.${runtime}`, "stats", `${runtime}-stats.jsonl`);
  assert.ok(fs.existsSync(statsFile));

  const viewerResult = spawnSync(
    process.execPath,
    [path.join(__dirname, "..", "scripts", "stats-viewer.js"), "--source", runtime, "--session", sessionId],
    {
      env: {
        ...process.env,
        HOME: home,
      },
      encoding: "utf8",
    }
  );

  assert.equal(viewerResult.status, 0, viewerResult.stderr);
  assert.match(viewerResult.stdout, /API call stats/);
  assert.match(viewerResult.stdout, new RegExp(model.slice(0, Math.min(18, model.length))));
  assert.match(viewerResult.stdout, /120/);
  assert.match(viewerResult.stdout, /80/);
}

test("claude stats hook writes records that nexus stats can read", () => {
  runStatsHook({
    hookPath: path.join(__dirname, "..", ".claude-plugin", "hooks", "post-response", "log-stats.js"),
    runtime: "claude",
    sessionId: "claude-session-test",
    model: "claude-sonnet-4-20250514",
  });
});

test("codex stats hook writes records that nexus stats can read", () => {
  runStatsHook({
    hookPath: path.join(__dirname, "..", ".codex-plugin", "hooks", "post-response", "log-stats.js"),
    runtime: "codex",
    sessionId: "codex-session-test",
    model: "gpt-5.5",
  });
});
