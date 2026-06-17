import { ArrowRight, GitCompareArrows } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import type { Recipe, RecipeStep } from "@/lib/domain";
import { formatDuration, formatRatio } from "@/lib/format";

type DiffStatus = "same" | "changed" | "added" | "removed";

type StepDiff = {
  index: number;
  status: DiffStatus;
  original?: RecipeStep;
  remix?: RecipeStep;
};

export function RecipeRemixDiff({ remix, original }: { remix: Recipe; original: Recipe }) {
  const parameterDiffs = getParameterDiffs(original, remix);
  const stepDiffs = getStepDiffs(original.steps, remix.steps);
  const changedSteps = stepDiffs.filter((step) => step.status !== "same");

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Remix diff</CardTitle>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Based on <span className="font-semibold text-[var(--text)]">{original.title}</span> by @{original.author.handle}.
          </p>
        </div>
        <Badge className="gap-1 text-[var(--accent)]">
          <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
          {parameterDiffs.filter((item) => item.changed).length + changedSteps.length} changes
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {parameterDiffs.map((item) => (
          <div key={item.label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-dim)]">{item.label}</p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className={item.changed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-muted)]"}>{item.original}</span>
              {item.changed ? (
                <>
                  <ArrowRight className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                  <strong>{item.remix}</strong>
                </>
              ) : (
                <Badge>same</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-[var(--text-dim)]">
            <tr className="border-b border-[var(--border)]">
              <th className="py-3 pr-3 font-medium">Step</th>
              <th className="py-3 pr-3 font-medium">Original</th>
              <th className="py-3 pr-3 font-medium">Remix</th>
              <th className="py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {stepDiffs.map((item) => (
              <tr key={item.index} className="border-b border-[var(--border)] last:border-b-0">
                <td className="py-3 pr-3 text-[var(--text-muted)]">Step {item.index + 1}</td>
                <td className="py-3 pr-3">{item.original ? formatStep(item.original) : "-"}</td>
                <td className="py-3 pr-3">{item.remix ? formatStep(item.remix) : "-"}</td>
                <td className="py-3">
                  <Badge className={statusClassName(item.status)}>{item.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function getParameterDiffs(original: Recipe, remix: Recipe) {
  return [
    {
      label: "Dose",
      original: `${original.doseGrams}g`,
      remix: `${remix.doseGrams}g`,
      changed: original.doseGrams !== remix.doseGrams
    },
    {
      label: "Water",
      original: `${original.waterGrams}g`,
      remix: `${remix.waterGrams}g`,
      changed: original.waterGrams !== remix.waterGrams
    },
    {
      label: "Ratio",
      original: formatRatio(original.doseGrams, original.waterGrams),
      remix: formatRatio(remix.doseGrams, remix.waterGrams),
      changed: original.doseGrams !== remix.doseGrams || original.waterGrams !== remix.waterGrams
    },
    {
      label: "Temperature",
      original: `${original.temperatureCelsius}C`,
      remix: `${remix.temperatureCelsius}C`,
      changed: original.temperatureCelsius !== remix.temperatureCelsius
    },
    {
      label: "Grind",
      original: original.grindSetting || original.grindLabel,
      remix: remix.grindSetting || remix.grindLabel,
      changed: original.grindLabel !== remix.grindLabel || original.grindSetting !== remix.grindSetting
    },
    {
      label: "Time",
      original: formatDuration(original.totalTimeSeconds),
      remix: formatDuration(remix.totalTimeSeconds),
      changed: original.totalTimeSeconds !== remix.totalTimeSeconds
    }
  ];
}

function getStepDiffs(originalSteps: RecipeStep[], remixSteps: RecipeStep[]): StepDiff[] {
  const count = Math.max(originalSteps.length, remixSteps.length);

  return Array.from({ length: count }, (_, index) => {
    const original = originalSteps[index];
    const remix = remixSteps[index];

    if (!original && remix) return { index, status: "added", remix };
    if (original && !remix) return { index, status: "removed", original };

    return {
      index,
      original,
      remix,
      status: areStepsEqual(original, remix) ? "same" : "changed"
    };
  });
}

function areStepsEqual(original?: RecipeStep, remix?: RecipeStep) {
  if (!original || !remix) return false;

  return (
    original.label === remix.label &&
    original.startsAtSeconds === remix.startsAtSeconds &&
    original.pourGrams === remix.pourGrams &&
    original.cumulativeWaterGrams === remix.cumulativeWaterGrams &&
    original.instruction === remix.instruction
  );
}

function formatStep(step: RecipeStep) {
  const pour = step.pourGrams ? `${step.pourGrams}g pour` : "no pour";
  return `${formatDuration(step.startsAtSeconds)} - ${step.label}, ${pour}, ${step.cumulativeWaterGrams}g total`;
}

function statusClassName(status: DiffStatus) {
  if (status === "changed") return "border-[var(--accent)] text-[var(--accent)]";
  if (status === "added") return "border-[var(--success)] text-[var(--success)]";
  if (status === "removed") return "border-[var(--danger)] text-[var(--danger)]";
  return "";
}
