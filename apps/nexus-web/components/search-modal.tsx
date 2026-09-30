"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { DocMeta } from "@/lib/docs";
import type { Agent, Skill } from "@/lib/content";

export function SearchModal({ docs, skills, agents = [] }: { docs: DocMeta[]; skills: Skill[]; agents?: Agent[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const previousFocus = useRef<HTMLElement | null>(null);
  const navigating = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  function changeOpen(next: boolean) {
    if (next) navigating.current = false;
    if (next) previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(next);
    if (!next) setQuery("");
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigating.current = false;
        previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const trimmed = query.trim();
  const results = useMemo(() => {
    const all = [
      ...docs.map(doc => ({type: "Documentation", title: doc.title, href: `/docs/${doc.slug.join("/")}`, subtitle: doc.description, keywords: ""})),
      ...skills.map(skill => ({type: "Workflow", title: skill.name, href: `/#skill-${skill.name}`, subtitle: skill.description, keywords: skill.tags.join(" ")})),
      ...agents.map(agent => ({type: "Specialist", title: agent.name, href: `/#agent-${agent.name}`, subtitle: agent.description, keywords: `${agent.domain} ${agent.memory}`}))
    ];
    if (!trimmed) return all.slice(0, 5);
    const q = trimmed.toLowerCase();
    return all.filter(item => `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase().includes(q)).slice(0, 12);
  }, [docs, skills, agents, trimmed]);
  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger asChild><button ref={trigger} type="button" aria-label="Search documentation, workflows, and specialists" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><Search aria-hidden="true" className="size-4" /><span className="hidden md:inline">Search</span><kbd aria-hidden="true" className="ml-3 hidden rounded border border-border px-1.5 py-0.5 text-[10px] md:inline">⌘ / Ctrl K</kbd></button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content onOpenAutoFocus={event => { event.preventDefault(); searchInput.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); if (navigating.current) return; const target = previousFocus.current; (target?.isConnected && target !== document.body ? target : trigger.current)?.focus(); }} className="fixed left-1/2 top-[8%] z-[60] flex max-h-[84dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl sm:p-6">
          <div className="flex items-center justify-between gap-4"><Dialog.Title className="text-lg font-semibold tracking-tight">Search Nexus</Dialog.Title><Dialog.Close asChild><button type="button" aria-label="Close search" className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X aria-hidden="true" className="size-4" /></button></Dialog.Close></div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">Find a workflow, a specialist, or an answer in the docs.</Dialog.Description>
          <label htmlFor="global-search" className="sr-only">Search query</label>
          <input ref={searchInput} id="global-search" autoFocus type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try software-engineer or installation" className="mb-4 mt-5 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
          <p role="status" aria-live="polite" className="mb-3 text-xs font-medium text-muted-foreground">{trimmed ? `${results.length} results shown` : "Start exploring"}</p>
          <div className="min-h-0 overflow-y-auto">
            {results.length ? <ul className="space-y-2">{results.map(result => <li key={`${result.type}-${result.title}`}><a href={result.href} onClick={() => { navigating.current = true; changeOpen(false); if (result.href.startsWith("/#")) window.dispatchEvent(new CustomEvent("nexus:reveal-catalog", { detail: result.href.slice(2) })); }} className="group block rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{result.type}</span><span className="flex items-center justify-between gap-3 text-sm font-medium"><span>{result.title}</span><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /></span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{result.subtitle}</span></a></li>)}</ul> : <div className="py-10 text-center"><p className="font-medium">No matches for “{trimmed}”</p><p className="mt-2 text-sm text-muted-foreground">Try a task such as debugging, review, or setup.</p><button type="button" onClick={() => setQuery("")} className="mt-4 min-h-10 text-sm font-medium text-primary hover:underline">Clear search</button></div>}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">Tab to move between results. Enter to open. Esc to close.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
