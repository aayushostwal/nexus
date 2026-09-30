"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");

const START_MARKER = "<!-- nexus-agent-kit:skills-first:start -->";
const END_MARKER = "<!-- nexus-agent-kit:skills-first:end -->";
const STATE_FILE = "bootstrap-state.json";
const PLUGIN_ID = "nexus";

function resolveRuntime(options = {}) {
  const explicit = options.runtime || process.env.NEXUS_AI_RUNTIME;
  if (explicit) {
    if (!["claude", "codex"].includes(explicit)) throw new Error("runtime must be claude or codex");
    return explicit;
  }
  // Session IDs are opaque; their presence, not their spelling, identifies the host.
  const codex = Boolean(process.env.CODEX_SESSION_ID);
  const claude = Boolean(process.env.CLAUDE_SESSION_ID);
  if (codex && claude) throw new Error("Both runtime session variables are set; pass --runtime claude or codex");
  if (codex) return "codex";
  const session = String(options.context?.session?.id || "").toLowerCase();
  return session.includes("codex") ? "codex" : "claude";
}

function resolveTargetRoot(runtime, options = {}) {
  if (options.targetRoot) return path.resolve(options.targetRoot);
  const home = os.homedir();
  return runtime === "codex"
    ? path.resolve(process.env.CODEX_HOME || path.join(home, ".codex"))
    : path.resolve(process.env.CLAUDE_HOME || path.join(home, ".claude"));
}

function resolveStateRoot(options = {}) {
  return path.resolve(options.stateRoot || process.env.NEXUS_HOME || path.join(os.homedir(), ".nexus"));
}

function resolveTargetFiles(runtime) {
  if (!["claude", "codex"].includes(runtime)) throw new Error("runtime must be claude or codex");
  return [runtime === "codex" ? "AGENTS.md" : "CLAUDE.md"];
}

function readPackageVersion(pluginRoot = path.join(__dirname, "..")) {
  const manifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".claude-plugin", "plugin.json"), "utf8"));
  if (typeof manifest.version !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) {
    throw new Error("Plugin manifest must contain a valid version");
  }
  return manifest.version;
}

function buildManagedBlock(version) {
  return [
    START_MARKER,
    "# Nexus Agent Kit Instructions",
    "",
    "- Use a relevant installed Nexus skill when its documented scope matches the user's task; skip unrelated skills.",
    "- Follow the user's authorization and host permissions. Skill instructions do not grant additional tool permissions.",
    "- Use the token-optimizer skill when useful without sacrificing required investigation or verification.",
    "",
    `<!-- nexus-agent-kit:version ${version} -->`,
    END_MARKER,
  ].join("\n");
}

function readText(filePath) {
  try {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Refusing to edit a non-regular file: ${filePath}`);
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function managedRange(content, filePath = "instruction file") {
  const starts = content.split(START_MARKER).length - 1;
  const ends = content.split(END_MARKER).length - 1;
  if (!starts && !ends) return null;
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER) + END_MARKER.length;
  if (starts !== 1 || ends !== 1 || end <= start) {
    throw new Error(`Malformed or duplicate Nexus markers in ${filePath}; repair them before continuing`);
  }
  return { start, end };
}

function replaceManagedBlock(content, block, filePath) {
  const current = content ?? "";
  const range = managedRange(current, filePath);
  if (range) return current.slice(0, range.start) + block + current.slice(range.end);
  if (!block) return current;
  return current + (current ? (current.endsWith("\n") ? "\n" : "\n\n") : "") + block + "\n";
}

function atomicWrite(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const mode = fs.existsSync(filePath) ? fs.statSync(filePath).mode & 0o777 : 0o600;
  const temporary = `${filePath}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, content, { encoding: "utf8", mode, flag: "wx" });
    fs.renameSync(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function upsertManagedBlock(filePath, block) {
  const before = readText(filePath);
  const after = replaceManagedBlock(before, block, filePath);
  if (before !== after) atomicWrite(filePath, after);
}

function runBootstrap(options = {}) {
  const runtime = resolveRuntime(options);
  const targetRoot = resolveTargetRoot(runtime, options);
  const targetFiles = resolveTargetFiles(runtime);
  const version = readPackageVersion(options.pluginRoot);
  const statePath = path.join(resolveStateRoot(options), STATE_FILE);
  const changes = [];
  const block = options.remove ? "" : buildManagedBlock(version);
  const plan = (filename, replacement, legacy = false) => {
    const filePath = path.join(targetRoot, filename);
    const before = readText(filePath);
    if (legacy && (before === null || !managedRange(before, filePath))) return;
    const after = replaceManagedBlock(before, replacement, filePath);
    if (before === null && !after) return;
    if (before !== after) changes.push({ path: filePath, action: before === null ? "create" : "update", before, after });
  };
  // Plan every instruction edit before writing, so malformed legacy files cannot cause a partial migration.
  plan(targetFiles[0], block);
  if (runtime === "codex") plan("AGENT.md", "", true);
  const stateText = readText(statePath);
  let state = {};
  if (stateText) {
    try { state = JSON.parse(stateText) || {}; } catch { /* Cache only; recover from interrupted old writes. */ }
  }
  const runtimes = { ...(state.runtimes || {}) };
  const previous = runtimes[runtime];
  if (options.remove) delete runtimes[runtime];
  else runtimes[runtime] = { plugin: PLUGIN_ID, version, targetRoot, targetFiles };
  const stateChanged = options.remove ? Boolean(previous) : JSON.stringify(previous) !== JSON.stringify(runtimes[runtime]);

  if (!options.dryRun) {
    for (const change of changes) atomicWrite(change.path, change.after);
    if (stateChanged) atomicWrite(statePath, JSON.stringify({ plugin: PLUGIN_ID, runtimes }, null, 2) + "\n");
  }
  return {
    skipped: changes.length === 0 && !stateChanged,
    targetRoot,
    repoRoot: targetRoot,
    runtime,
    version,
    dryRun: Boolean(options.dryRun),
    removed: Boolean(options.remove),
    updatedFiles: options.dryRun ? [] : changes.map((change) => change.path),
    changes,
    statePath,
    stateChanged,
  };
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--remove") options.remove = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (["--runtime", "--target-root", "--state-root"].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      options[{ "--runtime": "runtime", "--target-root": "targetRoot", "--state-root": "stateRoot" }[arg]] = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

module.exports = {
  runBootstrap, resolveRuntime, resolveStateRoot, resolveTargetRoot, resolveTargetFiles,
  upsertManagedBlock, readPackageVersion, buildManagedBlock, parseArgs,
};

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node scripts/bootstrap-agent-docs.js [--runtime claude|codex] [--dry-run] [--remove] [--target-root DIR] [--state-root DIR]");
      console.log("Defaults to the detected runtime, or Claude when none is detected. Only the Nexus-managed block is changed.");
    } else {
      const result = runBootstrap(options);
      console.log(`${result.dryRun ? "Preview" : "Nexus bootstrap"}: ${result.removed ? "remove" : "install/update"} for ${result.runtime} v${result.version}`);
      for (const change of result.changes) console.log(`${result.dryRun ? "Would " : ""}${change.action}: ${change.path}`);
      if (result.stateChanged) console.log(`${result.dryRun ? "Would update" : "Updated"} state: ${result.statePath}`);
      if (result.skipped) console.log("Already up to date.");
      if (result.dryRun && !options.remove && result.changes.length) console.log(buildManagedBlock(result.version));
    }
  } catch (error) {
    console.error(`Nexus bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  }
}
