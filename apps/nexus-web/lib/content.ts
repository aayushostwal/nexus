export type Skill = {
  name: string;
  description: string;
  tags: string[];
  complexity: "Beginner" | "Intermediate" | "Advanced";
  example: string;
  install: string;
  github: string;
};

export const skills: Skill[] = [
  {
    name: "Architecture Mapper",
    description: "Maps service boundaries, dependencies, and deployment risk before major changes.",
    tags: ["architecture", "systems", "risk"],
    complexity: "Advanced",
    example: "/Nexus Map this monolith into bounded contexts",
    install: "nexus skill install architecture-mapper",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/architecture"
  },
  {
    name: "Autonomous Debugger",
    description: "Runs evidence-first root-cause analysis with narrow fixes and verification loops.",
    tags: ["debugging", "incident", "ci/cd"],
    complexity: "Intermediate",
    example: "/Nexus Fix production deployment issue",
    install: "nexus skill install autonomous-debugger",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/debugging"
  },
  {
    name: "PR Review Guardian",
    description: "Performs senior-grade code reviews with severity-ranked findings and rollout risk.",
    tags: ["review", "quality", "security"],
    complexity: "Intermediate",
    example: "/Nexus Review this PR",
    install: "nexus skill install review-guardian",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/code-review"
  },
  {
    name: "Refactor Strategist",
    description: "Plans incremental refactors with dependency awareness and regression containment.",
    tags: ["refactor", "planning", "testing"],
    complexity: "Advanced",
    example: "/Nexus Refactor this service without downtime",
    install: "nexus skill install refactor-strategist",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/planning"
  },
  {
    name: "DevOps Automator",
    description: "Builds CI pipelines, release gates, and rollback-safe deployment workflows.",
    tags: ["devops", "automation", "release"],
    complexity: "Advanced",
    example: "/Nexus Create release workflow",
    install: "nexus skill install devops-automator",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/reliability"
  },
  {
    name: "Security Sentinel",
    description: "Audits policies, permissions, and secrets exposure with least-privilege guidance.",
    tags: ["security", "iam", "guardrails"],
    complexity: "Advanced",
    example: "/Nexus Audit this repo for secret leaks",
    install: "nexus skill install security-sentinel",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/reliability"
  },
  {
    name: "Observability Correlator",
    description: "Finds causal chains across distributed services during cascading failures.",
    tags: ["observability", "tracing", "sre"],
    complexity: "Advanced",
    example: "/Nexus Correlate these API failures",
    install: "nexus skill install observability-correlator",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/observability"
  },
  {
    name: "Performance Forensics",
    description: "Investigates latency, memory, and CPU regressions with blast-radius analysis.",
    tags: ["performance", "profiling", "scalability"],
    complexity: "Intermediate",
    example: "/Nexus Optimize architecture",
    install: "nexus skill install performance-forensics",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/performance"
  },
  {
    name: "Test Stabilizer",
    description: "Eliminates flaky tests using deterministic fixtures and race-condition isolation.",
    tags: ["testing", "qa", "ci"],
    complexity: "Intermediate",
    example: "/Nexus Investigate flaky tests",
    install: "nexus skill install test-stabilizer",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/testing"
  }
];

export const agentSystem = [
  { id: "orchestrator", name: "Nexus Orchestrator", role: "Routes tasks and coordinates agent swarms" },
  { id: "architect", name: "Architect", role: "Designs structure, boundaries, and change strategy" },
  { id: "debugger", name: "Debugger", role: "Finds root cause and applies narrow fixes" },
  { id: "refactorer", name: "Refactorer", role: "Modernizes code safely with migration slices" },
  { id: "reviewer", name: "Reviewer", role: "Enforces quality gates and regression checks" },
  { id: "planner", name: "Planner", role: "Builds executable implementation plans" },
  { id: "devops", name: "DevOps Agent", role: "Automates pipelines, release gates, and rollbacks" },
  { id: "infra", name: "Infra Agent", role: "Owns cloud resources, IaC, and platform topology" },
  { id: "testing", name: "Testing Agent", role: "Continuously verifies behavior and reliability" }
];

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
    command: "mcp add github --scopes repo,read:org"
  },
  {
    title: "Jira MCP",
    description: "Sprint analytics, ticket orchestration, and delivery-state automation via structured tool calls.",
    command: "mcp add jira --cloud-id <cloud_id>"
  },
  {
    title: "AWS MCP",
    description: "Infrastructure-aware automation for deployments, policy checks, and regional availability analysis.",
    command: "mcp add aws --profile platform-prod"
  }
];
