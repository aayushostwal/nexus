import Link from "next/link";
import Image from "next/image";
import {
  Copyright,
  Github,
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { AgentsGrid } from "@/components/agents-grid";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { ClaudeMdSetup } from "@/components/claude-md-setup";
import { CommandTerminal } from "@/components/command-terminal";
import { FloatingTerminal } from "@/components/floating-terminal";
import { SearchModal } from "@/components/search-modal";
import { SkillsGrid } from "@/components/skills-grid";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agents, commands, pluginVersion, skills } from "@/lib/content";
import { getAllDocs } from "@/lib/docs";

export default async function HomePage() {
  const docs = getAllDocs();
  return (
    <div className="relative min-h-screen overflow-x-clip bg-nexus-gradient">
      <AnimatedBackground />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur-xl">
        <div className="nexus-container flex h-14 items-center justify-between sm:h-16">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-zinc-100">
            <Image src="/logos/nexus-logo.svg" alt="Nexus logo" width={22} height={22} className="size-[22px]" />
            Nexus
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-300 lg:flex">
            <a href="#agent-system" className="hover:text-cyan-300">Agents</a>
            <a href="#skills-marketplace" className="hover:text-cyan-300">Skills</a>
            <a href="#install" className="hover:text-cyan-300">Install</a>
            <a href="#architecture" className="hover:text-cyan-300">Architecture</a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <SearchModal docs={docs} skills={skills} agents={agents} />
            <ThemeToggle />
            <Button asChild size="sm">
              <a href="https://github.com/aayushostwal" target="_blank" rel="noreferrer">
                <Github className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="nexus-container pb-3 lg:hidden">
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 text-xs text-zinc-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              ["#agent-system", "Agents"],
              ["#skills-marketplace", "Skills"],
              ["#install", "Install"],
              ["#architecture", "Architecture"],
            ].map(([href, label]) => (
              <a
                key={label}
                href={href}
                className="whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2.5 py-1.5 hover:text-cyan-300"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="nexus-container relative py-16 sm:py-20 lg:py-24">
          <Badge className="mb-6">14 Memory-Enabled Agents</Badge>
          <h1 className="text-balance text-3xl font-semibold leading-tight text-zinc-100 sm:text-5xl lg:text-6xl">
            Agentify Your Terminal
          </h1>
          <p className="mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg">
            Nexus ships 14 specialized agents — each focused on one domain, color-coded for fast orientation, and equipped with persistent memory that learns your conventions across sessions.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            <span className="text-purple-300">Product</span>
            {" · "}
            <span className="text-pink-300">Design</span>
            {" · "}
            <span className="text-blue-300">Architecture</span>
            {" · "}
            <span className="text-orange-300">Data &amp; Events</span>
            {" · "}
            <span className="text-yellow-300">Cloud</span>
            {" · "}
            <span className="text-green-300">Code &amp; Docs</span>
            {" · "}
            <span className="text-cyan-300">AI</span>
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="#agent-system">Explore Agents</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <a href="#skills-marketplace">Explore Skills</a>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
              <a href="https://github.com/aayushostwal/nexus" target="_blank" rel="noreferrer">
                GitHub Repository
              </a>
            </Button>
          </div>
          {/* Stats strip */}
          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [String(agents.length), "Agents"],
              [String(skills.length), "Skills"],
              [String(commands.length), "Commands"],
              [`v${pluginVersion}`, "Version"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-zinc-700/70 bg-zinc-900/50 px-4 py-3">
                <p className="text-2xl font-semibold text-zinc-100">{value}</p>
                <p className="text-xs text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Terminal + CLAUDE.md panels ────────────────────────────────── */}
        <section className="nexus-container pb-12">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
              <p className="mb-3 text-sm text-zinc-400">
                Invoke agents and skills with{" "}
                <code className="text-cyan-300">@agent-name</code> or{" "}
                <code className="text-cyan-300">/nexus:skill</code>
              </p>
              <CommandTerminal />
            </div>
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
              <p className="mb-3 text-sm text-zinc-400">
                Use agents by default — add to your{" "}
                <code className="text-cyan-300">~/.claude/CLAUDE.md</code>
              </p>
              <ClaudeMdSetup />
            </div>
          </div>
        </section>

        {/* ── Agents ─────────────────────────────────────────────────────── */}
        <section id="agent-system" className="nexus-container py-16 sm:py-20">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Agents</h2>
              <p className="mt-2 max-w-2xl text-zinc-400">
                14 specialized subagents with persistent memory. Each runs in its own context window,
                owns a domain, and accumulates knowledge across sessions — project memory learns your repo,
                user memory travels with you everywhere.
              </p>
            </div>
          </div>
          <AgentsGrid agents={agents} />
        </section>

        {/* ── Skills ─────────────────────────────────────────────────────── */}
        <section id="skills-marketplace" className="nexus-container py-16 sm:py-20">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold sm:text-3xl">Skills</h2>
            <p className="mt-2 text-zinc-400">
              10 bundled skills for debugging, testing, reliability, observability, performance, content, and token efficiency.
              Skills are always-on playbooks — invoke with <code>/nexus:skill-name</code>.
            </p>
          </div>
          <SkillsGrid skills={skills} />
        </section>

        {/* ── Install ────────────────────────────────────────────────────── */}
        <section id="install" className="nexus-container py-16 sm:py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Install</h2>
          <p className="mt-2 text-zinc-400">
            Git-based marketplace — no npm package, no global CLI. Bundled scripts are dependency-free and run with plain{" "}
            <code>node</code> (Node 18+).
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card className="border-zinc-700/80 bg-zinc-900/60">
              <CardHeader>
                <CardTitle>Claude Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "/plugin marketplace add aayushostwal/nexus",
                  "/plugin install nexus@nexus-marketplace",
                  "/reload-plugins",
                ].map((cmd) => (
                  <p key={cmd} className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">
                    {cmd}
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card className="border-zinc-700/80 bg-zinc-900/60">
              <CardHeader>
                <CardTitle className="text-base">Codex <span className="text-sm font-normal text-zinc-400">(via third-party codex-marketplace)</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">
                  {"# Global\nnpx codex-marketplace add aayushostwal/nexus --plugin --global"}
                </p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">
                  {"# Project\nnpx codex-marketplace add aayushostwal/nexus --plugin --project"}
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            Bundled helper scripts run with{" "}
            <code>node &quot;{"${CLAUDE_PLUGIN_ROOT}"}/bin/nexus.js&quot;</code> — no install step ever needed.
          </p>
        </section>

        {/* ── Architecture ───────────────────────────────────────────────── */}
        <section id="architecture" className="nexus-container py-16 sm:py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Architecture</h2>
          <p className="mt-2 text-zinc-400">
            Click any node to pin its details. Hover to preview connections and routing flow.
          </p>
          <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 px-4 sm:px-8 lg:px-12">
            <ArchitectureDiagram />
          </div>
        </section>

      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950/70 py-10">
        <div className="nexus-container flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="text-center">
            <p className="inline-flex w-full items-center justify-center gap-2 text-lg font-semibold text-zinc-100">
              <Image src="/logos/nexus.svg" alt="Nexus wordmark" width={96} height={24} className="h-6 w-auto" />
            </p>
            <p className="text-sm text-zinc-400">14 agents. 10 skills. One plugin install.</p>
            <p className="mt-1 inline-flex w-full items-center justify-center gap-1 text-sm text-zinc-400">
              <Copyright className="size-3.5" />
              Maintained by Aayush Ostwal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
            <a href="https://github.com/aayushostwal/nexus" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-300">
              <Github className="size-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>

      <FloatingTerminal />
    </div>
  );
}
