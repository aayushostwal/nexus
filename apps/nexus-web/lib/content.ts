import catalog from "../../../catalog/generated.json";

export type Skill = {
  name: string;
  description: string;
  tags: string[];
  complexity: "Beginner" | "Intermediate" | "Advanced";
  example: string;
  github: string;
};

// Optional presentation metadata; the generated catalog determines which skills exist.
const skillDisplay: Pick<Skill, "name" | "tags" | "complexity" | "example">[] = [
  { name: "debugging", tags: ["debugging", "ci/cd", "rca"], complexity: "Intermediate", example: "/nexus:debugging fix production deployment issue" },
  { name: "nexus", tags: ["todos", "briefs", "operations"], complexity: "Beginner", example: "/nexus:nexus show today's brief" },
  { name: "observability", tags: ["observability", "tracing", "incidents"], complexity: "Advanced", example: "/nexus:observability correlate these API failures" },
  { name: "performance", tags: ["performance", "profiling", "dependencies"], complexity: "Intermediate", example: "/nexus:performance find this memory leak" },
  { name: "reliability", tags: ["incidents", "releases", "sre"], complexity: "Advanced", example: "/nexus:reliability run a release readiness gate" },
  { name: "shorts", tags: ["content", "video", "scripts"], complexity: "Beginner", example: "/nexus:shorts script this article in 30 seconds" },
  { name: "skill-writer", tags: ["skills", "authoring", "triggers"], complexity: "Intermediate", example: "/nexus:skill-writer improve this skill's triggers" },
  { name: "testing", tags: ["testing", "flaky", "ci"], complexity: "Intermediate", example: "/nexus:testing investigate this flaky suite" },
  { name: "token-optimizer", tags: ["tokens", "cost", "efficiency"], complexity: "Beginner", example: "Always on — applies to every response" },
  { name: "tutorial", tags: ["tutorials", "notebooks", "teaching"], complexity: "Beginner", example: "/nexus:tutorial build a RAG walkthrough notebook" }
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

// Optional domain grouping; source frontmatter remains authoritative.
const agentDisplay: Pick<Agent, "name" | "domain">[] = [
  { name: "prd-writer-critic", domain: "Product" },
  { name: "roadmap-planner", domain: "Product" },
  { name: "uiux-reviewer", domain: "Design" },
  { name: "mobile-ux-designer", domain: "Design" },
  { name: "system-architecture-reviewer", domain: "Architecture" },
  { name: "scalability-planner", domain: "Architecture" },
  { name: "database-architect", domain: "Data & Events" },
  { name: "event-driven-designer", domain: "Data & Events" },
  { name: "cloud-cost-optimizer", domain: "Cloud" },
  { name: "iac-engineer", domain: "Cloud" },
  { name: "codebase-explorer", domain: "Code & Docs" },
  { name: "code-reviewer", domain: "Code & Docs" },
  { name: "docs-app-builder", domain: "Code & Docs" },
  { name: "ai-product-engineer", domain: "AI" }
];

export type Command = {
  name: string;
  description: string;
};

// Catalog identity, descriptions, tools, and versions come from source files.
export const skills: Skill[] = catalog.skills.map((entry) => {
  const display = skillDisplay.find((item) => item.name === entry.name);
  return { name: entry.name, description: entry.description,
    tags: display?.tags ?? ["engineering"], complexity: display?.complexity ?? "Intermediate",
    example: entry.name === "software-engineer" ? `${entry.invocation} fix issue #123 in the current repository and raise a PR` : (display?.example ?? entry.invocation!),
    github: `https://github.com/aayushostwal/nexus/blob/main/${entry.path}` };
});
export const agents: Agent[] = catalog.agents.map((entry) => ({
  name: entry.name, description: entry.description,
  domain: agentDisplay.find((item) => item.name === entry.name)?.domain ?? "Code & Docs",
  color: entry.color as AgentColor, memory: entry.memory as Agent["memory"], tools: entry.tools,
  github: `https://github.com/aayushostwal/nexus/blob/main/${entry.path}`
}));
export const commands: Command[] = catalog.commands.map((entry) => ({ name: entry.invocation!, description: entry.description }));
export const pluginVersion = catalog.version;

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
