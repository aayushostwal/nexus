"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AgentCard({ name, role, step }: { name: string; role: string; step: number }) {
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
        <CardContent>
          <p className="text-sm text-zinc-300">{role}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
