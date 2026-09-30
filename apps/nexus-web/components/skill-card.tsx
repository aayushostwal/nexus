"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Workflow } from "lucide-react";
import type { Skill } from "@/lib/content";

export function SkillCard({ skill }: { skill: Skill }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const invocation = skill.example.startsWith("/nexus:") ? skill.example : `/nexus:${skill.name}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(invocation);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }
  return (
    <article tabIndex={-1} id={`skill-${skill.name}`} className="flex h-full scroll-mt-28 flex-col rounded-2xl border border-border bg-card p-6 text-foreground transition-colors hover:border-primary/50 target:border-primary">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted"><Workflow aria-hidden="true" className="size-5 text-primary" /></span>
        <span className="text-xs font-medium text-muted-foreground">{skill.complexity}</span>
      </div>
      <h3 className="break-words text-lg font-semibold tracking-tight">{skill.name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{skill.description}</p>
      <div className="mb-6 mt-4 flex flex-wrap gap-1.5">{skill.tags.map(tag => <span key={tag} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{tag}</span>)}</div>
      <div className="mt-auto">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Try in Claude Code</p>
        <div className="rounded-xl border border-border bg-background p-3">
          <code className="block break-words text-xs leading-relaxed">{invocation}</code>
          <button type="button" onClick={copy} aria-label={`Copy ${skill.name} invocation`} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md text-xs font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            {copyState === "copied" ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
            {copyState === "copied" ? "Copied" : "Copy prompt"}
          </button>
          <p role="status" className="text-xs text-muted-foreground">{copyState === "failed" ? "Could not copy. Select and copy the prompt above." : copyState === "copied" ? "Prompt copied to clipboard." : ""}</p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Included in Nexus</span>
          <a href={skill.github} target="_blank" rel="noopener noreferrer" aria-label={`View ${skill.name} source on GitHub (opens a new tab)`} className="inline-flex min-h-9 items-center gap-1 font-medium hover:text-primary">View source <ArrowUpRight aria-hidden="true" className="size-3.5" /></a>
        </div>
      </div>
    </article>
  );
}
