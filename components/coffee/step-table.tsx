import type { RecipeStep } from "@/lib/domain";
import { formatDuration } from "@/lib/format";

export function StepTable({ steps }: { steps: RecipeStep[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-[var(--text-dim)]">
          <tr className="border-b border-[var(--border)]">
            <th className="py-3 pr-3 font-medium">Step</th>
            <th className="py-3 pr-3 font-medium">Time</th>
            <th className="py-3 pr-3 font-medium">Pour</th>
            <th className="py-3 pr-3 font-medium">Total</th>
            <th className="py-3 font-medium">Cue</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step, index) => (
            <tr key={step.id} className="border-b border-[var(--border)] last:border-b-0">
              <td className="py-3 pr-3">
                <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded bg-white/8 text-xs">{index + 1}</span>
                {step.label}
              </td>
              <td className="py-3 pr-3 text-[var(--text-muted)]">{formatDuration(step.startsAtSeconds)}</td>
              <td className="py-3 pr-3 text-[var(--text-muted)]">{step.pourGrams ? `${step.pourGrams} g` : "-"}</td>
              <td className="py-3 pr-3 text-[var(--text-muted)]">{step.cumulativeWaterGrams} g</td>
              <td className="py-3 text-[var(--text-muted)]">{step.cue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
