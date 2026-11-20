"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Loader2 } from "lucide-react";
import Link from "next/link";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  async function copy() {
    clearTimeout(timer.current);
    setState("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (!mounted.current) return;
      setState("copied");
      timer.current = setTimeout(() => setState("idle"), 2500);
    } catch { if (mounted.current) setState("error"); }
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={copy} disabled={state === "copying"} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">
        {state === "copied" ? <Check size={14} aria-hidden /> : state === "copying" ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Copy size={14} aria-hidden />}
        {state === "copied" ? "Copied" : state === "copying" ? "Copying…" : label}
      </button>
      <span role="status" aria-live="polite" className={state === "error" ? "max-w-64 text-xs text-muted-foreground" : "sr-only"}>
        {state === "error" ? "Copy unavailable. Select the text and copy it manually." : state === "copied" ? "Copied to clipboard." : ""}
      </span>
    </div>
  );
}

const hosts = [
  { id: "claude", name: "Claude Code", context: "Inside a Claude Code session", commands: ["/plugin marketplace add aayushostwal/nexus", "/plugin install nexus@nexus-marketplace", "/reload-plugins"], note: "Reload the plugin, then invoke /nexus:software-engineer in your repository." },
  { id: "codex", name: "Codex", context: "In your terminal · native plugin support required", commands: ["codex plugin marketplace add aayushostwal/nexus", "codex plugin add nexus@nexus-marketplace", "codex plugin list --marketplace nexus-marketplace --json"], note: "Open your repository in Codex and ask it to use the software-engineer skill." }
];

export function InstallPanel() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const host = hosts[selected];
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div role="tablist" aria-label="Installation host" className="flex gap-1 border-b border-border px-3 pt-3 sm:px-5">
        {hosts.map((item, index) => <button key={item.id} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={`install-tab-${item.id}`} aria-selected={selected === index} aria-controls="install-panel" tabIndex={selected === index ? 0 : -1}
          onClick={() => setSelected(index)}
          onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? hosts.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + hosts.length) % hosts.length;
            setSelected(next); tabs.current[next]?.focus();
          }}
          className={`relative min-h-12 px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${selected === index ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {item.name}
        </button>)}
      </div>
      <div role="tabpanel" id="install-panel" aria-labelledby={`install-tab-${host.id}`} tabIndex={0} className="p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-7">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{host.context}</p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 text-xs leading-8 text-foreground sm:text-sm"><code>{host.commands.join("\n")}</code></pre>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <CopyButton key={host.id} text={host.commands.join("\n")} label="Copy install commands" />
          <Link href="/docs/getting-started/installation" className="inline-flex min-h-10 items-center gap-1 text-sm underline-offset-4 hover:underline">Installation guide <ArrowUpRight size={14} aria-hidden /></Link>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{host.note}</p>
      </div>
    </div>
  );
}
