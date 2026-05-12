import Link from "next/link";
import { BookText, Home } from "lucide-react";
import { DocumentationLayout } from "@/components/docs/documentation-layout";
import { getAllDocs } from "@/lib/docs";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docs = getAllDocs();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="nexus-container flex h-16 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-200">
            <Home className="size-4" /> Back to Platform
          </Link>
          <p className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <BookText className="size-4 text-cyan-300" /> Nexus Documentation
          </p>
        </div>
      </header>
      <DocumentationLayout docs={docs}>{children}</DocumentationLayout>
    </div>
  );
}
