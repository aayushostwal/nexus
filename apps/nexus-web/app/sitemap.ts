import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://nexus-agent-kit.vercel.app";
  const docs = getAllDocs().map((doc) => ({
    url: `${base}/docs/${doc.slug.join("/")}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${base}/docs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
    ...docs
  ];
}
