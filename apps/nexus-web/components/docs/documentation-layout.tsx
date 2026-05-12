import { DocsSidebar } from "@/components/docs/docs-sidebar";
import type { DocMeta } from "@/lib/docs";

export function DocumentationLayout({ docs, children }: { docs: DocMeta[]; children: React.ReactNode }) {
  return (
    <div className="nexus-container flex gap-6 py-8">
      <DocsSidebar docs={docs} />
      <main className="min-w-0 flex-1 rounded-xl border border-zinc-700/70 bg-zinc-900/40 p-6">{children}</main>
    </div>
  );
}
