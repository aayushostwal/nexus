"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

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
  const { resolvedTheme } = useTheme();
  const mermaidTheme = resolvedTheme === "light" ? "default" : "dark";

  useEffect(() => {
    let mounted = true;
    const themeVariables =
      mermaidTheme === "dark"
        ? {
            primaryColor: "#0f172a",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#22d3ee",
            lineColor: "#a78bfa",
            tertiaryColor: "#111827"
          }
        : {
            primaryColor: "#f8fafc",
            primaryTextColor: "#0f172a",
            primaryBorderColor: "#0ea5e9",
            lineColor: "#7c3aed",
            tertiaryColor: "#e2e8f0"
          };

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        securityLevel: "loose",
        themeVariables
      });

      const { svg: output } = await mermaid.render(`nexus-${id}`, graph);
      if (mounted) setSvg(output);
    }

    render();

    return () => {
      mounted = false;
    };
  }, [id, mermaidTheme]);

  return (
    <div className="h-[60vh] w-full overflow-auto rounded-2xl border border-zinc-700/80 bg-zinc-950/80 p-4 sm:h-[78vh]">
      <div
        className="flex h-full min-w-fit items-center justify-center [&>svg]:mx-auto [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:w-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
