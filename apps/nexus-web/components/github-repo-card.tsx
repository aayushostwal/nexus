import { GitFork, Star } from "lucide-react";
import type { GitHubRepo } from "@/lib/github";

export function GitHubRepoCard({ repo }: { repo: GitHubRepo }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      className="group flex h-full flex-col rounded-xl border border-zinc-700/80 bg-zinc-900/50 p-4 transition hover:border-cyan-400/50"
    >
      <h3 className="font-semibold text-zinc-100 group-hover:text-cyan-300">{repo.name}</h3>
      <p className="mt-2 text-sm text-zinc-400">{repo.description ?? "No description yet."}</p>
      <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5" /> {repo.stargazers_count}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3.5" /> {repo.forks_count}
        </span>
        <span className="rounded-full border border-zinc-700/80 px-2 py-0.5">{repo.language ?? "N/A"}</span>
      </div>
    </a>
  );
}
