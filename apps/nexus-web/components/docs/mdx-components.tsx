import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/docs/code-block";

export const mdxComponents: MDXComponents = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  h1: (props) => <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl" {...props} />,
  h2: (props) => <h2 className="mb-4 mt-10 text-2xl font-semibold tracking-tight text-foreground" {...props} />,
  h3: (props) => <h3 className="mb-3 mt-7 text-lg font-semibold text-foreground" {...props} />,
  p: (props) => <p className="my-4 leading-7 text-muted-foreground" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-5 leading-7 text-muted-foreground" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground" {...props} />,
  a: (props) => <a className="font-medium text-primary underline decoration-primary/40 hover:decoration-primary" {...props} />,
  code: (props) => <code {...props} />,
  table: (props) => <div tabIndex={0} role="region" aria-label="Documentation table" className="my-5 overflow-x-auto rounded-lg border border-border"><table {...props} className="!my-0" /></div>,
};
