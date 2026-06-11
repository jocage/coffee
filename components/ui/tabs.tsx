import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/format";

type Tab = {
  value: string;
  label: string;
  active?: boolean;
  icon?: ReactNode;
  href?: string;
};

export function Tabs({ tabs, className }: { tabs: Tab[]; className?: string }) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-none", className)} role="tablist">
      {tabs.map((tab) => {
        const className = cn(
          "focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition",
          tab.active
            ? "border-[var(--accent)] bg-[var(--accent)] text-black"
            : "border-[var(--border)] bg-white/5 text-[var(--text-muted)] hover:text-[var(--text)]"
        );

        if (tab.href) {
          return (
            <Link key={tab.value} href={tab.href} className={className} role="tab" aria-selected={Boolean(tab.active)}>
              {tab.icon}
              {tab.label}
            </Link>
          );
        }

        return (
          <button key={tab.value} className={className} role="tab" aria-selected={Boolean(tab.active)}>
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
