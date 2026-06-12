"use client";

import { useState } from "react";
import { SkillCard } from "@/components/skill-card";
import type { Skill } from "@/lib/content";

type Complexity = "Beginner" | "Intermediate" | "Advanced";
const COMPLEXITIES: Complexity[] = ["Beginner", "Intermediate", "Advanced"];

const complexityChip: Record<Complexity, string> = {
  Beginner: "border-green-400/50 text-green-300 data-[active=true]:bg-green-500/20",
  Intermediate: "border-yellow-400/50 text-yellow-300 data-[active=true]:bg-yellow-500/20",
  Advanced: "border-red-400/50 text-red-300 data-[active=true]:bg-red-500/20"
};

export function SkillsGrid({ skills }: { skills: Skill[] }) {
  const [complexity, setComplexity] = useState<Complexity | "All">("All");

  const allTags = Array.from(new Set(skills.flatMap((s) => s.tags))).sort();
  const [tag, setTag] = useState<string | "All">("All");

  const filtered = skills.filter((s) => {
    if (complexity !== "All" && s.complexity !== complexity) return false;
    if (tag !== "All" && !s.tags.includes(tag)) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* Complexity */}
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

        {/* Divider */}
        <span className="mx-1 h-4 w-px bg-zinc-700" />

        {/* Tag chips */}
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

        {/* Count */}
        <span className="ml-auto text-xs text-zinc-500">
          {filtered.length} / {skills.length}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">No skills match the current filters.</p>
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
