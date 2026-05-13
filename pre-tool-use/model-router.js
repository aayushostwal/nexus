"use strict";

const fs = require("fs");
const path = require("path");
const { runBootstrap } = require("../scripts/bootstrap-agent-docs");
const { isModelRouterEnabled, resolveRepoRoot } = require("../scripts/model-router-state");

const MODEL_BY_RUNTIME = {
  claude: process.env.NEXUS_CLAUDE_DEFAULT_MODEL || "claude-sonnet-4-6-20250514",
  codex: "gpt-5.4-mini",
};

const SETTINGS_PATH = path.join(process.env.HOME || "", ".claude", "settings.json");
const SMALL_EDIT_MODEL = "claude-haiku-4-5-20251001";
const MARKER_PATH = path.join(process.env.HOME || "", ".nexus", ".model-router-original");
const RUNTIME_STATE_FILE = "model-router-runtime.json";
const SMALL_PROMPT_MAX_TOKENS = Number(process.env.NEXUS_SMALL_PROMPT_MAX_TOKENS || 180);
const SMALL_PROMPT_MAX_WORDS = Number(process.env.NEXUS_SMALL_PROMPT_MAX_WORDS || 50);

function detectRuntime(context) {
  const text = `${context?.session?.id || ""} ${process.env.CLAUDE_SESSION_ID || ""} ${process.env.CODEX_SESSION_ID || ""}`.toLowerCase();
  if (text.includes("codex")) return "codex";
  if (text.includes("claude")) return "claude";
  return process.env.NEXUS_AI_RUNTIME || "claude";
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 4));
}

function getPromptMetrics(context) {
  const content = context?.messageHistory?.slice(-1)[0]?.content || "";
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const words = text
    .split(/\s+/)
    .filter(Boolean).length;
  const chars = text.length;
  const tokens = Math.ceil(chars / 4);
  return { words, chars, tokens };
}

function getRuntimeStatePath(context) {
  return path.join(resolveRepoRoot({ context }), ".nexus", RUNTIME_STATE_FILE);
}

function writeRuntimeState(context, payload) {
  const statePath = getRuntimeStatePath(context);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(
    statePath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        ...payload,
      },
      null,
      2
    ),
    "utf8"
  );
}

function readCurrentModel(runtime) {
  if (runtime === "claude") {
    return readSettings().model || process.env.CLAUDE_MODEL || MODEL_BY_RUNTIME.claude;
  }
  if (runtime === "codex") {
    return process.env.CODEX_MODEL || MODEL_BY_RUNTIME.codex;
  }
  return "default";
}

function shouldHandlePromptRouting(toolName, trigger) {
  const normalized = String(trigger || "").toLowerCase();
  if (normalized === "user-prompt-submit" || normalized === "userpromptsubmit") {
    return true;
  }
  return ["Edit", "Write"].includes(toolName);
}

function restoreLargeModel(settings) {
  let desired = MODEL_BY_RUNTIME.claude;
  try {
    if (fs.existsSync(MARKER_PATH)) {
      const fromMarker = fs.readFileSync(MARKER_PATH, "utf8").trim();
      if (fromMarker) {
        desired = fromMarker;
      }
      fs.unlinkSync(MARKER_PATH);
    }
  } catch {}

  if (settings.model === SMALL_EDIT_MODEL && desired !== SMALL_EDIT_MODEL) {
    settings.model = desired;
    writeSettings(settings);
    return { action: "restored-large", switchedTo: desired };
  }
  return { action: "kept-large", switchedTo: settings.model || desired };
}

function switchToSmallModel(settings) {
  const current = settings.model || process.env.CLAUDE_MODEL || MODEL_BY_RUNTIME.claude;
  if (current && current !== SMALL_EDIT_MODEL) {
    try {
      fs.mkdirSync(path.dirname(MARKER_PATH), { recursive: true });
      fs.writeFileSync(MARKER_PATH, current);
    } catch {}
    settings.model = SMALL_EDIT_MODEL;
    writeSettings(settings);
    return { action: "switched-to-small", switchedTo: SMALL_EDIT_MODEL, previousModel: current };
  }
  return { action: "kept-small", switchedTo: SMALL_EDIT_MODEL, previousModel: current };
}

module.exports = async ({ toolName, context, hookEventName } = {}) => {
  const runtime = detectRuntime(context);
  const trigger = hookEventName || toolName || "unknown";

  try {
    runBootstrap({ context, runtime });
  } catch (error) {
    console.warn(`Nexus bootstrap skipped: ${error.message}`);
  }

  const enabled = isModelRouterEnabled({ context });
  const configuredModel = readCurrentModel(runtime);
  console.error(`[model-router] runtime=${runtime} trigger=${trigger} enabled=${enabled} model=${configuredModel}`);

  const prompt = getPromptMetrics(context);
  let routingAction = "observed";
  let switchedTo = configuredModel;

  if (!enabled) {
    writeRuntimeState(context, {
      runtime,
      trigger,
      enabled,
      currentModel: configuredModel,
      prompt,
      thresholds: {
        smallPromptMaxWords: SMALL_PROMPT_MAX_WORDS,
        smallPromptMaxTokens: SMALL_PROMPT_MAX_TOKENS,
      },
      action: "disabled",
    });
    return { continue: true };
  }

  if (runtime === "claude" && shouldHandlePromptRouting(toolName, trigger)) {
    const shouldUseSmall = prompt.tokens <= SMALL_PROMPT_MAX_TOKENS && prompt.words <= SMALL_PROMPT_MAX_WORDS;
    const settings = readSettings();
    const result = shouldUseSmall ? switchToSmallModel(settings) : restoreLargeModel(settings);
    routingAction = result.action;
    switchedTo = result.switchedTo;
    if (routingAction === "switched-to-small") {
      console.error(
        `[model-router] switched model ${result.previousModel} -> ${SMALL_EDIT_MODEL} (prompt words=${prompt.words} tokens~=${prompt.tokens})`
      );
    } else if (routingAction === "restored-large") {
      console.error(
        `[model-router] restored model to ${result.switchedTo} (prompt words=${prompt.words} tokens~=${prompt.tokens})`
      );
    } else {
      console.error(
        `[model-router] kept model ${result.switchedTo} (prompt words=${prompt.words} tokens~=${prompt.tokens})`
      );
    }
  } else if (runtime === "codex" && shouldHandlePromptRouting(toolName, trigger)) {
    routingAction = "codex-observe-only";
    switchedTo = readCurrentModel("codex");
    console.error("[model-router] codex runtime detected; model is observed and recorded, no dynamic switch is applied by this hook.");
  }

  if (toolName === "WebFetch" || toolName === "WebSearch") {
    console.warn("[model-router] Token warning: web tools can be expensive; prefer local files/docs where possible.");
  }

  if (toolName === "Bash" && context?.session?.getContextSize) {
    const size = await context.session.getContextSize();
    if (size > 150000) {
      return {
        block: true,
        message: "Context exceeds 150k tokens. Run /compact then retry.",
      };
    }
  }

  writeRuntimeState(context, {
    runtime,
    trigger,
    enabled,
    currentModel: readCurrentModel(runtime),
    prompt,
    thresholds: {
      smallPromptMaxWords: SMALL_PROMPT_MAX_WORDS,
      smallPromptMaxTokens: SMALL_PROMPT_MAX_TOKENS,
    },
    action: routingAction,
    switchedTo,
  });

  return { continue: true };
};
