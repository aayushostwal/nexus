#!/usr/bin/env node
"use strict";

const modelRouter = require("../pre-tool-use/model-router");

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    process.stdin.resume();
  });
}

async function main() {
  const raw = await readStdin();
  const payload = raw.trim() ? JSON.parse(raw) : {};
  const toolName = payload.tool_name || payload.toolName || payload.hook_event_name || "Hook";
  const context = {
    cwd: payload.cwd,
    session: {
      id: payload.session_id,
    },
  };

  await modelRouter({
    toolName,
    context,
    hookEventName: payload.hook_event_name || "Hook",
  });
}

main().catch((error) => {
  console.error(`Nexus model-router hook failed: ${error.message}`);
  process.exitCode = 1;
});
