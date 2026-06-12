"use client";

import { useEffect, useState } from "react";

const commands = [
  "@prd-writer-critic draft a PRD for the new billing feature",
  "@code-reviewer review this PR for correctness bugs",
  "@cloud-cost-optimizer why is my AWS bill high this month?",
  "/nexus:review-branch",
  "@system-architecture-reviewer is this safe to deploy?",
  "/nexus:debugging fix this CI timeout",
  "@ai-product-engineer design a RAG pipeline for our docs",
  "@roadmap-planner plan the auth service migration",
  "/nexus:add-todo follow up on the API migration"
];

export function CommandTerminal() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let active = true;
    const phrase = commands[index];
    let i = 0;

    const interval = setInterval(() => {
      if (!active) return;
      i += 1;
      setTyped(phrase.slice(0, i));
      if (i >= phrase.length) {
        clearInterval(interval);
        setTimeout(() => {
          setTyped("");
          setIndex((prev) => (prev + 1) % commands.length);
        }, 1400);
      }
    }, 38);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [index]);

  return (
    <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/90 p-5 shadow-neon">
      <div className="mb-4 flex items-center gap-2">
        <span className="size-2 rounded-full bg-red-400" />
        <span className="size-2 rounded-full bg-yellow-400" />
        <span className="size-2 rounded-full bg-green-400" />
        <p className="ml-2 text-xs text-zinc-400">nexus://command-terminal</p>
      </div>
      <p className="h-6 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-cyan-300">
        $ {typed}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
}
