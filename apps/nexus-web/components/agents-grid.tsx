"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AgentCard } from "@/components/agent-card";
import type { Agent, AgentDomain } from "@/lib/content";

const DOMAINS: AgentDomain[] = [
  "Product",
  "Design",
  "Architecture",
  "Data & Events",
  "Cloud",
  "Code & Docs",
  "AI"
];

const domainChipColor: Record<AgentDomain, string> = {
  Product: "border-purple-400/50 text-purple-300 data-[active=true]:bg-purple-500/20 data-[active=true]:border-purple-400/80",
  Design: "border-pink-400/50 text-pink-300 data-[active=true]:bg-pink-500/20 data-[active=true]:border-pink-400/80",
  Architecture: "border-blue-400/50 text-blue-300 data-[active=true]:bg-blue-500/20 data-[active=true]:border-blue-400/80",
  "Data & Events": "border-orange-400/50 text-orange-300 data-[active=true]:bg-orange-500/20 data-[active=true]:border-orange-400/80",
  Cloud: "border-yellow-400/50 text-yellow-300 data-[active=true]:bg-yellow-500/20 data-[active=true]:border-yellow-400/80",
  "Code & Docs": "border-green-400/50 text-green-300 data-[active=true]:bg-green-500/20 data-[active=true]:border-green-400/80",
  AI: "border-cyan-400/50 text-cyan-300 data-[active=true]:bg-cyan-500/20 data-[active=true]:border-cyan-400/80"
};

export function AgentsGrid({ agents }: { agents: Agent[] }) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<AgentDomain | "All">("All");
  const [memory, setMemory] = useState<"All" | "user" | "project">("All");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return agents.filter((a) => {
      if (domain !== "All" && a.domain !== domain) return false;
      if (memory !== "All" && a.memory !== memory) return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q) && !a.domain.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, query, domain, memory]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search agents by name, domain, or capability…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/70 py-2.5 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none ring-0 transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-active={domain === "All"}
          onClick={() => setDomain("All")}
          className="rounded-full border border-zinc-600/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-400/60 data-[active=true]:border-zinc-300 data-[active=true]:bg-zinc-700/60 data-[active=true]:text-zinc-100"
        >
          All domains
        </button>
        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            data-active={domain === d}
            onClick={() => setDomain(d === domain ? "All" : d)}
            className={`rounded-full border px-3 py-1 text-xs transition opacity-70 hover:opacity-100 data-[active=true]:opacity-100 ${domainChipColor[d]}`}
          >
            {d}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-zinc-700" />

        {(["All", "user", "project"] as const).map((m) => (
          <button
            key={m}
            type="button"
            data-active={memory === m}
            onClick={() => setMemory(m)}
            className="rounded-full border border-zinc-600/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-400/60 data-[active=true]:border-cyan-400/60 data-[active=true]:bg-zinc-800 data-[active=true]:text-cyan-300"
          >
            {m === "All" ? "Any memory" : `memory: ${m}`}
          </button>
        ))}

        <span className="ml-auto text-xs text-zinc-500">
          {filtered.length} / {agents.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">No agents match — try a different search or filter.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} step={i} />
          ))}
        </div>
      )}
    </div>
  );
}
