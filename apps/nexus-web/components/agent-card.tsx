"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AgentCard({
  name,
  role,
  command,
  bestFor,
  ownership,
  step
}: {
  name: string;
  role: string;
  command: string;
  bestFor: string;
  ownership: string;
  step: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: step * 0.05 }}
    >
      <Card className="h-full border-zinc-700/80 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-cyan-300" /> {name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-300">{role}</p>
          <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-2 font-mono text-xs text-cyan-300">{command}</p>
          <p className="text-xs text-zinc-400">
            <span className="text-zinc-200">Best For:</span> {bestFor}
          </p>
          <p className="text-xs text-zinc-400">
            <span className="text-zinc-200">Ownership:</span> {ownership}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
