import type { TasteProfile } from "@/lib/domain";

const labels: Array<keyof TasteProfile> = ["sweetness", "acidity", "body", "balance", "finish"];

export function TasteRadar({ profile }: { profile: TasteProfile }) {
  return (
    <div className="grid gap-3">
      {labels.map((label) => (
        <div key={label} className="grid grid-cols-[88px_1fr_38px] items-center gap-3 text-sm">
          <span className="capitalize text-[var(--text-muted)]">{label}</span>
          <span className="h-2 rounded-full bg-white/8">
            <span
              className="block h-2 rounded-full bg-[var(--olive)]"
              style={{ width: `${profile[label]}%` }}
            />
          </span>
          <span className="text-right text-xs text-[var(--text-dim)]">{profile[label]}</span>
        </div>
      ))}
    </div>
  );
}
