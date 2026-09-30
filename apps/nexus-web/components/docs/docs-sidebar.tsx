"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronDown, Search } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import type { DocMeta } from "@/lib/docs";

export function DocsSidebar({ docs }: { docs: DocMeta[] }) {
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const searchId = useId();
  const mobile = useRef<HTMLDetailsElement>(null);
  const grouped = useMemo(() => {
    const filtered = docs.filter((doc) => `${doc.title} ${doc.description}`.toLowerCase().includes(query.toLowerCase().trim()));
    return filtered.reduce<Record<string, DocMeta[]>>((acc, doc) => {
      (acc[doc.category] ??= []).push(doc);
      return acc;
    }, {});
  }, [docs, query]);

  const navigation = (suffix: string) => (
    <>
      <label htmlFor={`${searchId}-${suffix}`} className="sr-only">Search documentation</label>
      <div className="relative mb-6">
        <Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
        <input id={`${searchId}-${suffix}`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a guide…" className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground" />
      </div>
      <nav aria-label="Documentation" className="space-y-6">
        {Object.entries(grouped).map(([category, entries]) => (
          <div key={category}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{category}</p>
            <div className="flex flex-col gap-1">
              {entries.map((doc) => {
                const href = `/docs/${doc.slug.join("/")}`;
                const active = href === pathname;
                return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => { if (mobile.current) mobile.current.open = false; }} className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{doc.title}</Link>;
              })}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && <div role="status" className="px-3 text-sm text-muted-foreground">No guides match. <button type="button" onClick={() => setQuery("")} className="text-primary underline">Clear search</button></div>}
      </nav>
    </>
  );

  return (
    <>
      <details ref={mobile} className="rounded-xl border border-border bg-card p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><BookOpen aria-hidden="true" className="size-4 text-primary" /> Browse documentation</span><ChevronDown aria-hidden="true" className="size-4" /></summary>
        <div className="mt-5 max-h-[60vh] overflow-y-auto">{navigation("mobile")}</div>
      </details>
      <aside className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] w-64 shrink-0 overflow-y-auto py-1 pr-4 lg:block">{navigation("desktop")}</aside>
    </>
  );
}
