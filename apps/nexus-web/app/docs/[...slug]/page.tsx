import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/docs/mdx-components";
import { getDocBySlug, getPrevNext } from "@/lib/docs";

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) return {};

  return {
    title: doc.meta.title,
    description: doc.meta.description
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) notFound();

  const compiled = await compileMDX({
    source: doc.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]]
      }
    }
  });

  const { prev, next } = getPrevNext(slug);

  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-4 text-xs text-zinc-500">
        <span>Docs</span> / <span className="capitalize">{doc.meta.category}</span> / <span>{doc.meta.title}</span>
      </div>
      {compiled.content}
      <div className="mt-8 grid gap-3 border-t border-zinc-700/70 pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/docs/${prev.slug.join("/")}`}
            className="rounded-lg border border-zinc-700/70 bg-zinc-900/60 p-3 text-sm text-zinc-300 hover:border-cyan-400/50"
          >
            Previous: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug.join("/")}`}
            className="rounded-lg border border-zinc-700/70 bg-zinc-900/60 p-3 text-right text-sm text-zinc-300 hover:border-cyan-400/50"
          >
            Next: {next.title}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
