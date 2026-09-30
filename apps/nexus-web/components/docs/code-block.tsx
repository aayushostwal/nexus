"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

function extractText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (!node || typeof node !== "object") return "";
  return extractText((node as { props?: { children?: unknown } }).props?.children);
}

export function CodeBlock({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const raw = useMemo(() => extractText(children), [children]);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function onCopy() {
    clearTimeout(timer.current);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(raw.trim());
      setStatus("copied");
    } catch { setStatus("failed"); }
    timer.current = setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="my-5 min-w-0 overflow-hidden rounded-xl border border-border bg-[#151c2b]">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-white/10 px-4 text-xs text-[#b4bbc8]">
        <span className="font-mono">Code</span>
        <button type="button" onClick={onCopy} aria-label="Copy code" className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-[#e5e7eb] hover:bg-white/10">{status === "copied" ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}<span aria-live="polite">{status === "copied" ? "Copied" : status === "failed" ? "Select code to copy" : "Copy"}</span></button>
      </div>
      <pre tabIndex={0} aria-label="Code example, scroll horizontally for long lines" className="!my-0 !rounded-none !border-0">{children}</pre>
    </div>
  );
}
