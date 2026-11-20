export type GitHubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
};

export async function getGitHubRepos() {
  try {
    const res = await fetch("https://api.github.com/users/aayushostwal/repos?sort=updated&per_page=12", {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repos = (await res.json()) as GitHubRepo[];
    return repos;
  } catch {
    return [] as GitHubRepo[];
  }
}

export async function getGitHubActivity() {
  try {
    const res = await fetch("https://api.github.com/users/aayushostwal/events/public?per_page=8", {
      next: { revalidate: 1800 },
      headers: { Accept: "application/vnd.github+json" }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch activity");
    }

    return (await res.json()) as Array<{ id: string; type: string; repo: { name: string }; created_at: string }>;
  } catch {
    return [] as Array<{ id: string; type: string; repo: { name: string }; created_at: string }>;
  }
}
