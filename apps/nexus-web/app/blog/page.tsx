import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engineering Blog",
  description: "Nexus architecture deep dives and workflow patterns."
};

export default function BlogPage() {
  return (
    <div className="nexus-container py-20">
      <h1 className="text-4xl font-semibold text-foreground">Nexus Engineering Blog</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Notes on how these skills, agents, and workflows are built and used.
      </p>
    </div>
  );
}
