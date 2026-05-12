#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const MODEL_COSTS = [
  { pattern: /haiku/i, inputPerMillion: 0.25, outputPerMillion: 1.25 },
  { pattern: /sonnet/i, inputPerMillion: 3, outputPerMillion: 15 },
  { pattern: /opus/i, inputPerMillion: 15, outputPerMillion: 75 },
  { pattern: /gpt-5\.5/i, inputPerMillion: 5, outputPerMillion: 15 },
  { pattern: /gpt-5\.4-mini/i, inputPerMillion: 0.3, outputPerMillion: 1.2 },
  { pattern: /gpt-5\.4|gpt-5\.3-codex|gpt-5\.2/i, inputPerMillion: 1.25, outputPerMillion: 5 },
];

function detectRuntime(runtimeHint) {
  if (runtimeHint) return runtimeHint;
  const hint = `${process.env.CLAUDE_SESSION_ID || ""} ${process.env.CODEX_SESSION_ID || ""}`.toLowerCase();
  if (hint.includes("claude")) return "claude";
  if (hint.includes("codex")) return "codex";
  return process.env.NEXUS_AI_RUNTIME || "claude";
}

function getPaths(runtime) {
  const root = path.join(os.homedir(), `.${runtime}`, "stats");
  return {
    dir: root,
    eventsFile: path.join(root, `${runtime}-stats.jsonl`),
    summaryFile: path.join(root, "session-summary.json"),
  };
}

function parseInput() {
  if (process.stdin.isTTY) return {};
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function pickCost(model) {
  return MODEL_COSTS.find((entry) => entry.pattern.test(model)) || { inputPerMillion: 1.5, outputPerMillion: 6 };
}

function tokenCount(usage) {
  const input = usage.input_tokens || usage.prompt_tokens || 0;
  const output = usage.output_tokens || usage.completion_tokens || 0;
  return { input, output, total: input + output };
}

function calcCost(model, inputTokens, outputTokens) {
  const cost = pickCost(model);
  return (inputTokens * cost.inputPerMillion + outputTokens * cost.outputPerMillion) / 1_000_000;
}

function getSessionId(event, runtime) {
  return (
    event.session_id ||
    process.env.CLAUDE_SESSION_ID ||
    process.env.CODEX_SESSION_ID ||
    `${runtime}-session-${new Date().toISOString().slice(0, 19)}`
  );
}

function updateSessionSummary(summaryFile, sessionId, record) {
  let summary = {};
  if (fs.existsSync(summaryFile)) {
    try {
      summary = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
    } catch {
      summary = {};
    }
  }

  if (!summary[sessionId]) {
    summary[sessionId] = {
      session_id: sessionId,
      start_time: record.timestamp,
      runtime: record.runtime,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cost_usd: 0,
      call_count: 0,
      last_updated: record.timestamp,
    };
  }

  const entry = summary[sessionId];
  entry.total_input_tokens += record.input_tokens;
  entry.total_output_tokens += record.output_tokens;
  entry.total_cost_usd += record.cost_usd;
  entry.call_count += 1;
  entry.last_updated = record.timestamp;

  fs.writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

function run(runtimeHint) {
  const runtime = detectRuntime(runtimeHint);
  const paths = getPaths(runtime);
  fs.mkdirSync(paths.dir, { recursive: true });

  const event = parseInput();
  const usage = event.response?.usage || event.usage || event.token_usage || {};
  const model = event.model || event.response?.model || process.env.CLAUDE_MODEL || process.env.CODEX_MODEL || "unknown";
  const timestamp = event.timestamp || new Date().toISOString();
  const sessionId = getSessionId(event, runtime);
  const tokens = tokenCount(usage);

  const record = {
    timestamp,
    runtime,
    session_id: sessionId,
    model,
    input_tokens: tokens.input,
    output_tokens: tokens.output,
    total_tokens: tokens.total,
    cost_usd: calcCost(model, tokens.input, tokens.output),
    tool_calls: event.tool_calls || [],
    message_preview: typeof event.user_message === "string" ? event.user_message.slice(0, 120) : "",
  };

  fs.appendFileSync(paths.eventsFile, `${JSON.stringify(record)}\n`, "utf8");
  updateSessionSummary(paths.summaryFile, sessionId, record);
}

if (require.main === module) {
  try {
    run(process.argv[2]);
  } catch {
    process.exit(0);
  }
}

module.exports = { run };
