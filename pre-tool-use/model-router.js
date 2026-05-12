"use strict";

const fs = require("fs");
const path = require("path");

const SETTINGS_PATH = path.join(process.env.HOME || "", ".claude", "settings.json");

const SMALL_EDIT_MODEL = "claude-haiku-4-5-20251001";
const MARKER_PATH = path.join(process.env.HOME || "", ".nexus", ".model-router-original");

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

function getPromptWordCount(context) {
  const content = context?.messageHistory?.slice(-1)[0]?.content || "";
  return (typeof content === "string" ? content : JSON.stringify(content))
    .split(/\s+/)
    .filter(Boolean).length;
}

module.exports = async ({ toolName, context }) => {
  // Downgrade to haiku for small edits and restore afterward
  if (["Edit", "Write"].includes(toolName)) {
    const wordCount = getPromptWordCount(context);
    if (wordCount <= 50) {
      const settings = readSettings();
      const current = settings.model;
      if (current && current !== SMALL_EDIT_MODEL) {
        // Save original model so post-edit we can restore (best-effort)
        try {
          fs.mkdirSync(path.dirname(MARKER_PATH), { recursive: true });
          fs.writeFileSync(MARKER_PATH, current);
        } catch {}
        settings.model = SMALL_EDIT_MODEL;
        writeSettings(settings);
        console.log(`[model-router] Switched to ${SMALL_EDIT_MODEL} for small edit (was: ${current})`);
      }
    } else {
      // Restore original model if we previously downgraded
      try {
        if (fs.existsSync(MARKER_PATH)) {
          const original = fs.readFileSync(MARKER_PATH, "utf8").trim();
          const settings = readSettings();
          if (settings.model === SMALL_EDIT_MODEL) {
            settings.model = original;
            writeSettings(settings);
            fs.unlinkSync(MARKER_PATH);
            console.log(`[model-router] Restored model to ${original}`);
          }
        }
      } catch {}
    }
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

  return { continue: true };
};
