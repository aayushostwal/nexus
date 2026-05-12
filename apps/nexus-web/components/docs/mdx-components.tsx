import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/docs/code-block";

export const mdxComponents: MDXComponents = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  h1: (props) => <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-100" {...props} />,
  h2: (props) => <h2 className="mb-3 mt-8 text-2xl font-semibold text-zinc-100" {...props} />,
  h3: (props) => <h3 className="mb-2 mt-5 text-xl font-semibold text-zinc-100" {...props} />,
  p: (props) => <p className="my-3 leading-7 text-zinc-300" {...props} />,
  ul: (props) => <ul className="my-3 list-disc space-y-1 pl-6 text-zinc-300" {...props} />,
  ol: (props) => <ol className="my-3 list-decimal space-y-1 pl-6 text-zinc-300" {...props} />,
  a: (props) => <a className="text-cyan-300 hover:text-cyan-200" {...props} />,
  code: (props) => <code className="rounded bg-zinc-800 px-1 py-0.5 text-cyan-200" {...props} />
};
