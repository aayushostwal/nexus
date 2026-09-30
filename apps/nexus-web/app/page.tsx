import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, FileCheck2, GitBranch, ScanLine } from "lucide-react";
import { AgentsGrid } from "@/components/agents-grid";
import { SkillsGrid } from "@/components/skills-grid";
import { SiteHeader } from "@/components/site-header";
import { InstallPanel } from "@/components/install-panel";
import { WorkflowPreview } from "@/components/workflow-preview";
import { agents, commands, pluginVersion, skills } from "@/lib/content";
import { getAllDocs } from "@/lib/docs";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader docs={getAllDocs()} skills={skills} agents={agents} />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <section className="nexus-container pb-14 pt-14 sm:pb-20 sm:pt-20 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
            <div>
              <p className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs"><span className="size-1.5 rounded-full bg-primary" /> Open source. Inside your repository.</p>
              <h1 className="max-w-3xl text-[clamp(2.8rem,6.4vw,5.5rem)] font-semibold leading-[1.04] tracking-[-0.055em]">From open issue<br />to <span className="font-serif font-normal italic text-primary">reviewable PR.</span></h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">Give your coding agent a way to work. Nexus brings focused skills, specialist agents, and an issue-to-PR workflow to Claude Code and Codex.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#install" className="inline-flex min-h-12 items-center justify-center gap-5 rounded-md bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">Install Nexus <ArrowRight size={16} aria-hidden /></a>
                <a href="#workflow" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md border border-border px-5 text-sm font-medium transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Explore the workflow <ArrowDown size={15} aria-hidden /></a>
              </div>
              <p className="mt-5 font-mono text-[10px] text-muted-foreground">MIT licensed · Inspectable Markdown · Your host, your tools</p>
            </div>
            <div className="relative rounded-lg border border-border bg-card p-6 sm:p-8">
              <div className="mb-8 flex items-center justify-between gap-4 border-b border-border pb-4"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">The working agreement</p><span className="font-mono text-[10px] text-primary">01—03</span></div>
              {[{ n: "01", title: "Understand before editing", text: "Read the issue, inspect the repository, and reproduce the failure." }, { n: "02", title: "Keep the change focused", text: "Protect unrelated work. Follow the project’s own conventions." }, { n: "03", title: "Bring evidence to review", text: "Report checks, limitations, and the actual pull request status." }].map(item => <div key={item.n} className="mb-7 flex gap-4 last:mb-0"><span className="pt-1 font-mono text-[10px] text-muted-foreground">{item.n}</span><div><h2 className="text-sm font-semibold">{item.title}</h2><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p></div></div>)}
              <div className="absolute -bottom-2 left-4 right-4 -z-10 h-4 rounded-b-lg border border-border bg-card" aria-hidden />
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 border-y border-border sm:grid-cols-4">
            {[[String(skills.length).padStart(2, "0"), "Reusable skills"], [String(agents.length).padStart(2, "0"), "Specialist agents"], [String(commands.length).padStart(2, "0"), "Terminal commands"], [`v${pluginVersion}`, "Current catalog"]].map(([value, label], index) => <div key={label} className={`py-5 sm:py-6 ${index ? "sm:border-l sm:border-border sm:pl-6" : ""} ${index % 2 ? "pl-5" : ""}`}><span className="font-mono text-xl font-medium tracking-tight sm:text-2xl">{value}</span><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}
          </div>
        </section>

        <section id="workflow" className="nexus-container scroll-mt-28 pb-20 sm:pb-28">
          <div className="mb-8 grid gap-4 lg:grid-cols-2 lg:items-end"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">01 / A complete workflow</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">The work between issue and PR.</h2></div><p className="max-w-lg text-sm leading-7 text-muted-foreground lg:justify-self-end">Start with a specific issue, a bug described in chat, or your current directory. The workflow carries context through each stage.</p></div>
          <WorkflowPreview />
        </section>

        <section id="install" className="scroll-mt-24 border-y border-border bg-card/50 py-16 sm:py-24">
          <div className="nexus-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">02 / Make it yours</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your next session,<br />with a better starting point.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">Install the plugin, open a repository, and choose a workflow. Everything ships as source you can read and adapt.</p><Link href="/docs/getting-started/quickstart" className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-primary">Read the quickstart <ArrowUpRight size={15} aria-hidden /></Link><p className="mt-8 max-w-sm border-l-2 border-border pl-4 text-xs leading-6 text-muted-foreground">Claude agent registration and memory are host-specific. Codex plugin installation has been checked locally; model-driven routing and GitHub execution require separate verification.</p></div>
            <div className="min-w-0"><InstallPanel /><p className="mt-4 text-xs leading-6 text-muted-foreground">GitHub access is configured separately. Bundled Node helpers require Node.js 18+.</p></div>
          </div>
        </section>

        <section id="skills-marketplace" className="nexus-container scroll-mt-24 py-16 sm:py-24">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">03 / The skill library</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">A playbook for the task at hand.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Focused instructions for debugging, testing, reliability, and more. Choose a skill by intent; inspect the source before making it part of your workflow.</p></div><span className="shrink-0 font-mono text-xs text-muted-foreground">{skills.length} skills / source included</span></div>
          <SkillsGrid skills={skills} />
        </section>

        <section id="agent-system" className="nexus-container scroll-mt-24 border-t border-border py-16 sm:py-24">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">04 / Specialist perspectives</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bring the right expertise.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Claude Code agent definitions for architecture, product, infrastructure, and code review. Tool declarations and memory scopes are visible in each definition.</p></div><Link href="/docs/core/writing-agents" className="inline-flex shrink-0 items-center gap-2 text-sm underline-offset-4 hover:underline">How agents work <ArrowUpRight size={14} aria-hidden /></Link></div>
          <AgentsGrid agents={agents} />
        </section>

        <section className="border-y border-border bg-card/50 py-14"><div className="nexus-container grid gap-8 md:grid-cols-3">{[{ icon: ScanLine, title: "Inspectable by design", text: "Skills and agents are readable source files. Review what you install and change what your team needs." }, { icon: GitBranch, title: "Built around your repository", text: "The workflow follows local instructions, existing tests, and the conventions already in your codebase." }, { icon: FileCheck2, title: "Verification stays visible", text: "Passing local checks, pending CI, and unverified behavior are different states. The workflow reports them separately." }].map(({ icon: Icon, title, text }) => <div key={title}><Icon size={22} strokeWidth={1.5} className="mb-4 text-primary" aria-hidden /><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p></div>)}</div></section>
      </main>
      <footer className="nexus-container py-10"><div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center"><div><Link href="/" className="text-lg font-semibold tracking-tight">Nexus<span className="text-primary">.</span></Link><p className="mt-2 text-xs text-muted-foreground">An open-source engineering toolkit by Aayush Ostwal.</p></div><nav aria-label="Footer navigation" className="flex flex-wrap gap-5 text-xs text-muted-foreground"><Link href="/docs" className="hover:text-foreground">Documentation</Link><a href="https://github.com/aayushostwal/nexus" className="hover:text-foreground">GitHub</a><a href="https://github.com/aayushostwal/nexus/blob/main/README.md#privacy" className="hover:text-foreground">Privacy</a><a href="https://github.com/aayushostwal/nexus/blob/main/LICENSE" className="hover:text-foreground">MIT License</a></nav></div></footer>
    </div>
  );
}
