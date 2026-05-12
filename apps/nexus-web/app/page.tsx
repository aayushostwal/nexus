import Link from "next/link";
import Image from "next/image";
import {
  Braces,
  CircuitBoard,
  Copyright,
  Github,
  Globe,
  Layers,
  Network,
  Search,
  Workflow
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { AgentCard } from "@/components/agent-card";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { CommandTerminal } from "@/components/command-terminal";
import { FloatingTerminal } from "@/components/floating-terminal";
import { SearchModal } from "@/components/search-modal";
import { SkillCard } from "@/components/skill-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agentSystem, skills } from "@/lib/content";

export default async function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-nexus-gradient">
      <AnimatedBackground />
      <header className="sticky top-0 z-30 border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur-xl">
        <div className="nexus-container flex h-14 items-center justify-between sm:h-16">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-zinc-100">
            <Image src="/logos/nexus-logo.svg" alt="Nexus logo" width={22} height={22} className="size-[22px]" />
            Nexus
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-300 lg:flex">
            <a href="#what-is-nexus" className="hover:text-cyan-300">
              Platform
            </a>
            <a href="#install" className="hover:text-cyan-300">
              Install
            </a>
            <a href="#skills-marketplace" className="hover:text-cyan-300">
              Skills
            </a>
            <a href="#agent-system" className="hover:text-cyan-300">
              Agents
            </a>
            <a href="#architecture" className="hover:text-cyan-300">
              Architecture
            </a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <SearchModal docs={[]} skills={skills} />
            <ThemeToggle />
            <Button asChild size="sm">
              <a href="https://github.com/aayushostwal" target="_blank" rel="noreferrer">
                <Github className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
        <div className="nexus-container pb-3 lg:hidden">
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 text-xs text-zinc-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <a href="#what-is-nexus" className="whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2.5 py-1.5 hover:text-cyan-300">
              Platform
            </a>
            <a href="#install" className="whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2.5 py-1.5 hover:text-cyan-300">
              Install
            </a>
            <a href="#skills-marketplace" className="whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2.5 py-1.5 hover:text-cyan-300">
              Skills
            </a>
            <a href="#agent-system" className="whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2.5 py-1.5 hover:text-cyan-300">
              Agents
            </a>
            <a href="#architecture" className="whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2.5 py-1.5 hover:text-cyan-300">
              Architecture
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="nexus-container relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12">
            <div>
              <Badge className="mb-6">AI Terminal Aggregator</Badge>
              <h1 className="text-balance text-3xl font-semibold leading-tight text-zinc-100 sm:text-5xl lg:text-6xl">
                Agentify Your Terminal
              </h1>
              <p className="mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg">
                Nexus is an aggregator of skills and agents that automate and leverage Codex and Claude terminal workflows.
              </p>
              <p className="mt-2 text-zinc-400">Composable AI Agents, Skills, and token-efficient automation for engineering teams.</p>
              <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href="#skills-marketplace">Explore Skills</a>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <a href="#agent-system">Explore Agents</a>
                </Button>
                <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                  <a href="https://github.com/aayushostwal" target="_blank" rel="noreferrer">
                    GitHub Repository
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="nexus-container pb-4">
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
            <p className="mb-3 text-sm text-zinc-400">
              CLI Commands <code>/nexus:&lt;skill-or-agent&gt;</code>
            </p>
            <CommandTerminal />
          </div>
        </section>

        <section id="install" className="nexus-container py-16 sm:py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Install in Codex and Claude Terminal</h2>
          <p className="mt-2 text-zinc-400">
            Drop Nexus into your terminal stack and run agent/skill commands with <code>/nexus:&lt;skill-or-agent&gt;</code> syntax.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card className="border-zinc-700/80 bg-zinc-900/60">
              <CardHeader>
                <CardTitle>Codex Terminal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">npm i -g nexus-agent-kit</p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">
                  # Install globally
                  <br />
                  npx codex-marketplace add aayushostwal/nexus --plugin --global  
                  
                </p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">
                  # Install for project
                  <br />
                  npx codex-marketplace add aayushostwal/nexus --plugin --project 
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-700/80 bg-zinc-900/60">
              <CardHeader>
                <CardTitle>Claude Terminal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">npm i -g nexus-agent-kit</p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">
                  /plugin marketplace add aayushostwal/nexus
                </p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">
                  /plugin install nexus@nexus-marketplace
                </p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">/reload-plugins</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="what-is-nexus" className="nexus-container py-16 sm:py-20">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">What is Nexus</h2>
              <p className="mt-2 text-zinc-400">
                A terminal-first aggregator that curates installable engineering skills and specialist agents into one automation layer.
              </p>
            </div>
            <Badge variant="secondary">Open Source AI OS</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              [Layers, "Agents", "Specialized workers for architecture, debugging, planning, and operations."],
              [Braces, "Skills", "Reusable execution intelligence for repeatable engineering outcomes."],
              [Workflow, "Token Management", "Built-in token-saving strategy for cost-aware and context-efficient execution."],
              [Network, "Orchestration", "Context-aware handoffs between agents running in sequence or parallel."],
              [CircuitBoard, "Tooling", "MCP integrations across GitHub, Jira, AWS, Slack, and more."],
              [Globe, "Memory", "Long-lived context, TODO intelligence, and cross-session continuity."]
            ].map(([Icon, title, desc]) => (
              <Card key={title as string} className="border-zinc-700/80 bg-zinc-900/55">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="size-4 text-cyan-300" />
                    {title as string}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-300">{desc as string}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="skills-marketplace" className="nexus-container py-16 sm:py-20">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Skills Marketplace</h2>
              <p className="mt-2 text-zinc-400">Discover installable skills for architecture, security, testing, observability, and token management.</p>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-400 md:flex">
              <Search className="size-4" /> Search via command palette
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>
        </section>

        <section id="agent-system" className="nexus-container py-16 sm:py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Agent System</h2>
          <p className="mt-2 text-zinc-400">Specialized agents with explicit command patterns, role boundaries, and ownership.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agentSystem.map((agent, index) => (
              <AgentCard
                key={agent.id}
                name={agent.name}
                role={agent.role}
                command={agent.command}
                bestFor={agent.bestFor}
                ownership={agent.ownership}
                step={index}
              />
            ))}
          </div>
        </section>

        <section id="architecture" className="nexus-container py-16 sm:py-20">
          <h2 className="text-2xl font-semibold sm:text-3xl">Architecture Explorer</h2>
          <p className="mt-2 text-zinc-400">Mermaid-powered system maps for orchestration, memory routing, and tool execution.</p>
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
            <p className="text-sm text-zinc-400">Aggregator of skills and agents for AI terminals.</p>
            <p className="mt-1 inline-flex w-full items-center justify-center gap-1 text-sm text-zinc-400">
              <Copyright className="size-3.5" />
              Maintained by Aayush Ostwal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
            <a href="https://github.com/aayushostwal" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-300">
              <Github className="size-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>

      <FloatingTerminal />
    </div>
  );
}
