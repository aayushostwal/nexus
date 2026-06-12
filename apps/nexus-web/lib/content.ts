export type Skill = {
  name: string;
  description: string;
  tags: string[];
  complexity: "Beginner" | "Intermediate" | "Advanced";
  example: string;
  github: string;
};

// The 10 skills bundled with the nexus plugin (skills/*/SKILL.md).
export const skills: Skill[] = [
  {
    name: "debugging",
    description: "Evidence-first root-cause analysis with the narrowest fix and verification. Covers CI/CD, tests, runtime, deployment, and tooling failures.",
    tags: ["debugging", "ci/cd", "rca"],
    complexity: "Intermediate",
    example: "/nexus:debugging fix production deployment issue",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/debugging"
  },
  {
    name: "nexus",
    description: "Persistent TODO capture, daily brief retrieval, and shared Codex/Claude operating rules across Slack, Outlook, and Jira contexts.",
    tags: ["todos", "briefs", "operations"],
    complexity: "Beginner",
    example: "/nexus:nexus show today's brief",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/nexus"
  },
  {
    name: "observability",
    description: "Traces correlated API failures and cascading errors across distributed services to identify the origin service and blast radius.",
    tags: ["observability", "tracing", "incidents"],
    complexity: "Advanced",
    example: "/nexus:observability correlate these API failures",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/observability"
  },
  {
    name: "performance",
    description: "Memory, CPU, latency, and query-performance investigations, plus dependency-upgrade blast-radius analysis.",
    tags: ["performance", "profiling", "dependencies"],
    complexity: "Intermediate",
    example: "/nexus:performance find this memory leak",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/performance"
  },
  {
    name: "reliability",
    description: "Production incident response and release-readiness gates: stabilization first, timeline reconstruction, and evidence-led actions.",
    tags: ["incidents", "releases", "sre"],
    complexity: "Advanced",
    example: "/nexus:reliability run a release readiness gate",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/reliability"
  },
  {
    name: "shorts",
    description: "Converts any input — topics, articles, bullets, URLs — into a ready-to-record YouTube Shorts script with hook, narration, and CTA.",
    tags: ["content", "video", "scripts"],
    complexity: "Beginner",
    example: "/nexus:shorts script this article in 30 seconds",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/shorts"
  },
  {
    name: "skill-writer",
    description: "Creates, refactors, and debugs skills; improves SKILL.md trigger quality and produces production-ready routing logic.",
    tags: ["skills", "authoring", "triggers"],
    complexity: "Intermediate",
    example: "/nexus:skill-writer improve this skill's triggers",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/skill-writer"
  },
  {
    name: "testing",
    description: "Isolates flaky and nondeterministic tests — local-vs-CI gaps, race conditions, retry-only greens — and ships the narrowest durable fix.",
    tags: ["testing", "flaky", "ci"],
    complexity: "Intermediate",
    example: "/nexus:testing investigate this flaky suite",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/testing"
  },
  {
    name: "token-optimizer",
    description: "Always-on token optimization rules applied to every response for cost-aware, context-efficient execution.",
    tags: ["tokens", "cost", "efficiency"],
    complexity: "Beginner",
    example: "Always on — applies to every response",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/token-optimizer"
  },
  {
    name: "tutorial",
    description: "Builds executable Jupyter tutorials and AI engineering walkthroughs with runnable, reproducible, copy-paste-ready cells.",
    tags: ["tutorials", "notebooks", "teaching"],
    complexity: "Beginner",
    example: "/nexus:tutorial build a RAG walkthrough notebook",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/tutorial"
  }
];

export type AgentColor = "red" | "blue" | "green" | "yellow" | "purple" | "orange" | "pink" | "cyan";

export type AgentDomain = "Product" | "Design" | "Architecture" | "Data & Events" | "Cloud" | "Code & Docs" | "AI";

export type Agent = {
  name: string;
  description: string;
  domain: AgentDomain;
  color: AgentColor;
  memory: "user" | "project";
  tools: string;
  github: string;
};

