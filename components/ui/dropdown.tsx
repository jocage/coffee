import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function DropdownButton({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <button className="focus-ring inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 px-3 text-sm text-[var(--text-muted)]">
      {children}
      {label}
      <ChevronDown aria-hidden className="h-4 w-4" />
    </button>
  );
}
