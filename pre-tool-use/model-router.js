"use strict";

const MODEL_BY_RUNTIME = {
  claude: "claude-3-5-haiku-latest",
  codex: "gpt-5.4-mini",
};

function detectRuntime(context) {
  const text = `${context?.session?.id || ""} ${process.env.CLAUDE_SESSION_ID || ""} ${process.env.CODEX_SESSION_ID || ""}`.toLowerCase();
  if (text.includes("claude")) return "claude";
  if (text.includes("codex")) return "codex";
  return process.env.NEXUS_AI_RUNTIME || "claude";
}

module.exports = async ({ toolName, context }) => {
  const prompt = context?.messageHistory?.slice(-1)[0]?.content || "";
  const runtime = detectRuntime(context);

  if (["Edit", "Write"].includes(toolName) && prompt.split(/\s+/).filter(Boolean).length <= 50) {
    const model = MODEL_BY_RUNTIME[runtime];
    if (model && context?.session?.setModel) {
      await context.session.setModel(model);
      console.log(`Model switch: ${runtime} -> ${model} (small edit)`);
    }
  }

  if (toolName === "WebFetch" || toolName === "WebSearch") {
    console.warn("Token warning: web tools can be expensive; prefer local files/docs where possible.");
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
