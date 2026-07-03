import { Loader2 } from "lucide-react";

export default function RecipesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
      <div className="mb-5 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Updating recipes...
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_150px_150px_180px_180px_160px_160px]">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-11 animate-pulse rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}
