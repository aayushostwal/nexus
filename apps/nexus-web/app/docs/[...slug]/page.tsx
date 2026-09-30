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
    <article className="prose max-w-none">
      <div className="mb-5 text-xs text-muted-foreground">
        <span>Docs</span> / <span className="capitalize">{doc.meta.category}</span> / <span>{doc.meta.title}</span>
      </div>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{doc.meta.title}</h1>
      {doc.meta.description ? <p className="mb-8 text-muted-foreground">{doc.meta.description}</p> : null}
      {compiled.content}
      <div className="mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/docs/${prev.slug.join("/")}`}
            className="rounded-xl border border-border bg-background p-4 text-sm text-foreground no-underline hover:border-primary/50"
          >
            Previous: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug.join("/")}`}
            className="rounded-xl border border-border bg-background p-4 text-right text-sm text-foreground no-underline hover:border-primary/50"
          >
            Next: {next.title}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
