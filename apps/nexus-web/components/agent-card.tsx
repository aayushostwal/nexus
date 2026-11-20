"use client";

import { ArrowUpRight, Bot, Database, Globe } from "lucide-react";
import type { Agent } from "@/lib/content";

export function AgentCard({ agent }: { agent: Agent; step?: number }) {
  return (
    <article tabIndex={-1} id={`agent-${agent.name}`} className="flex h-full scroll-mt-28 flex-col rounded-2xl border border-border bg-card p-6 text-foreground transition-colors hover:border-primary/50 target:border-primary">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted"><Bot aria-hidden="true" className="size-5 text-primary" /></span>
        <span className="text-xs font-medium text-muted-foreground">{agent.domain}</span>
      </div>
      <h3 className="break-words text-lg font-semibold tracking-tight">{agent.name}</h3>
      <p className="mb-6 mt-3 text-sm leading-relaxed text-muted-foreground">{agent.description}</p>
      <div className="mt-auto">
        <div className="flex items-start gap-2 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
          {agent.memory === "user" ? <Globe aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <Database aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
          <p><span className="font-medium text-foreground">{agent.memory === "user" ? "Personal memory" : "Repository memory"}</span><br />{agent.memory === "user" ? "Configured to retain context across your projects in Claude Code." : "Configured to retain context within this project in Claude Code."}</p>
        </div>
        <p className="mt-3 break-words text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">Tools: </span>{agent.tools}</p>
        <a href={agent.github} target="_blank" rel="noopener noreferrer" aria-label={`View ${agent.name} source on GitHub (opens a new tab)`} className="mt-4 inline-flex min-h-9 items-center gap-1 text-xs font-medium hover:text-primary">View source <ArrowUpRight aria-hidden="true" className="size-3.5" /></a>
      </div>
    </article>
  );
}
