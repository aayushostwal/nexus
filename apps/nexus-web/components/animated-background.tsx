"use client";

import { motion } from "framer-motion";

const nodes = new Array(18).fill(0).map((_, i) => ({
  id: i,
  x: (i % 6) * 18 + 5,
  y: Math.floor(i / 6) * 28 + 15
}));

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-[0.16]" />
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute size-2 rounded-full bg-cyan-300/70 shadow-neon"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
            y: [0, -8, 0]
          }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
      <svg className="absolute inset-0 h-full w-full opacity-45" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.slice(0, -1).map((node, i) => (
          <motion.line
            key={`line-${node.id}`}
            x1={node.x}
            y1={node.y}
            x2={nodes[(i + 3) % nodes.length].x}
            y2={nodes[(i + 3) % nodes.length].y}
            stroke="rgba(56,189,248,0.32)"
            strokeWidth="0.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 6 + (i % 3), repeat: Infinity, delay: i * 0.14 }}
          />
        ))}
      </svg>
    </div>
  );
}