// The 14 agents bundled with the nexus plugin (agents/*.md frontmatter).
// Every agent has persistent memory: user scope is portable across repos;
// project scope learns each repo in .claude/agent-memory/.
export const agents: Agent[] = [
  {
    name: "prd-writer-critic",
    description: "Writes complete 10-section PRDs from rough notes, or critiques existing PRDs with a severity-ranked gaps table.",
    domain: "Product",
    color: "purple",
    memory: "user",
    tools: "Read, Write, Grep, Glob, WebSearch",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/prd-writer-critic.md"
  },
  {
    name: "roadmap-planner",
    description: "Turns a known direction into an execution-ready roadmap: scope, sequencing, risks, verify commands, and rollback plans.",
    domain: "Product",
    color: "purple",
    memory: "user",
    tools: "Bash, Read, Grep, Glob, Write",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/roadmap-planner.md"
  },
  {
    name: "uiux-reviewer",
    description: "Read-only UI/UX review of components, pages, and flows with severity-ranked findings and top-3 prioritized fixes.",
    domain: "Design",
    color: "pink",
    memory: "user",
    tools: "Bash, Read, Grep, Glob",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/uiux-reviewer.md"
  },
  {
    name: "mobile-ux-designer",
    description: "Designs and reviews mobile UX for iOS, Android, React Native, and Flutter with screen-by-screen specs and wireframes.",
    domain: "Design",
    color: "pink",
    memory: "user",
    tools: "All tools",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/mobile-ux-designer.md"
  },
  {
    name: "system-architecture-reviewer",
    description: "Maps architecture, coupling, and bounded contexts; issues GO / CONDITIONAL GO / NO-GO deployment safety verdicts.",
    domain: "Architecture",
    color: "blue",
    memory: "project",
    tools: "Bash, Read, Grep, Glob",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/system-architecture-reviewer.md"
  },
  {
    name: "scalability-planner",
    description: "Plans how a system scales to a growth target with bottleneck-ordered tiers, trigger metrics, and cost estimates.",
    domain: "Architecture",
    color: "blue",
    memory: "project",
    tools: "Bash, Read, Grep, Glob, WebSearch",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/scalability-planner.md"
  },
  {
    name: "database-architect",
    description: "Schema design, indexing strategy, and query optimization, with migration plans where every step has verify and rollback commands.",
    domain: "Data & Events",
    color: "orange",
    memory: "project",
    tools: "All tools",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/database-architect.md"
  },
  {
    name: "event-driven-designer",
    description: "Designs and reviews async systems — queues, streams, sagas, outbox, DLQs — with explicit failure-mode tables.",
    domain: "Data & Events",
    color: "orange",
    memory: "project",
    tools: "All tools",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/event-driven-designer.md"
  },
  {
    name: "cloud-cost-optimizer",
    description: "Cloud cost audits and bill-spike investigations from real billing data, with prioritized savings and copy-paste quick wins.",
    domain: "Cloud",
    color: "yellow",
    memory: "user",
    tools: "Bash, Read, Grep, Glob, WebSearch, WebFetch",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/cloud-cost-optimizer.md"
  },
  {
    name: "iac-engineer",
    description: "Designs cloud architecture and writes the Terraform/CDK for it, or audits existing IaC with file:line evidence.",
    domain: "Cloud",
    color: "yellow",
    memory: "project",
    tools: "All tools",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/iac-engineer.md"
  },
  {
    name: "codebase-explorer",
    description: "Token-efficient codebase exploration returning a concise map of where features, entry points, and configs live.",
    domain: "Code & Docs",
    color: "green",
    memory: "project",
    tools: "Bash, Read, Grep, Glob",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/codebase-explorer.md"
  },
  {
    name: "code-reviewer",
    description: "Senior-level review of a PR, branch, or diff with a verdict and file:line findings. Read-only — never edits code.",
    domain: "Code & Docs",
    color: "red",
    memory: "project",
    tools: "Bash, Read, Grep, Glob",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/code-reviewer.md"
  },
  {
    name: "docs-app-builder",
    description: "Builds documentation as a React app with sidebar navigation, Mermaid diagrams, reference tables, and search.",
    domain: "Code & Docs",
    color: "green",
    memory: "project",
    tools: "All tools",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/docs-app-builder.md"
  },
  {
    name: "ai-product-engineer",
    description: "Designs and reviews LLM features end-to-end: model selection, RAG, agent design, eval pipelines, and token economics.",
    domain: "AI",
    color: "cyan",
    memory: "user",
    tools: "All tools",
    github: "https://github.com/aayushostwal/nexus/blob/main/agents/ai-product-engineer.md"
  }
];

export type Command = {
  name: string;
  description: string;
};

// The 4 slash commands bundled with the plugin (commands/*.md).
export const commands: Command[] = [
  { name: "/nexus:add-todo", description: "Add a global Nexus TODO with automatic classification." },
  { name: "/nexus:daily-brief", description: "Build a daily brief from TODOs, Slack, Outlook, and Jira where configured." },
  { name: "/nexus:review-branch", description: "Review the current git branch for bugs, regressions, and missing tests." },
  { name: "/nexus:stats", description: "Show token usage and estimated cost stats for Claude and Codex sessions." }
];

export const pluginVersion = "1.30.0";

export const workflowStages = ["CLASSIFY", "PLAN", "EXECUTE", "VERIFY", "DELIVER"];

export const workflowExamples = [
  {
    name: "Bug Fix Workflow",
    steps: ["Classify severity", "Spawn debugger", "Patch + tests", "Reviewer verification", "Ship hotfix"]
  },
  {
    name: "Release Workflow",
    steps: ["Generate release plan", "Run QA matrix", "Approval gate", "Deploy gradually", "Observability watch"]
  },
  {
    name: "PR Review Workflow",
    steps: ["Diff analysis", "Risk scoring", "Findings report", "Fix suggestions", "Merge readiness"]
  },
  {
    name: "Incident Response Workflow",
    steps: ["Signal correlation", "Containment", "Root cause", "Recovery automation", "RCA artifact"]
  },
  {
    name: "Refactoring Workflow",
    steps: ["Dependency map", "Slice planning", "Parallel workers", "Verification gates", "Progressive rollout"]
  }
];

export const mcpIntegrations = [
  {
    title: "GitHub MCP",
    description: "Issue triage, PR reviews, branch insights, and release management from one terminal workflow.",
    command: "claude mcp add github"
  },
  {
    title: "Jira MCP",
    description: "Sprint analytics, ticket orchestration, and delivery-state automation via structured tool calls.",
    command: "claude mcp add jira"
  },
  {
    title: "AWS MCP",
    description: "Infrastructure-aware automation for deployments, policy checks, and regional availability analysis.",
    command: "claude mcp add aws"
  }
];
