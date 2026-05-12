"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object") return "";

  const maybeNode = node as { props?: { children?: unknown } };
  if (maybeNode.props?.children) {
    if (Array.isArray(maybeNode.props.children)) {
      return maybeNode.props.children.map(extractText).join("");
    }
    return extractText(maybeNode.props.children);
  }

  return "";
}

export function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const raw = useMemo(() => extractText(children), [children]);

  async function onCopy() {
    await navigator.clipboard.writeText(raw.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onCopy}
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/90 px-2 py-1 text-xs text-zinc-300 opacity-0 transition group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5 text-cyan-300" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
      </button>
      <pre>{children}</pre>
    </div>
  );
}
