"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DocMeta } from "@/lib/docs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DocsSidebar({ docs }: { docs: DocMeta[] }) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const filtered = docs.filter((d) => `${d.title} ${d.description}`.toLowerCase().includes(query.toLowerCase()));
    return filtered.reduce<Record<string, DocMeta[]>>((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    }, {});
  }, [docs, query]);

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-72 shrink-0 rounded-xl border border-zinc-700/70 bg-zinc-950/60 p-3 lg:block">
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search docs" className="mb-3" />
      <ScrollArea className="h-[calc(100%-3rem)] pr-2">
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, entries]) => (
            <div key={category}>
              <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">{category}</p>
              <div className="flex flex-col gap-1">
                {entries.map((doc) => (
                  <Link
                    key={doc.slug.join("/")}
                    href={`/docs/${doc.slug.join("/")}`}
                    className="rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100"
                  >
                    {doc.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
