#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const modelRouterHook = require("../pre-tool-use/model-router");

function parseInput() {
  if (process.stdin.isTTY) return {};
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function normalizeMessageHistory(event) {
  if (Array.isArray(event.message_history)) return event.message_history;
  if (Array.isArray(event.messageHistory)) return event.messageHistory;

  const prompt = event.prompt || event.user_prompt || event.userPrompt || event.message;
  if (typeof prompt === "string" && prompt.trim()) {
    return [{ content: prompt }];
  }

  return [];
}

function normalizePayload(event, runtimeHint) {
  const hookEventName = event.hook_event_name || event.hookEventName;
  const toolName = event.tool_name || event.toolName;
  const sessionId = event.session_id || event.sessionId || `${runtimeHint || "claude"}-hook-session`;

  const context = {
    cwd: event.cwd || process.cwd(),
    session: { id: sessionId },
    messageHistory: normalizeMessageHistory(event),
  };

  return { toolName, hookEventName, context };
}

async function run(runtimeHint) {
  const event = parseInput();
  const payload = normalizePayload(event, runtimeHint);

  if (!process.env.NEXUS_AI_RUNTIME && runtimeHint) {
    process.env.NEXUS_AI_RUNTIME = runtimeHint;
  }

  const result = await modelRouterHook(payload);
  if (result && typeof result === "object") {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }
}

if (require.main === module) {
  const runtimeHint = process.argv[2];
  run(runtimeHint).catch((error) => {
    process.stderr.write(`nexus model-router hook error: ${error.message}\n`);
    process.exit(0);
  });
}

module.exports = {
  run,
};
