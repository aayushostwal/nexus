"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { SearchModal } from "@/components/search-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import type { DocMeta } from "@/lib/docs";
import type { Agent, Skill } from "@/lib/content";

const links = [["/#workflow", "Workflow"], ["/#skills-marketplace", "Skills"], ["/#agent-system", "Agents"], ["/docs", "Docs"]];
export function SiteHeader({ docs, skills, agents }: { docs: DocMeta[]; skills: Skill[]; agents: Agent[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md" onKeyDown={event => { if (event.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); } }}>
      <a href="#main-content" className="sr-only z-50 rounded-md bg-foreground p-3 text-background focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to content</a>
      <div className="nexus-container flex h-[76px] items-center justify-between gap-3">
        <Link href="/" aria-label="Nexus home" className="flex shrink-0 items-center gap-2.5 text-xl font-semibold tracking-tight">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-md bg-foreground font-mono text-lg text-background">n<span className="text-primary">.</span></span>Nexus<span className="hidden border-l border-border pl-3 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground xl:inline">Engineering toolkit</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">{links.map(([href, label]) => <Link key={href} href={href} className="transition hover:text-foreground">{label}</Link>)}</nav>
        <div className="flex items-center gap-2">
          <SearchModal docs={docs} skills={skills} agents={agents} />
          <ThemeToggle />
          <a href="https://github.com/aayushostwal/nexus" target="_blank" rel="noreferrer" className="hidden min-h-10 items-center gap-1.5 px-2 text-sm font-medium sm:inline-flex">GitHub <ArrowUpRight size={14} aria-hidden /></a>
          <button type="button" ref={trigger} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)} className="flex size-10 items-center justify-center rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden">{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="nexus-container grid gap-1 border-t border-border py-4 lg:hidden">
        {[...links, ["/#install", "Install Nexus"], ["https://github.com/aayushostwal/nexus", "GitHub repository"]].map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{label}</Link>)}
      </nav>}
    </header>
  );
}
