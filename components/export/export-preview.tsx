import { Clock, Droplets, Thermometer, Timer } from "lucide-react";
import Image from "next/image";
import type { Recipe } from "@/lib/domain";
import { formatDuration, formatRatio } from "@/lib/format";

export function ExportPreview({ recipe, compact = false }: { recipe: Recipe; compact?: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--accent)] bg-[#11140f] p-5"
      style={{ minHeight: compact ? 260 : 560 }}
    >
      <Image src={recipe.coverUrl} alt="" fill priority={!compact} sizes="640px" className="object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/52 to-black/20" />
      <div className="relative z-10 grid h-full content-between gap-8">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Pour over recipe</p>
          <h3 className="serif max-w-sm text-4xl leading-none md:text-6xl">{recipe.title}</h3>
          <p className="mt-3 max-w-sm text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {recipe.flavorNotes.slice(0, 3).join(" / ")}
          </p>
        </div>
        <div className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/45 p-4 text-sm">
          <PreviewMetric icon={<Droplets className="h-4 w-4" />} label="Water" value={`${recipe.waterGrams}g`} />
          <PreviewMetric icon={<CoffeeIcon />} label="Coffee" value={`${recipe.doseGrams}g`} />
          <PreviewMetric icon={<Timer className="h-4 w-4" />} label="Ratio" value={formatRatio(recipe.doseGrams, recipe.waterGrams)} />
          <PreviewMetric icon={<Thermometer className="h-4 w-4" />} label="Temp" value={`${recipe.temperatureCelsius}C`} />
          <PreviewMetric icon={<Clock className="h-4 w-4" />} label="Time" value={formatDuration(recipe.totalTimeSeconds)} />
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
