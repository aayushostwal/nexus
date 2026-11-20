import { DocsSidebar } from "@/components/docs/docs-sidebar";
import type { DocMeta } from "@/lib/docs";

export function DocumentationLayout({ docs, children }: { docs: DocMeta[]; children: React.ReactNode }) {
  return (
    <div className="nexus-container flex flex-col gap-6 py-6 lg:flex-row lg:gap-10 lg:py-10">
      <DocsSidebar docs={docs} />
      <main id="docs-content" className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
