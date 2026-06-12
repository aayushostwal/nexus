"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DocMeta } from "@/lib/docs";
import type { Agent, Skill } from "@/lib/content";

export function SearchModal({ docs, skills, agents = [] }: { docs: DocMeta[]; skills: Skill[]; agents?: Agent[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const docResults = docs
      .filter((doc) => `${doc.title} ${doc.description}`.toLowerCase().includes(q))
      .map((doc) => ({
        type: "doc" as const,
        title: doc.title,
        href: `/docs/${doc.slug.join("/")}`,
        subtitle: doc.description
      }));

    const skillResults = skills
      .filter((skill) => `${skill.name} ${skill.description} ${skill.tags.join(" ")}`.toLowerCase().includes(q))
      .map((skill) => ({
        type: "skill" as const,
        title: skill.name,
        href: "#skills-marketplace",
        subtitle: skill.description
      }));

    const agentResults = agents
      .filter((agent) => `${agent.name} ${agent.description} ${agent.domain} ${agent.memory}`.toLowerCase().includes(q))
      .map((agent) => ({
        type: "agent" as const,
        title: agent.name,
        href: "#agent-system",
        subtitle: agent.description
      }));

    return [...docResults, ...agentResults, ...skillResults].slice(0, 12);
  }, [docs, skills, agents, query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-2.5 py-2 text-sm text-zinc-300 md:px-3"
      >
        <Search className="size-4" />
        <span className="hidden md:inline">Search</span>
        <span className="hidden text-xs text-zinc-500 md:inline">⌘K</span>
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
          <Dialog.Content className="fixed left-1/2 top-[8%] z-50 w-[94vw] max-w-2xl -translate-x-1/2 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 sm:top-[12%] sm:w-[92vw]">
            <div className="mb-3 flex items-center justify-between">
              <Dialog.Title className="text-sm text-zinc-300">Global Search</Dialog.Title>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 hover:bg-zinc-800">
                <X className="size-4" />
              </button>
            </div>
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs, agents, skills..."
              className="mb-3"
            />
            <div className="max-h-[340px] overflow-auto">
              {results.length === 0 ? (
                <p className="text-sm text-zinc-500">No results yet. Try searching "code-reviewer" or "debugging".</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {results.map((result) => (
                    <li key={`${result.type}-${result.title}`}>
                      <Link
                        href={result.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg border border-zinc-700/70 bg-zinc-900/70 p-3 hover:border-cyan-400/50"
                      >
                        <p className="text-sm font-medium text-zinc-100">{result.title}</p>
                        <p className="text-xs text-zinc-400">{result.subtitle}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
