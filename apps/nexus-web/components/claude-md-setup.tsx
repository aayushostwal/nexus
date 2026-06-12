"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

const snippet = `### AGENTS:
* Always use **nexus agents** if applicable.`;

export function ClaudeMdSetup() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/90 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-yellow-400" />
          <span className="size-2 rounded-full bg-green-400" />
          <p className="ml-2 text-xs text-zinc-400">~/.claude/CLAUDE.md</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed">
        <span className="text-zinc-500">### AGENTS:</span>{"\n"}
        <span className="text-zinc-300">* Always use </span>
        <span className="text-cyan-300 font-semibold">**nexus agents**</span>
        <span className="text-zinc-300"> if applicable.</span>
      </pre>
      <p className="mt-4 text-xs text-zinc-500">
        Add to <span className="font-mono text-zinc-400">~/.claude/CLAUDE.md</span> to make Claude always delegate to Nexus agents by default across every session.
      </p>
    </div>
  );
}
