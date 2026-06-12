"use client";

import { motion } from "framer-motion";
import { Bot, Database, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent, AgentColor } from "@/lib/content";

// Domain-grouped display colors from each agent's frontmatter `color` field.
// Tailwind requires literal class names, so the map is fully static.
const iconColor: Record<AgentColor, string> = {
  red: "text-red-400",
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
  pink: "text-pink-400",
  cyan: "text-cyan-300"
};

const domainBadge: Record<AgentColor, string> = {
  red: "border-red-400/40 text-red-300",
  blue: "border-blue-400/40 text-blue-300",
  green: "border-green-400/40 text-green-300",
  yellow: "border-yellow-400/40 text-yellow-300",
  purple: "border-purple-400/40 text-purple-300",
  orange: "border-orange-400/40 text-orange-300",
  pink: "border-pink-400/40 text-pink-300",
  cyan: "border-cyan-400/40 text-cyan-300"
};

export function AgentCard({ agent, step }: { agent: Agent; step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: step * 0.05 }}
    >
      <Card className="h-full border-zinc-700/80 bg-zinc-900/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className={`size-4 ${iconColor[agent.color]}`} /> {agent.name}
            </CardTitle>
            <Badge variant="outline" className={domainBadge[agent.color]}>
              {agent.domain}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-300">{agent.description}</p>
          <p className="flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-2 text-xs text-zinc-300">
            {agent.memory === "user" ? (
              <>
                <Globe className="size-3.5 shrink-0 text-zinc-400" />
                <span>
                  <span className="font-mono text-cyan-300">memory: user</span> — portable across all your repos
                </span>
              </>
            ) : (
              <>
                <Database className="size-3.5 shrink-0 text-zinc-400" />
                <span>
                  <span className="font-mono text-cyan-300">memory: project</span> — learns this repo in <span className="font-mono">.claude/agent-memory/</span>
                </span>
              </>
            )}
          </p>
          <p className="text-xs text-zinc-400">
            <span className="text-zinc-200">Tools:</span> {agent.tools}
          </p>
          <a href={agent.github} target="_blank" rel="noreferrer" className="inline-block text-xs text-cyan-300 hover:text-cyan-200">
            Source
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}
