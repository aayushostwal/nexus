"use client";

import { useMemo, useState } from "react";

type NodeType = "entry" | "decision" | "agent" | "system" | "output";

type DiagramNode = {
  id: string;
  title: string;
  subtitle: string;
  type: NodeType;
  x: number;
  y: number;
  detail: string;
};

type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  points: string;
  label?: string;
};

function getArrowPlacement(points: string) {
  const coords = points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number) as [number, number]);

  const [x2, y2] = coords[coords.length - 1] ?? [0, 0];
  const [x1, y1] = coords[coords.length - 2] ?? [x2 - 1, y2];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return {
    x: x2 - ux * -3,
    y: y2 - uy * 8,
    angle
  };
}

const nodes: DiagramNode[] = [
  {
    id: "developer-input",
    title: "Developer Input",
    subtitle: "Prompt + Context",
    type: "entry",
    x: 70,
    y: 190,
    detail: "CLI intent, repository context, and explicit constraints enter the Nexus workflow here."
  },
  {
    id: "classifier",
    title: "Classifier",
    subtitle: "Intent Detection",
    type: "decision",
    x: 250,
    y: 190,
    detail: "Parses the request and identifies whether it maps to planning, debugging, architecture, testing, or ops paths."
  },
  {
    id: "planner",
    title: "Planner Agent",
    subtitle: "Execution Plan",
    type: "agent",
    x: 440,
    y: 190,
    detail: "Builds the ordered plan, dependencies, and verification checkpoints before orchestration starts."
  },
  {
    id: "orchestrator",
    title: "Nexus Orchestrator",
    subtitle: "Routing Core",
    type: "system",
    x: 646,
    y: 190,
    detail: "Coordinates specialists, handles context handoffs, and ensures ownership boundaries are respected."
  },
  {
    id: "architect-agent",
    title: "Architect Agent",
    subtitle: "System Design",
    type: "agent",
    x: 861,
    y: 70,
    detail: "Maps modules, boundaries, and dependency flows for structural or migration-level changes."
  },
  {
    id: "debugger-agent",
    title: "Debugger Agent",
    subtitle: "Root Cause",
    type: "agent",
    x: 861,
    y: 190,
    detail: "Investigates runtime/test failures, isolates regressions, and applies minimal-risk fixes."
  },
  {
    id: "devops-agent",
    title: "DevOps Agent",
    subtitle: "Release Safety",
    type: "agent",
    x: 861,
    y: 310,
    detail: "Validates deployment readiness, infrastructure changes, and operational runbook expectations."
  },
  {
    id: "skill-loader",
    title: "Skill Loader",
    subtitle: "Task Playbooks",
    type: "system",
    x: 1078,
    y: 70,
    detail: "Resolves reusable execution patterns and domain guidance from installed skills."
  },
  {
    id: "workflow-router",
    title: "Workflow Router",
    subtitle: "Task Sequencing",
    type: "system",
    x: 1078,
    y: 190,
    detail: "Builds safe parallel/serial execution order and enforces dependency-aware flow transitions."
  },
  {
    id: "mcp-router",
    title: "MCP Tool Router",
    subtitle: "External Connectors",
    type: "system",
    x: 1078,
    y: 310,
    detail: "Routes calls to Jira, AWS, GitHub, Slack, and other MCP providers with policy constraints."
  },
  {
    id: "memory-layer",
    title: "Memory Layer",
    subtitle: "Shared Context",
    type: "system",
    x: 1276,
    y: 190,
    detail: "Persists task history, TODO state, and prior decisions to improve continuity across sessions."
  },
  {
    id: "verification",
    title: "Verification Gate",
    subtitle: "Checks + Risk",
    type: "decision",
    x: 1473,
    y: 190,
    detail: "Applies test, safety, and consistency checks before final response or deployment output."
  },
  {
    id: "deliverable",
    title: "Deliverable",
    subtitle: "Output + Next Steps",
    type: "output",
    x: 1654,
    y: 190,
    detail: "Presents implementation, findings, and optional follow-up steps in a concise handoff."
  }
];

