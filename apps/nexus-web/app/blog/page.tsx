import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engineering Blog",
  description: "Nexus release notes, architecture deep dives, and workflow patterns."
};

export default function BlogPage() {
  return (
    <div className="nexus-container py-20">
      <h1 className="text-4xl font-semibold text-zinc-100">Nexus Engineering Blog</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">
        Blog-ready route scaffold for release notes, architecture deep dives, and agent workflow playbooks.
      </p>
    </div>
  );
}
