"use client";

import { motion } from "framer-motion";
import { workflowStages } from "@/lib/content";

export function WorkflowGraph() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/70 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.18),transparent_40%)]" />
      <div className="relative grid gap-3 md:grid-cols-5">
        {workflowStages.map((stage, idx) => (
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-center font-mono text-sm"
          >
            {stage}
          </motion.div>
        ))}
      </div>
      <svg className="relative mt-4 h-24 w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
        {[10, 30, 50, 70].map((x, idx) => (
          <motion.path
            key={x}
            d={`M ${x} 10 L ${x + 10} 10`}
            stroke="rgba(56,189,248,0.65)"
            strokeWidth="0.8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.15 }}
          />
        ))}
      </svg>
    </div>
  );
}
