"use client";

import { useEffect, useId, useState } from "react";

const graph = `
graph TD
  U[Developer Input] --> C{Classifier}
  C --> P[Planner Agent]
  P --> O[Nexus Orchestrator]
  O --> A1[Architect Agent]
  O --> A2[Debugger Agent]
  O --> A3[DevOps Agent]
  A1 --> S1[(Skill Loader)]
  A2 --> S2[(Workflow Router)]
  A3 --> S3[(MCP Tool Router)]
  S1 --> M[(Memory Layer)]
  S2 --> M
  S3 --> M
  M --> V[Verification Gate]
  V --> D[Deliverable]
`;

export function ArchitectureDiagram() {
  const [svg, setSvg] = useState<string>("");
  const id = useId();

  useEffect(() => {
    let mounted = true;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        themeVariables: {
          primaryColor: "#0f172a",
          primaryTextColor: "#e2e8f0",
          primaryBorderColor: "#22d3ee",
          lineColor: "#a78bfa",
          tertiaryColor: "#111827"
        }
      });

      const { svg: output } = await mermaid.render(`nexus-${id}`, graph);
      if (mounted) setSvg(output);
    }

    render();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="h-[78vh] w-full overflow-auto rounded-2xl border border-zinc-700/80 bg-zinc-950/80 p-4">
      <div
        className="flex h-full min-w-fit items-center justify-center [&>svg]:mx-auto [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:w-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
