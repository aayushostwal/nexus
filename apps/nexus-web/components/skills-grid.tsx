"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SkillCard } from "@/components/skill-card";
import type { Skill } from "@/lib/content";

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"] as const;
const chip = "min-h-10 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground";
export function SkillsGrid({ skills }: { skills: Skill[] }) {
  const [query, setQuery] = useState("");
  const [complexity, setComplexity] = useState<(typeof LEVELS)[number]>("All");
  const [tag, setTag] = useState("All");
  const tags = useMemo(() => Array.from(new Set(skills.flatMap(s => s.tags))).sort(), [skills]);
  const filtered = skills.filter(s => (complexity === "All" || s.complexity === complexity) && (tag === "All" || s.tags.includes(tag)) && `${s.name} ${s.description} ${s.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  const active = query !== "" || complexity !== "All" || tag !== "All";
  function clear() { setQuery(""); setComplexity("All"); setTag("All"); }
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
        <label htmlFor="skill-query" className="mb-2 block text-sm font-medium">Find a workflow</label>
        <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input id="skill-query" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by task, name, or tag" className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" /></div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <fieldset><legend className="mb-2 text-xs text-muted-foreground">Experience level</legend><div className="flex flex-wrap gap-2">{LEVELS.map(level => <button key={level} type="button" aria-pressed={complexity === level} onClick={() => setComplexity(level)} className={chip}>{level === "All" ? "All levels" : level}</button>)}</div></fieldset>
          <div><label htmlFor="skill-tag" className="mb-2 block text-xs text-muted-foreground">Topic</label><select id="skill-tag" value={tag} onChange={e => setTag(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"><option value="All">All topics</option>{tags.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        </div>
      </div>
      <div className="mb-4 flex min-h-9 items-center justify-between gap-3"><p role="status" aria-live="polite" className="text-sm text-muted-foreground">{filtered.length} of {skills.length} workflows</p>{active && <button type="button" onClick={clear} className="min-h-9 text-sm font-medium text-primary hover:underline">Clear filters</button>}</div>
      {filtered.length ? <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(skill => <SkillCard key={skill.name} skill={skill} />)}</div> : <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center"><h3 className="font-medium">No matching workflows</h3><p className="mt-2 text-sm text-muted-foreground">Try a broader search or clear your filters.</p><button type="button" onClick={clear} className="mt-4 min-h-10 text-sm font-medium text-primary hover:underline">Show all workflows</button></div>}
    </div>
  );
}