const edges: DiagramEdge[] = [
  { id: "e1", from: "developer-input", to: "classifier", points: "140,195 179,195" },
  { id: "e2", from: "classifier", to: "planner", points: "321,195 369,195" },
  { id: "e3", from: "planner", to: "orchestrator", points: "511,195 575,195" },
  { id: "e4", from: "orchestrator", to: "architect-agent", points: "719,195 760,195 760,80 788,80" },
  { id: "e5", from: "orchestrator", to: "debugger-agent", points: "719,195 788,195" },
  { id: "e6", from: "orchestrator", to: "devops-agent", points: "719,195 760,195 760,320 788,320" },
  { id: "e7", from: "architect-agent", to: "skill-loader", points: "934,80 1005,80" },
  { id: "e8", from: "debugger-agent", to: "workflow-router", points: "934,195 1005,195" },
  { id: "e9", from: "devops-agent", to: "mcp-router", points: "934,320 1005,320" },
  { id: "e10", from: "skill-loader", to: "memory-layer", points: "1151,80 1190,80 1190,195 1203,195" },
  { id: "e11", from: "workflow-router", to: "memory-layer", points: "1151,195 1203,195" },
  { id: "e12", from: "mcp-router", to: "memory-layer", points: "1151,320 1190,320 1190,195 1203,195" },
  { id: "e13", from: "memory-layer", to: "verification", points: "1349,195 1400,195" },
  { id: "e14", from: "verification", to: "deliverable", points: "1546,195 1581,195" }
];

const typeClassMap: Record<NodeType, string> = {
  entry: "border-emerald-400/70 bg-emerald-500/10 text-emerald-100",
  decision: "border-sky-400/70 bg-sky-500/10 text-sky-100",
  agent: "border-violet-400/70 bg-violet-500/10 text-violet-100",
  system: "border-cyan-400/70 bg-cyan-500/10 text-cyan-100",
  output: "border-amber-400/70 bg-amber-500/10 text-amber-100"
};

export function ArchitectureDiagram() {
  const [selectedNode, setSelectedNode] = useState<string>("orchestrator");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const activeNode = hoveredNode ?? selectedNode;

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const node of nodes) {
      map.set(node.id, new Set<string>());
    }
    for (const edge of edges) {
      map.get(edge.from)?.add(edge.to);
      map.get(edge.to)?.add(edge.from);
    }
    return map;
  }, []);

  const activeNodeData = useMemo(() => nodes.find((node) => node.id === activeNode) ?? nodes[0], [activeNode]);

  return (
    <div className="grid gap-4 2xl:grid-cols-[1fr_320px]">
      <div className="overflow-auto rounded-2xl border border-zinc-700/80 bg-zinc-950/80 p-4">
        <div className="relative h-[470px] min-w-[1720px] rounded-xl border border-zinc-800/80 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.14),transparent_42%),radial-gradient(circle_at_85%_30%,rgba(168,85,247,0.13),transparent_35%),#09090b]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1725 470" role="presentation" aria-hidden="true">
            {edges.map((edge) => {
              const isActive = edge.from === activeNode || edge.to === activeNode;
              const { x, y, angle } = getArrowPlacement(edge.points);
              return (
                <g key={edge.id}>
                  <polyline
                    points={edge.points}
                    fill="none"
                    stroke={isActive ? "#67e8f9" : "#52525b"}
                    strokeWidth={isActive ? 3.2 : 2.1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points="-11,-7 0,0 -11,7"
                    fill={isActive ? "#67e8f9" : "#52525b"}
                    transform={`translate(${x} ${y}) rotate(${angle})`}
                  />
                </g>
              );
            })}
          </svg>

          {nodes.map((node) => {
            const isActive = node.id === activeNode;
            const isNeighbor = adjacency.get(activeNode)?.has(node.id) ?? false;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNode(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute h-[80px] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition ${typeClassMap[node.type]} ${
                  isActive ? "scale-[1.04] ring-2 ring-cyan-300/70" : isNeighbor ? "opacity-100" : "opacity-70"
                }`}
                style={{ left: node.x, top: node.y }}
                aria-pressed={selectedNode === node.id}
              >
                <p className="text-[13px] font-semibold leading-tight">{node.title}</p>
                <p className="mt-1 text-[11px] text-zinc-300">{node.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Explorer Details</p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-100">{activeNodeData.title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{activeNodeData.subtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{activeNodeData.detail}</p>
        <div className="mt-5 border-t border-zinc-700/80 pt-4">
          <p className="text-xs text-zinc-500">Interaction</p>
          <p className="mt-1 text-sm text-zinc-300">Click any node to pin details. Hover to preview connections and routing flow.</p>
        </div>
      </aside>
    </div>
  );
}
