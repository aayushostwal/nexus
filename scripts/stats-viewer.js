#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SOURCES = ["claude", "codex"];

function parseArgs(argv) {
  const options = {
    summary: false,
    last: 10,
    source: "all",
    session: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--summary") {
      options.summary = true;
      continue;
    }
    if (arg === "--last") {
      options.last = Number.parseInt(argv[i + 1], 10);
      i += 1;
      continue;
    }
    if (arg.startsWith("--last=")) {
      options.last = Number.parseInt(arg.slice("--last=".length), 10);
      continue;
    }
    if (arg === "--source") {
      options.source = (argv[i + 1] || "all").toLowerCase();
      i += 1;
      continue;
    }
    if (arg.startsWith("--source=")) {
      options.source = arg.slice("--source=".length).toLowerCase();
      continue;
    }
    if (arg === "--session") {
      options.session = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (!arg.startsWith("--") && !options.session) {
      options.session = arg;
    }
  }

  if (!Number.isFinite(options.last) || options.last < 1) {
    options.last = 10;
  }
  if (!["all", ...SOURCES].includes(options.source)) {
    throw new Error("--source must be one of: all, claude, codex");
  }

  return options;
}

function statsPaths(source) {
  const root = path.join(os.homedir(), `.${source}`, "stats");
  return {
    events: path.join(root, `${source}-stats.jsonl`),
    summary: path.join(root, "session-summary.json"),
  };
}

function formatMoney(value) {
  return `$${value.toFixed(5)}`;
}

function formatInt(value) {
  return value.toLocaleString("en-US");
}

function fixed(value, width) {
  const text = String(value);
  return text.length > width ? `${text.slice(0, width - 1)}…` : text.padEnd(width);
}

function loadEvents(source) {
  const file = statsPaths(source).events;
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        const record = JSON.parse(line);
        return { ...record, runtime: source };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function loadSummaries(source) {
  const file = statsPaths(source).summary;
  if (!fs.existsSync(file)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return Object.values(data).map((entry) => ({ ...entry, runtime: source }));
  } catch {
    return [];
  }
}

function printSummary(options) {
  const sources = options.source === "all" ? SOURCES : [options.source];
  const summaries = sources.flatMap(loadSummaries).sort((a, b) => b.last_updated.localeCompare(a.last_updated));

  if (summaries.length === 0) {
    console.log("No session summaries found.");
    return;
  }

  console.log("Session summaries");
  console.log("runtime  session         calls  input       output      total       cost      last updated");
  console.log("-------  --------------  -----  ----------  ----------  ----------  --------  -------------------");

  for (const item of summaries) {
    const total = (item.total_input_tokens || 0) + (item.total_output_tokens || 0);
    console.log(
      `${fixed(item.runtime, 7)}  ${fixed((item.session_id || "").slice(-14), 14)}  ${fixed(item.call_count || 0, 5)}  ${fixed(formatInt(item.total_input_tokens || 0), 10)}  ${fixed(formatInt(item.total_output_tokens || 0), 10)}  ${fixed(formatInt(total), 10)}  ${fixed(formatMoney(item.total_cost_usd || 0), 8)}  ${fixed(item.last_updated || "", 19)}`
    );
  }
}

function printEvents(options) {
  const sources = options.source === "all" ? SOURCES : [options.source];
  let events = sources.flatMap(loadEvents).sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));

  if (options.session) {
    events = events.filter((entry) => entry.session_id === options.session);
  }

  if (events.length === 0) {
    console.log("No matching stats records found.");
    return;
  }

  events = events.slice(-options.last);

  console.log("API call stats");
  console.log("time                 runtime  model                 input      output     total      cost");
  console.log("-------------------  -------  --------------------  ---------  ---------  ---------  --------");

  for (const item of events) {
    const when = new Date(item.timestamp).toISOString().replace("T", " ").slice(0, 19);
    console.log(
      `${fixed(when, 19)}  ${fixed(item.runtime || "", 7)}  ${fixed(item.model || "unknown", 20)}  ${fixed(formatInt(item.input_tokens || 0), 9)}  ${fixed(formatInt(item.output_tokens || 0), 9)}  ${fixed(formatInt(item.total_tokens || 0), 9)}  ${fixed(formatMoney(item.cost_usd || 0), 8)}`
    );
  }

  const totals = events.reduce(
    (acc, entry) => {
      acc.input += entry.input_tokens || 0;
      acc.output += entry.output_tokens || 0;
      acc.cost += entry.cost_usd || 0;
      return acc;
    },
    { input: 0, output: 0, cost: 0 }
  );

  console.log("");
  console.log(`Calls: ${events.length}`);
  console.log(`Input tokens: ${formatInt(totals.input)}`);
  console.log(`Output tokens: ${formatInt(totals.output)}`);
  console.log(`Total tokens: ${formatInt(totals.input + totals.output)}`);
  console.log(`Estimated cost: ${formatMoney(totals.cost)}`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.summary) {
    printSummary(options);
    return;
  }
  printEvents(options);
}

main();
