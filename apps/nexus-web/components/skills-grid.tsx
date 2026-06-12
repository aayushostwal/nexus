"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SkillCard } from "@/components/skill-card";
import type { Skill } from "@/lib/content";

type Complexity = "Beginner" | "Intermediate" | "Advanced";
const COMPLEXITIES: Complexity[] = ["Beginner", "Intermediate", "Advanced"];

const complexityChip: Record<Complexity, string> = {
  Beginner: "border-green-400/50 text-green-300 data-[active=true]:bg-green-500/20 data-[active=true]:border-green-400/80",
  Intermediate: "border-yellow-400/50 text-yellow-300 data-[active=true]:bg-yellow-500/20 data-[active=true]:border-yellow-400/80",
  Advanced: "border-red-400/50 text-red-300 data-[active=true]:bg-red-500/20 data-[active=true]:border-red-400/80"
};

export function SkillsGrid({ skills }: { skills: Skill[] }) {
  const [query, setQuery] = useState("");
  const [complexity, setComplexity] = useState<Complexity | "All">("All");
  const [tag, setTag] = useState<string | "All">("All");

  const allTags = useMemo(
    () => Array.from(new Set(skills.flatMap((s) => s.tags))).sort(),
    [skills]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return skills.filter((s) => {
      if (complexity !== "All" && s.complexity !== complexity) return false;
      if (tag !== "All" && !s.tags.includes(tag)) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q) && !s.tags.some((t) => t.includes(q))) return false;
      return true;
    });
  }, [skills, query, complexity, tag]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search skills by name, tag, or description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/70 py-2.5 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none ring-0 transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-active={complexity === "All"}
          onClick={() => setComplexity("All")}
          className="rounded-full border border-zinc-600/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-400/60 data-[active=true]:border-zinc-300 data-[active=true]:bg-zinc-700/60 data-[active=true]:text-zinc-100"
        >
          All levels
        </button>
        {COMPLEXITIES.map((c) => (
          <button
            key={c}
            type="button"
            data-active={complexity === c}
            onClick={() => setComplexity(c === complexity ? "All" : c)}
            className={`rounded-full border px-3 py-1 text-xs transition opacity-70 hover:opacity-100 data-[active=true]:opacity-100 ${complexityChip[c]}`}
          >
            {c}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-zinc-700" />

        <button
          type="button"
          data-active={tag === "All"}
          onClick={() => setTag("All")}
          className="rounded-full border border-zinc-600/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-400/60 data-[active=true]:border-zinc-300 data-[active=true]:bg-zinc-700/60 data-[active=true]:text-zinc-100"
        >
          All tags
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            type="button"
            data-active={tag === t}
            onClick={() => setTag(t === tag ? "All" : t)}
            className="rounded-full border border-zinc-600/60 px-3 py-1 text-xs text-zinc-300 opacity-70 transition hover:border-zinc-400/60 hover:opacity-100 data-[active=true]:border-zinc-300 data-[active=true]:bg-zinc-700/60 data-[active=true]:text-zinc-100 data-[active=true]:opacity-100"
          >
            {t}
          </button>
        ))}

        <span className="ml-auto text-xs text-zinc-500">
          {filtered.length} / {skills.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">No skills match — try a different search or filter.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((skill) => (
            <SkillCard key={skill.name} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
