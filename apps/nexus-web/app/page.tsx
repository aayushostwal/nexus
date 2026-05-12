import Link from "next/link";
import {
  Braces,
  CircuitBoard,
  Cpu,
  Github,
  Globe,
  Layers,
  Linkedin,
  Network,
  Search,
  Twitter,
  Workflow
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { AgentCard } from "@/components/agent-card";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { CommandTerminal } from "@/components/command-terminal";
import { FloatingTerminal } from "@/components/floating-terminal";
import { MCPIntegrationCard } from "@/components/mcp-integration-card";
import { SearchModal } from "@/components/search-modal";
import { SkillCard } from "@/components/skill-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkflowGraph } from "@/components/workflow-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agentSystem, mcpIntegrations, skills } from "@/lib/content";

export default async function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-nexus-gradient">
      <AnimatedBackground />
      <header className="sticky top-0 z-30 border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur-xl">
        <div className="nexus-container flex h-16 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-zinc-100">
            <Cpu className="size-5 text-cyan-300" /> Nexus
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
          <div className="flex items-center gap-2">
            <SearchModal docs={[]} skills={skills} />
            <ThemeToggle />
            <Button asChild size="sm">
              <a href="https://github.com/aayushostwal" target="_blank" rel="noreferrer">
                <Github className="mr-2 size-4" /> GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="nexus-container relative py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Badge className="mb-6">AI Terminal Aggregator</Badge>
              <h1 className="text-balance text-4xl font-semibold leading-tight text-zinc-100 sm:text-5xl lg:text-6xl">
                Agentify Your Terminal
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-zinc-300">
                Nexus is an aggregator of skills and agents that automate and leverage Codex and Claude terminal workflows.
              </p>
              <p className="mt-2 text-zinc-400">Composable AI Agents, Skills, and token-efficient automation for engineering teams.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href="#skills-marketplace">Explore Skills</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#agent-system">Expore Agents</a>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <a href="https://github.com/aayushostwal" target="_blank" rel="noreferrer">
                    GitHub Repository
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <WorkflowGraph />
              <div className="mt-4 animate-float">
                <CommandTerminal />
              </div>
            </div>
          </div>
        </section>

        <section id="install" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">Install in Codex and Claude Terminal</h2>
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
                  npx codex-marketplace add aayushostwal/nexus --plugin --global
                </p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">
                  npx codex-marketplace add aayushostwal/nexus --plugin --project
                </p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">nexus init</p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">/nexus:token-saving reduce prompt context footprint</p>
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
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">nexus hooks:install</p>
                <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">/nexus:orchestrator route this incident response workflow</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="what-is-nexus" className="nexus-container py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">What is Nexus</h2>
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

        <section id="skills-marketplace" className="nexus-container py-20">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">Skills Marketplace</h2>
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

        <section id="agent-system" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">Agent System</h2>
          <p className="mt-2 text-zinc-400">CLASSIFY → PLAN → EXECUTE → VERIFY → DELIVER with explicit command patterns and ownership.</p>
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

        <section id="architecture" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">Architecture Explorer</h2>
          <p className="mt-2 text-zinc-400">Mermaid-powered system maps for orchestration, memory routing, and tool execution.</p>
          <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 px-4 sm:px-8 lg:px-12">
            <ArchitectureDiagram />
          </div>
        </section>

        <section id="cli" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">CLI Experience</h2>
          <p className="mt-2 text-zinc-400">
            Terminal-native commands with skill and agent routing through <code>/nexus:&lt;skill-or-agent&gt;</code>.
          </p>
          <div className="mt-6">
            <CommandTerminal />
          </div>
        </section>

        <section id="examples" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">Examples Showcase</h2>
          <p className="mt-2 text-zinc-400">Practical commands for skill and agent automation in AI terminals.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["AI Code Review", "/nexus:code-review review PR #428"],
              ["Autonomous Debugging", "/nexus:debugging resolve api-500 spike"],
              ["Architecture Mapping", "/nexus:architecture map bounded contexts"],
              ["Parallel Agent Routing", "/nexus:orchestrator route architect+reviewer+testing"],
              ["Release Automation", "/nexus:reliability create progressive rollout"],
              ["Token Budget Control", "/nexus:token-saving reduce token use by 30%"]
            ].map(([title, code]) => (
              <Card key={title as string} className="border-zinc-700/80 bg-zinc-900/60">
                <CardHeader>
                  <CardTitle className="text-base">{title as string}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 font-mono text-xs text-cyan-300">{code as string}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="community" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">Community & Ecosystem</h2>
          <p className="mt-2 text-zinc-400">Contribute plugins, share workflows, and extend the Nexus agentic infrastructure.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mcpIntegrations.map((item) => (
              <MCPIntegrationCard key={item.title} title={item.title} description={item.description} command={item.command} />
            ))}
            {["Open source contributions", "Plugin marketplace", "Community workflow templates"].map((item) => (
              <Card key={item} className="border-zinc-700/80 bg-zinc-900/60">
                <CardContent className="p-5 text-sm text-zinc-300">{item}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950/70 py-10">
        <div className="nexus-container flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-semibold text-zinc-100">Nexus</p>
            <p className="text-sm text-zinc-400">Aggregator of skills and agents for AI terminals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
            <a href="https://github.com/aayushostwal" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-300">
              <Github className="size-4" /> GitHub
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-300">
              <Linkedin className="size-4" /> LinkedIn
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-cyan-300">
              <Twitter className="size-4" /> Twitter/X
            </a>
            <a href="https://github.com/aayushostwal/nexus/blob/main/LICENSE" className="hover:text-cyan-300">
              License
            </a>
          </div>
        </div>
      </footer>

      <FloatingTerminal />
    </div>
  );
}
