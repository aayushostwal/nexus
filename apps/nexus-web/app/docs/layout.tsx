import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { DocumentationLayout } from "@/components/docs/documentation-layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchModal } from "@/components/search-modal";
import { getAllDocs } from "@/lib/docs";
import { skills, agents } from "@/lib/content";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docs = getAllDocs();
  return (
    <div className="min-h-screen bg-background">
      <a href="#docs-content" className="sr-only z-50 rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="nexus-container flex h-16 items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"><ArrowLeft aria-hidden="true" className="size-4" /> Nexus <span className="hidden text-muted-foreground sm:inline">/ Documentation</span></Link>
          <div className="flex items-center gap-2"><BookOpen aria-hidden="true" className="hidden size-4 text-primary sm:block" /><SearchModal docs={docs} skills={skills} agents={agents} /><ThemeToggle /></div>
        </div>
      </header>
      <DocumentationLayout docs={docs}>{children}</DocumentationLayout>
    </div>
  );
}
