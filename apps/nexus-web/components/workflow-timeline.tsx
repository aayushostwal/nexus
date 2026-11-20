"use client";

import { motion } from "framer-motion";

export function WorkflowTimeline({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4">
      <h3 className="mb-3 font-semibold text-zinc-100">{title}</h3>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <motion.li
            key={step}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center gap-3 text-sm text-zinc-300"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/10 font-mono text-xs text-cyan-200">
              {i + 1}
            </span>
            {step}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
