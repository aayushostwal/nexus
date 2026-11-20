"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workflowExamples } from "@/lib/content";

const states = ["idle", "running", "verifying", "complete"] as const;
type State = (typeof states)[number];

export function WorkflowPlayground() {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [state, setState] = useState<State>("idle");

  const current = workflowExamples[exampleIndex];

  const status = useMemo(() => {
    if (state === "idle") return { icon: ShieldCheck, text: "Ready", color: "text-zinc-300" };
    if (state === "running") return { icon: LoaderCircle, text: "Executing", color: "text-cyan-300" };
    if (state === "verifying") return { icon: AlertTriangle, text: "Verification Gate", color: "text-violet-300" };
    return { icon: CheckCircle2, text: "Delivered", color: "text-emerald-300" };
  }, [state]);

  function run() {
    setState("running");
    setTimeout(() => setState("verifying"), 1200);
    setTimeout(() => setState("complete"), 2400);
  }

  const Icon = status.icon;

  return (
    <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/70 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-100">Workflow Playground</h3>
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${status.color} ${state === "running" ? "animate-spin" : ""}`} />
          <span className={`text-sm ${status.color}`}>{status.text}</span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {workflowExamples.map((example, idx) => (
          <button
            key={example.name}
            onClick={() => {
              setExampleIndex(idx);
              setState("idle");
            }}
            className={`rounded-md border px-3 py-1.5 text-xs transition ${
              idx === exampleIndex
                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {example.name}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-700/80 bg-zinc-900/70 p-4">
        {current.steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="inline-flex size-6 items-center justify-center rounded-full border border-zinc-600 font-mono text-xs">
              {idx + 1}
            </span>
            {step}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={run} size="sm">
          Execute Flow
        </Button>
        <Button onClick={() => setState("idle")} variant="outline" size="sm">
          Reset
        </Button>
      </div>
    </div>
  );
}
