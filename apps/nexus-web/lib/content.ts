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
    example: "/nexus:architecture map this monolith into bounded contexts",
    install: "nexus skill install architecture-mapper",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/architecture"
  },
  {
    name: "Autonomous Debugger",
    description: "Runs evidence-first root-cause analysis with narrow fixes and verification loops.",
    tags: ["debugging", "incident", "ci/cd"],
    complexity: "Intermediate",
    example: "/nexus:debugging fix production deployment issue",
    install: "nexus skill install autonomous-debugger",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/debugging"
  },
  {
    name: "PR Review Guardian",
    description: "Performs senior-grade code reviews with severity-ranked findings and rollout risk.",
    tags: ["review", "quality", "security"],
    complexity: "Intermediate",
    example: "/nexus:code-review review this PR for regressions",
    install: "nexus skill install review-guardian",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/code-review"
  },
  {
    name: "Refactor Strategist",
    description: "Plans incremental refactors with dependency awareness and regression containment.",
    tags: ["refactor", "planning", "testing"],
    complexity: "Advanced",
    example: "/nexus:planning refactor this service without downtime",
    install: "nexus skill install refactor-strategist",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/planning"
  },
  {
    name: "DevOps Automator",
    description: "Builds CI pipelines, release gates, and rollback-safe deployment workflows.",
    tags: ["devops", "automation", "release"],
    complexity: "Advanced",
    example: "/nexus:reliability create release rollout workflow",
    install: "nexus skill install devops-automator",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/reliability"
  },
  {
    name: "Security Sentinel",
    description: "Audits policies, permissions, and secrets exposure with least-privilege guidance.",
    tags: ["security", "iam", "guardrails"],
    complexity: "Advanced",
    example: "/nexus:reliability audit this repo for secret leaks",
    install: "nexus skill install security-sentinel",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/reliability"
  },
  {
    name: "Observability Correlator",
    description: "Finds causal chains across distributed services during cascading failures.",
    tags: ["observability", "tracing", "sre"],
    complexity: "Advanced",
    example: "/nexus:observability correlate these API failures",
    install: "nexus skill install observability-correlator",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/observability"
  },
  {
    name: "Performance Forensics",
    description: "Investigates latency, memory, and CPU regressions with blast-radius analysis.",
    tags: ["performance", "profiling", "scalability"],
    complexity: "Intermediate",
    example: "/nexus:performance optimize architecture for latency",
    install: "nexus skill install performance-forensics",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/performance"
  },
  {
    name: "Test Stabilizer",
    description: "Eliminates flaky tests using deterministic fixtures and race-condition isolation.",
    tags: ["testing", "qa", "ci"],
    complexity: "Intermediate",
    example: "/nexus:testing investigate flaky tests",
    install: "nexus skill install test-stabilizer",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/testing"
  },
  {
    name: "Token Management",
    description: "Optimizes context usage, prompt shape, and delegation depth to reduce token spend.",
    tags: ["tokens", "cost", "prompting"],
    complexity: "Beginner",
    example: "/nexus:token-saving reduce token usage for this task",
    install: "nexus skill install token-saving",
    github: "https://github.com/aayushostwal/nexus/tree/main/skills/token-saving"
  }
];

export const agentSystem = [
  {
    id: "orchestrator",
    name: "Nexus Orchestrator",
    role: "Routes tasks and coordinates agent swarms",
    command: "/nexus:orchestrator route this task",
    bestFor: "Cross-skill orchestration",
    ownership: "Task routing, handoff policy, completion synthesis"
  },
  {
    id: "architect",
    name: "Architect",
    role: "Designs structure, boundaries, and change strategy",
    command: "/nexus:architect map service boundaries",
    bestFor: "Architecture planning",
    ownership: "System design docs, dependency maps, migration plans"
  },
  {
    id: "debugger",
    name: "Debugger",
    role: "Finds root cause and applies narrow fixes",
    command: "/nexus:debugger resolve CI failure",
    bestFor: "Incident diagnosis",
    ownership: "Failure analysis, minimal patches, verification"
  },
  {
    id: "refactorer",
    name: "Refactorer",
    role: "Modernizes code safely with migration slices",
    command: "/nexus:refactorer split this module",
    bestFor: "Safe modernization",
    ownership: "Refactor plans, compatibility checks, rollout steps"
  },
  {
    id: "reviewer",
    name: "Reviewer",
    role: "Enforces quality gates and regression checks",
    command: "/nexus:reviewer review PR #428",
    bestFor: "Quality control",
    ownership: "Bug/risk findings, severity ranking, merge readiness"
  },
  {
    id: "planner",
    name: "Planner",
    role: "Builds executable implementation plans",
    command: "/nexus:planner create execution plan",
    bestFor: "Delivery planning",
    ownership: "Scope slicing, dependencies, risk mitigation"
  },
  {
    id: "devops",
    name: "DevOps Agent",
    role: "Automates pipelines, release gates, and rollbacks",
    command: "/nexus:devops generate release gate",
    bestFor: "Deployment automation",
    ownership: "CI/CD workflows, guardrails, rollback strategy"
  },
  {
    id: "infra",
    name: "Infra Agent",
    role: "Owns cloud resources, IaC, and platform topology",
    command: "/nexus:infra evaluate terraform blast radius",
    bestFor: "Platform operations",
    ownership: "Infrastructure diffs, policy checks, environment safety"
  },
  {
    id: "testing",
    name: "Testing Agent",
    role: "Continuously verifies behavior and reliability",
    command: "/nexus:testing stabilize flaky suite",
    bestFor: "Reliability verification",
    ownership: "Test diagnostics, deterministic fixes, coverage deltas"
  }
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
