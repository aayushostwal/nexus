"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const HOME = os.homedir();
const NEXUS_HOME = process.env.NEXUS_HOME || path.join(HOME, ".nexus");
const TODO_FILE = process.env.NEXUS_TODO_FILE || path.join(NEXUS_HOME, "TODOS.md");
const STATE_FILE = path.join(NEXUS_HOME, "state.json");

const LABEL_RULES = [
  ["AI", /\b(ai|llm|model|prompt|inference|agent|embedding|rag|vector|token)\b/i],
  ["Claude", /\b(claude|anthropic|claude code|claude\.md)\b/i],
  ["Codex", /\b(codex|openai|agents\.md|gpt)\b/i],
  ["AWS", /\b(aws|lambda|ecs|eks|s3|cloudwatch|iam|bedrock|ec2|rds)\b/i],
  ["Jira", /\b(jira|ticket|issue|sprint|backlog|epic|story)\b/i],
  ["Slack", /\b(slack|channel|thread|dm|message)\b/i],
  ["Outlook", /\b(outlook|email|mail|calendar|meeting|invite)\b/i],
  ["Work", /\b(work|client|project|follow up|deadline|review|report)\b/i],
  ["Personal", /\b(personal|home|family|doctor|bank|bill)\b/i],
];

const LABEL_COLORS = {
  AWS: "33",
  Claude: "35",
  Codex: "36",
  Jira: "34",
  Outlook: "94",
  Personal: "37",
  AI: "32",
  Slack: "92",
  Work: "31",
  General: "90",
};

function ensureNexusHome() {
  fs.mkdirSync(NEXUS_HOME, { recursive: true });
  if (!fs.existsSync(TODO_FILE)) {
    fs.writeFileSync(TODO_FILE, initialTodos(), "utf8");
  }
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ dailyBriefLastRun: null }, null, 2), "utf8");
  }
}

function initialTodos() {
  return [
    "# Nexus TODOs",
    "",
    "This file is managed by `nexus-agent-kit`.",
    "",
    "## Open",
    "",
    "## Done",
    "",
  ].join("\n");
}

function classifyTodo(text) {
  for (const [label, pattern] of LABEL_RULES) {
    if (pattern.test(text)) return label;
  }
  return "General";
}

function addTodo(text, options = {}) {
  ensureNexusHome();
  const label = options.label || classifyTodo(text);
  const created = new Date().toISOString();
  const todo = { created, label, text, status: "open" };
  const line = `- [ ] <!-- nexus:${created} label:${label} --> ${text}`;
  const current = fs.readFileSync(TODO_FILE, "utf8");
  const next = insertOpenTodo(current, line);
  fs.writeFileSync(TODO_FILE, next, "utf8");
  return todo;
}

function insertOpenTodo(markdown, line) {
  if (!markdown.includes("## Open")) {
    return `${markdown.trim()}\n\n## Open\n\n${line}\n`;
  }
  return markdown.replace(/(## Open\s*\n)/, `$1\n${line}\n`);
}

function readTodos() {
  ensureNexusHome();
  const markdown = fs.readFileSync(TODO_FILE, "utf8");
  const todos = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const match = rawLine.match(/^- \[( |x)\] <!-- nexus:([^ ]+) label:([^ ]+) --> (.*)$/);
    if (!match) continue;
    todos.push({
      done: match[1] === "x",
      created: match[2],
      label: match[3],
      text: match[4],
    });
  }
  return todos;
}

function renderTodos(todos, options = {}) {
  const color = options.color !== false && !process.env.NO_COLOR;
  const limit = options.limit || 20;
  const open = todos.filter((todo) => !todo.done).slice(0, limit);
  if (open.length === 0) {
    return "Nexus TODOs: no open items.";
  }

  const groups = new Map();
  for (const todo of open) {
    if (!groups.has(todo.label)) groups.set(todo.label, []);
    groups.get(todo.label).push(todo);
  }

  const lines = ["Nexus TODOs"];
  for (const [label, items] of groups) {
    lines.push("");
    lines.push(formatLabel(label, color));
    for (const item of items) {
      lines.push(`  - ${item.text}`);
    }
  }
  return lines.join("\n");
}

function formatLabel(label, color) {
  if (!color) return `[${label}]`;
  const code = LABEL_COLORS[label] || LABEL_COLORS.General;
  return `\u001b[${code}m[${label}]\u001b[0m`;
}

function install(options = {}) {
  ensureNexusHome();
  const messages = [];
  if (options.shellHook) {
    installShellHook(messages);
  } else {
    messages.push("Shell hook not installed. Run `nexus install --shell-hook` or add this manually:");
    messages.push(printShellHook());
  }
  messages.push(`Global TODO file: ${TODO_FILE}`);
  return messages;
}

function update() {
  ensureNexusHome();
  return ["Nexus is plugin-first. No template update is required.", `Global TODO file: ${TODO_FILE}`];
}

function installShellHook(messages) {
  const zshrc = path.join(HOME, ".zshrc");
  const marker = "# nexus-agent-kit shell hook";
  const hook = `${marker}\ncommand -v nexus >/dev/null 2>&1 && nexus todos --limit 8\n`;
  const current = fs.existsSync(zshrc) ? fs.readFileSync(zshrc, "utf8") : "";
  if (current.includes(marker)) {
    messages.push("Shell hook already present in ~/.zshrc.");
    return;
  }
  fs.appendFileSync(zshrc, `${current.endsWith("\n") ? "" : "\n"}\n${hook}`, "utf8");
  messages.push("Installed shell TODO hook in ~/.zshrc.");
}

function printShellHook() {
  return "command -v nexus >/dev/null 2>&1 && nexus todos --limit 8";
}

function printHelp() {
  return [
    "Nexus Agent Kit",
    "",
    "Usage:",
    '  nexus add "Follow up with client about AWS cost"',
    "  nexus todos [--limit 20] [--no-color]",
    "  nexus install [--shell-hook]",
    "  nexus update",
    "  nexus shell-hook",
    "",
    "Global files:",
    `  ${TODO_FILE}`,
    `  ${NEXUS_HOME}`,
  ].join("\n");
}

module.exports = {
  addTodo,
  classifyTodo,
  install,
  printHelp,
  printShellHook,
  readTodos,
  renderTodos,
  update,
};
