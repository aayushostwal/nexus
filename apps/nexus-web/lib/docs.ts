import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type DocMeta = {
  title: string;
  description: string;
  slug: string[];
  category: string;
  order: number;
};

const docsRoot = path.join(process.cwd(), "content/docs");

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return fullPath.endsWith(".mdx") ? [fullPath] : [];
  });
}

export function getAllDocs(): DocMeta[] {
  const files = walk(docsRoot);
  const docs = files.map((file) => {
    const source = fs.readFileSync(file, "utf8");
    const { data } = matter(source);
    const relative = path.relative(docsRoot, file).replace(/\\.mdx$/, "");
    const slug = relative.split(path.sep);
    return {
      title: data.title as string,
      description: data.description as string,
      category: (data.category as string) ?? slug[0],
      order: (data.order as number) ?? 999,
      slug
    };
  });

  return docs.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.order - b.order;
  });
}

export function getDocBySlug(slug: string[]) {
  const fullPath = path.join(docsRoot, `${slug.join("/")}.mdx`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const source = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(source);
  return {
    content,
    meta: {
      title: data.title as string,
      description: data.description as string,
      category: data.category as string,
      order: (data.order as number) ?? 999,
      slug
    }
  };
}

export function getPrevNext(slug: string[]) {
  const all = getAllDocs();
  const current = slug.join("/");
  const idx = all.findIndex((d) => d.slug.join("/") === current);

  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null
  };
}

export function groupDocsByCategory() {
  const all = getAllDocs();
  return all.reduce<Record<string, DocMeta[]>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});
}
