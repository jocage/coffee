export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatRatio(doseGrams: number, waterGrams: number): string {
  if (doseGrams <= 0 || waterGrams <= 0) {
    return "1:--";
  }

  const ratio = waterGrams / doseGrams;
  const formatted = Number.isInteger(ratio) ? ratio.toString() : ratio.toFixed(1);
  return `1:${formatted}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
