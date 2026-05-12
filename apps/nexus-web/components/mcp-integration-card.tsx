import { Badge } from "@/components/ui/badge";

export function MCPIntegrationCard({ title, description, command }: { title: string; description: string; command: string }) {
  return (
    <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/50 p-4">
      <Badge className="mb-3">MCP Integration</Badge>
      <h3 className="font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
      <p className="mt-3 rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-2 font-mono text-xs text-cyan-300">{command}</p>
    </div>
  );
}
