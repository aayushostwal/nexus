"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AgentCard } from "@/components/agent-card";
import type { Agent, AgentDomain } from "@/lib/content";

export function AgentsGrid({ agents }: { agents: Agent[] }) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<AgentDomain | "All">("All");
  const [memory, setMemory] = useState("All");
  const domains = Array.from(new Set(agents.map(a => a.domain)));
  const filtered = agents.filter(a => (domain === "All" || a.domain === domain) && (memory === "All" || a.memory === memory) && `${a.name} ${a.description} ${a.domain}`.toLowerCase().includes(query.trim().toLowerCase()));
  const active = query !== "" || domain !== "All" || memory !== "All";
  function clear() { setQuery(""); setDomain("All"); setMemory("All"); }
  useEffect(() => {
    const reveal = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      clear();
      requestAnimationFrame(() => { const target = document.getElementById(id); target?.scrollIntoView({ block: "start" }); target?.focus({ preventScroll: true }); });
    };
    window.addEventListener("nexus:reveal-catalog", reveal);
    return () => window.removeEventListener("nexus:reveal-catalog", reveal);
  }, []);
  return (
    <div>
      <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <label htmlFor="agent-query" className="mb-2 block text-sm font-medium">Find a specialist</label>
        <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input id="agent-query" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or capability" className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" /></div>
        <fieldset className="mt-4"><legend className="mb-2 text-xs text-muted-foreground">Specialty</legend><div className="flex flex-wrap gap-2">{(["All", ...domains] as const).map(d => <button type="button" key={d} aria-pressed={domain === d} onClick={() => setDomain(d)} className="min-h-10 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground">{d === "All" ? "All specialties" : d}</button>)}</div></fieldset>
        <div className="mt-4 flex flex-wrap items-center gap-3"><label htmlFor="agent-memory" className="text-xs text-muted-foreground">Memory in Claude Code</label><select id="agent-memory" value={memory} onChange={e => setMemory(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"><option value="All">Any scope</option><option value="user">Personal · across projects</option><option value="project">Repository · this project</option></select></div>
      </div>
      <div className="mb-4 flex min-h-9 items-center justify-between gap-3"><p role="status" aria-live="polite" className="text-sm text-muted-foreground">{filtered.length} of {agents.length} specialists</p>{active && <button type="button" onClick={clear} className="min-h-9 text-sm font-medium text-primary hover:underline">Clear filters</button>}</div>
      {filtered.length ? <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(agent => <AgentCard key={agent.name} agent={agent} />)}</div> : <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center"><h3 className="font-medium">No matching specialists</h3><p className="mt-2 text-sm text-muted-foreground">Try a broader search or clear your filters.</p><button type="button" onClick={clear} className="mt-4 min-h-10 text-sm font-medium text-primary hover:underline">Show all specialists</button></div>}
    </div>
  );
}
