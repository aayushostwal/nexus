"use client";

import { FileCode2, GitPullRequest, Search, ShieldCheck, CircleDot } from "lucide-react";
import { CopyButton } from "@/components/install-panel";

const prompt = "Use software-engineer in the current repository. Fix issue #123, run the relevant checks, and raise a PR.";
const steps = [
  { icon: CircleDot, name: "Understand the issue", detail: "Read the report. Find existing work. Define a reproducible failure.", artifact: "Issue + acceptance criteria" },
  { icon: Search, name: "Trace the cause", detail: "Follow the code and the evidence before choosing a fix.", artifact: "Reproduction + diagnosis" },
  { icon: FileCode2, name: "Make a focused change", detail: "Protect unrelated edits and follow the repository’s conventions.", artifact: "Patch + regression coverage" },
  { icon: ShieldCheck, name: "Verify the result", detail: "Run relevant checks and identify anything that could not be verified.", artifact: "Checks + limitations" },
  { icon: GitPullRequest, name: "Open a reviewable PR", detail: "Explain the change, include evidence, and report the actual CI status.", artifact: "Pull request · never auto-merged" }
];

export function WorkflowPreview() {
  return (
    <div className="grid overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col justify-between border-b border-border p-6 sm:p-9 lg:border-b-0 lg:border-r">
        <div>
          <div className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" /> Workflow / 001</div>
          <h3 className="text-2xl font-semibold tracking-tight">software-engineer</h3>
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">A local repository. A GitHub issue or a bug in chat. One workflow from investigation to a pull request.</p>
          <div className="my-7 rounded-lg border border-border bg-background p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Example prompt · replace #123</p>
            <p className="select-text font-mono text-sm leading-7 text-foreground">{prompt}</p>
          </div>
          <CopyButton text={prompt} label="Copy workflow prompt" />
        </div>
        <p className="mt-8 max-w-sm text-xs leading-6 text-muted-foreground">Requires a local checkout and authenticated GitHub access for issue retrieval and PR creation. No issue supplied? The workflow inspects open issues and selects a bounded candidate.</p>
      </div>
      <div className="p-6 sm:p-9">
        <p className="mb-7 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Illustrative workflow · not a live execution</p>
        <ol className="space-y-0">
          {steps.map(({ icon: Icon, name, detail, artifact }, index) => <li key={name} className="relative flex gap-4 pb-7 last:pb-0">
            {index < steps.length - 1 && <span aria-hidden className="absolute bottom-0 left-[17px] top-9 w-px bg-border" />}
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground"><Icon size={16} strokeWidth={1.5} aria-hidden /></span>
            <div className="pt-1"><h4 className="text-sm font-semibold">{name}</h4><p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-primary">{artifact}</p></div>
          </li>)}
        </ol>
      </div>
    </div>
  );
}
