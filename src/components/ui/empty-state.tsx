import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-tcw-line bg-white/70 p-8 text-center">
      <h2 className="text-lg font-bold text-tcw-plum">{title}</h2>
      <p className="mt-2 text-sm text-tcw-ink/70">{children}</p>
    </div>
  );
}
