import { Clock, Droplets, Thermometer, Timer } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { accents, formats, type ExportBlockId, type ExportFormat } from "@/components/export/export-options";
import type { Recipe } from "@/lib/domain";
import { formatDuration, formatRatio } from "@/lib/format";

export function ExportPreview({
  recipe,
  format = formats[0],
  accent = accents[0],
  enabledBlockIds = ["hero", "specs", "steps", "footer"],
  compact = false
}: {
  recipe: Recipe;
  format?: ExportFormat;
  accent?: string;
  enabledBlockIds?: ExportBlockId[];
  compact?: boolean;
}) {
  const isTall = format.height > format.width;
  const previewHeight = compact ? 260 : isTall ? 720 : 560;
  const aspectRatio = `${format.width} / ${format.height}`;

  return (
    <div className="grid place-items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-black/20 p-4">
      <div
        className="relative w-full max-w-[680px] overflow-hidden rounded-[var(--radius-md)] border bg-[#11140f] p-5 shadow-2xl"
        style={{
          aspectRatio,
          minHeight: previewHeight,
          maxHeight: compact ? 320 : 760,
          borderColor: accent
        }}
      >
        {format.transparent ? (
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] [background-position:0_0,0_8px,8px_-8px,-8px_0] [background-size:16px_16px]" />
        ) : null}
        <Image src={recipe.coverUrl} alt="" fill priority={!compact} sizes="640px" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/52 to-black/20" />
        <div className="relative z-10 grid h-full content-between gap-5">
          <div className="grid gap-4">
            {enabledBlockIds.includes("hero") ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: accent }}>
                  {recipe.method} recipe
                </p>
                <h3 className="serif max-w-sm text-4xl leading-none md:text-6xl">{recipe.title}</h3>
                <p className="mt-3 max-w-sm text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  {recipe.flavorNotes.slice(0, 3).join(" / ")}
                </p>
              </div>
            ) : null}
            {enabledBlockIds.includes("steps") ? (
              <div className="grid max-w-sm gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/35 p-3 text-xs text-[var(--text-muted)]">
                {recipe.steps.slice(0, 3).map((step) => (
                  <div key={step.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{step.label}</span>
                    <strong className="text-[var(--text)]">{formatDuration(step.startsAtSeconds)}</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-3">
            {enabledBlockIds.includes("notes") ? (
              <p className="max-w-lg text-sm leading-6 text-[var(--text-muted)]">{recipe.description}</p>
            ) : null}
            {enabledBlockIds.includes("specs") ? (
              <div className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/45 p-4 text-sm">
                <PreviewMetric icon={<Droplets className="h-4 w-4" />} label="Water" value={`${recipe.waterGrams}g`} />
                <PreviewMetric icon={<CoffeeIcon />} label="Coffee" value={`${recipe.doseGrams}g`} />
                <PreviewMetric icon={<Timer className="h-4 w-4" />} label="Ratio" value={formatRatio(recipe.doseGrams, recipe.waterGrams)} />
                <PreviewMetric icon={<Thermometer className="h-4 w-4" />} label="Temp" value={`${recipe.temperatureCelsius}C`} />
                <PreviewMetric icon={<Clock className="h-4 w-4" />} label="Time" value={formatDuration(recipe.totalTimeSeconds)} />
              </div>
            ) : null}
            {enabledBlockIds.includes("footer") ? (
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <span style={{ color: accent }}>@{recipe.author.handle}</span>
                <span>{recipe.visibility}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="inline-flex items-center gap-2 text-[var(--text-muted)]">
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function CoffeeIcon() {
  return <span className="grid h-4 w-4 place-items-center rounded-full border border-current text-[10px]">g</span>;
}
