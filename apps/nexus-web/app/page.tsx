import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Braces,
  CircuitBoard,
  Cpu,
  FileCode2,
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
import { GitHubRepoCard } from "@/components/github-repo-card";
import { MCPIntegrationCard } from "@/components/mcp-integration-card";
import { SearchModal } from "@/components/search-modal";
import { SkillCard } from "@/components/skill-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkflowGraph } from "@/components/workflow-graph";
import { WorkflowPlayground } from "@/components/workflow-playground";
import { WorkflowTimeline } from "@/components/workflow-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agentSystem, mcpIntegrations, skills, workflowExamples } from "@/lib/content";
import { getAllDocs } from "@/lib/docs";
import { getGitHubActivity, getGitHubRepos } from "@/lib/github";

export default async function HomePage() {
  const docs = getAllDocs();
  const [repos, activity] = await Promise.all([getGitHubRepos(), getGitHubActivity()]);

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
            <a href="#skills-marketplace" className="hover:text-cyan-300">
              Skills
            </a>
            <a href="#workflow-engine" className="hover:text-cyan-300">
              Workflows
            </a>
            <a href="#architecture" className="hover:text-cyan-300">
              Architecture
            </a>
            <Link href="/docs" className="hover:text-cyan-300">
              Docs
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <SearchModal docs={docs} skills={skills} />
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
              <Badge className="mb-6">AI Engineering Operating System</Badge>
              <h1 className="text-balance text-4xl font-semibold leading-tight text-zinc-100 sm:text-5xl lg:text-6xl">
                Agentify Your Terminal
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-zinc-300">
                Build Autonomous Engineering Systems with composable AI agents, skills, workflows, and orchestration primitives.
              </p>
              <p className="mt-2 text-zinc-400">Composable AI Agents, Skills &amp; Workflows</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href="#skills-marketplace">Explore Skills</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/docs">View Documentation</Link>
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

        <section id="what-is-nexus" className="nexus-container py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">What is Nexus</h2>
              <p className="mt-2 text-zinc-400">
                A unified ecosystem for agents, skills, workflows, context routing, and multi-agent automation.
              </p>
            </div>
            <Badge variant="secondary">Open Source AI OS</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              [Layers, "Agents", "Specialized workers for architecture, debugging, planning, and operations."],
              [Braces, "Skills", "Reusable execution intelligence for repeatable engineering outcomes."],
              [Workflow, "Workflows", "DAG pipelines with gates, retries, and approval checkpoints."],
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
              <p className="mt-2 text-zinc-400">Discover installable skills for architecture, security, testing, observability, and more.</p>
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
          <p className="mt-2 text-zinc-400">CLASSIFY → PLAN → EXECUTE → VERIFY → DELIVER with role-specific agents.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agentSystem.map((agent, index) => (
              <AgentCard key={agent.id} name={agent.name} role={agent.role} step={index} />
            ))}
          </div>
        </section>

        <section id="workflow-engine" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">Workflow Engine</h2>
          <p className="mt-2 text-zinc-400">DAG execution, parallel branches, retry recovery, verification gates, and human approvals.</p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <WorkflowPlayground />
            <div className="grid gap-3">
              {workflowExamples.map((flow) => (
                <WorkflowTimeline key={flow.name} title={flow.name} steps={flow.steps} />
              ))}
            </div>
          </div>
        </section>

        <section id="documentation" className="nexus-container py-20">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-semibold">Documentation Portal</h2>
              <p className="mt-2 text-zinc-400">
                Full MDX docs with sidebar navigation, syntax highlighting, copy buttons, breadcrumbs, and sequential reading.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/docs">
                Open Docs <BookOpen className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "Getting Started",
              "Writing Skills",
              "Workflow Authoring",
              "MCP Integration",
              "Guardrails",
              "Architecture Patterns"
            ].map((item) => (
              <div key={item} className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4 text-sm text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="architecture" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">Architecture Explorer</h2>
          <p className="mt-2 text-zinc-400">Mermaid-powered system maps for orchestration, memory routing, tools, and workflow execution.</p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <ArchitectureDiagram />
            <Card className="border-zinc-700/80 bg-zinc-900/60">
              <CardHeader>
                <CardTitle>Architecture Layers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <p>
                  <span className="text-cyan-300">Interface Layer:</span> command palette, terminal directives, and docs surface.
                </p>
                <p>
                  <span className="text-cyan-300">Orchestration Layer:</span> classifier, planner, and multi-agent scheduler.
                </p>
                <p>
                  <span className="text-cyan-300">Execution Layer:</span> skills, workflows, retries, and verification gates.
                </p>
                <p>
                  <span className="text-cyan-300">Integration Layer:</span> MCP adapters for GitHub, Jira, cloud, and observability.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="cli" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">CLI Experience</h2>
          <p className="mt-2 text-zinc-400">Terminal-native commands with autonomous execution and workflow routing.</p>
          <div className="mt-6">
            <CommandTerminal />
          </div>
        </section>

        <section id="github" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">GitHub Integration</h2>
          <p className="mt-2 text-zinc-400">Live repository explorer for aayushostwal with stars, forks, languages, and activity streams.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(repos.length ? repos : skills.map((s, i) => ({
              id: i,
              name: s.name.toLowerCase().replace(/\s+/g, "-"),
              description: s.description,
              html_url: s.github,
              stargazers_count: 0,
              forks_count: 0,
              language: "TypeScript",
              updated_at: new Date().toISOString()
            }))).map((repo) => (
              <GitHubRepoCard key={repo.id} repo={repo} />
            ))}
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-200">Recent Activity</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                {(activity.length
                  ? activity
                  : [{ id: "local", type: "PushEvent", repo: { name: "aayushostwal/nexus" }, created_at: new Date().toISOString() }]
                ).map((event) => (
                  <li key={event.id} className="rounded-md border border-zinc-700/70 bg-zinc-950/70 p-2">
                    <span className="text-cyan-300">{event.type}</span> in {event.repo.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-200">Contribution Graph</h3>
              <Image
                src="https://github-readme-activity-graph.vercel.app/graph?username=aayushostwal&theme=github-compact"
                alt="GitHub contribution graph"
                width={900}
                height={320}
                className="h-auto w-full rounded-lg border border-zinc-700/70"
              />
            </div>
          </div>
        </section>

        <section id="examples" className="nexus-container py-20">
          <h2 className="text-3xl font-semibold">Examples Showcase</h2>
          <p className="mt-2 text-zinc-400">Production-ready examples for autonomous debugging, CI automation, and parallel agent orchestration.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["AI Code Review", "nexus run review --pr 428 --severity high"],
              ["Autonomous Debugging", "nexus run debug --incident api-500-spike"],
              ["Multi-Agent Orchestration", "nexus run orchestrate --workflow release-gate"],
              ["Parallel Task Execution", "nexus run parallel --agents architect,reviewer,testing"],
              ["CI/CD Automation", "nexus run ci --strategy progressive-rollout"],
              ["AI Workflow Pipelines", "nexus run pipeline --from classify --to deliver"]
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
              <MCPIntegrationCard
                key={item.title}
                title={item.title}
                description={item.description}
                command={item.command}
              />
            ))}
            {[
              "Open source contributions",
              "Plugin marketplace",
              "Community workflow templates"
            ].map((item) => (
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
            <p className="text-sm text-zinc-400">A modern operating system for AI engineering teams.</p>
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
            <Link href="/docs" className="inline-flex items-center gap-1 hover:text-cyan-300">
              <FileCode2 className="size-4" /> Documentation
            </Link>
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
