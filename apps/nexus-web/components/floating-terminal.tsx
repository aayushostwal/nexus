"use client";

import { useState } from "react";
import { MessageSquareText, X } from "lucide-react";

export function FloatingTerminal() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open ? (
        <div className="w-[320px] rounded-2xl border border-zinc-700 bg-zinc-950/95 p-3 shadow-neon backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-zinc-400">Nexus Assistant</p>
            <button onClick={() => setOpen(false)} aria-label="Close assistant">
              <X className="size-4 text-zinc-400" />
            </button>
          </div>
          <p className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-2 font-mono text-xs text-cyan-300">
            /nexus:reliability run release readiness gate
          </p>
          <p className="mt-2 text-xs text-zinc-300">
            Tip: Press <span className="font-mono">⌘K</span> for command palette.
          </p>
        </div>
      ) : (
        <button
          className="inline-flex size-12 items-center justify-center rounded-full border border-cyan-400/50 bg-zinc-950/90 text-cyan-300 shadow-glow"
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
        >
          <MessageSquareText className="size-5" />
        </button>
      )}
    </div>
  );
}
