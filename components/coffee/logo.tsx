import { Coffee } from "lucide-react";
import Link from "next/link";

export function CoffeeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Coffee Journey home">
      <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--accent)] text-[var(--accent)]">
        <Coffee aria-hidden className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text)]">Coffee</span>
          <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Journey</span>
        </span>
      ) : null}
    </Link>
  );
}
