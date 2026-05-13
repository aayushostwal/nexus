"use strict";

const fs = require("node:fs");
const path = require("node:path");

const START_MARKER = "<!-- nexus-agent-kit:skills-first:start -->";
const END_MARKER = "<!-- nexus-agent-kit:skills-first:end -->";
const STATE_DIR = ".nexus";
const STATE_FILE = "bootstrap-state.json";
const PLUGIN_ID = "nexus";

function runBootstrap(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const runtime = resolveRuntime(options);
  const targetFiles = resolveTargetFiles(runtime);
  const version = readPackageVersion();
  const statePath = path.join(repoRoot, STATE_DIR, STATE_FILE);
  const state = readJsonSafe(statePath);
  const runtimeState = state?.runtimes?.[runtime];

  const shouldSkip =
    runtimeState?.plugin === PLUGIN_ID &&
    runtimeState?.version === version &&
    targetFiles.every((file) => hasManagedBlock(path.join(repoRoot, file)));

  if (shouldSkip) {
    return {
      skipped: true,
      repoRoot,
      runtime,
      updatedFiles: [],
      version,
    };
  }

  const updatedFiles = [];
  for (const file of targetFiles) {
    const fullPath = path.join(repoRoot, file);
    upsertManagedBlock(fullPath, buildManagedBlock(version));
    updatedFiles.push(fullPath);
  }

  const nextState = {
    plugin: PLUGIN_ID,
    runtimes: {
      ...(state?.runtimes || {}),
      [runtime]: {
        plugin: PLUGIN_ID,
        version,
        targetFiles,
        updatedAt: new Date().toISOString(),
      },
    },
  };

  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(nextState, null, 2), "utf8");

  return {
    skipped: false,
    repoRoot,
    runtime,
    updatedFiles,
    version,
  };
}

function resolveRepoRoot(options) {
  const candidate =
    options.repoRoot ||
    options.context?.cwd ||
    process.env.CLAUDE_PROJECT_DIR ||
    process.cwd();
  return path.resolve(candidate);
}

function readPackageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function resolveRuntime(options = {}) {
  if (options.runtime) return options.runtime;
  const text = `${options.context?.session?.id || ""} ${process.env.CLAUDE_SESSION_ID || ""} ${process.env.CODEX_SESSION_ID || ""}`.toLowerCase();
  if (text.includes("codex")) return "codex";
  if (text.includes("claude")) return "claude";
  return process.env.NEXUS_AI_RUNTIME || "claude";
}

function resolveTargetFiles(runtime) {
  if (runtime === "codex") {
    return ["AGENT.md"];
  }
  return ["CLAUDE.md"];
}

function hasManagedBlock(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  return content.includes(START_MARKER) && content.includes(END_MARKER);
}

function buildManagedBlock(version) {
  return [
    START_MARKER,
    `# Nexus Agent Kit Instructions`,
    "",
    "The block below is managed by Nexus Agent Kit. Keep the instruction active.",
    "",
    "- Before doing anything else, search for relevant skills first and then use the most relevant skill before any other action.",
    "",
    `<!-- nexus-agent-kit:version ${version} -->`,
    END_MARKER,
  ].join("\n");
}

function upsertManagedBlock(filePath, block) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (!existing.trim()) {
    fs.writeFileSync(filePath, `${block}\n`, "utf8");
    return;
  }

  const startIndex = existing.indexOf(START_MARKER);
  const endIndex = existing.indexOf(END_MARKER);
  if (startIndex >= 0 && endIndex > startIndex) {
    const before = existing.slice(0, startIndex).replace(/\s*$/, "");
    const after = existing.slice(endIndex + END_MARKER.length).replace(/^\s*/, "");
    const next = [before, block, after].filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n");
    fs.writeFileSync(filePath, `${next}\n`, "utf8");
    return;
  }

  const suffix = existing.endsWith("\n") ? "" : "\n";
  fs.writeFileSync(filePath, `${existing}${suffix}\n${block}\n`, "utf8");
}

module.exports = {
  runBootstrap,
  resolveRuntime,
  resolveTargetFiles,
  upsertManagedBlock,
};

if (require.main === module) {
  try {
    const result = runBootstrap();
    if (!result.skipped) {
      console.log(`Nexus bootstrap updated ${result.updatedFiles.length} file(s) in ${result.repoRoot}`);
    }
  } catch (error) {
    console.error(`Nexus bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  }
}
