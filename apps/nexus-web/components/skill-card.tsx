"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Skill } from "@/lib/content";

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
      <Card className="group h-full border-zinc-700/70 bg-zinc-900/60 transition-all hover:border-cyan-400/40 hover:shadow-glow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg">{skill.name}</CardTitle>
            <Badge variant={skill.complexity === "Advanced" ? "secondary" : "default"}>{skill.complexity}</Badge>
          </div>
          <CardDescription>{skill.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[220px] flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="lowercase">
                {tag}
              </Badge>
            ))}
          </div>
          <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/70 p-3 font-mono text-xs text-cyan-200">{skill.example}</p>
          <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/70 p-3 font-mono text-xs text-zinc-200">
            Bundled with nexus@nexus-marketplace — no separate install
          </p>
          <div className="mt-auto flex items-center justify-between">
            <a href={skill.github} target="_blank" rel="noreferrer" className="text-sm text-cyan-300 hover:text-cyan-200">
              Source Code
            </a>
            <Button asChild variant="ghost" size="sm" className="text-zinc-200">
              <a href={skill.github} target="_blank" rel="noreferrer">
                Details <ArrowUpRight className="ml-1 size-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
