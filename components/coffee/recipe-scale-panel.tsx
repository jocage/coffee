"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { StepTable } from "@/components/coffee/step-table";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import type { Recipe } from "@/lib/domain";
import { formatDuration, formatRatio } from "@/lib/format";
import { calculateRatio, scaleRecipeSteps } from "@/modules/recipes/recipe-math";

export function RecipeScalePanel({ recipe }: { recipe: Recipe }) {
  const originalRatio = calculateRatio(recipe.doseGrams, recipe.waterGrams) || recipe.ratio || 15;
  const [doseGrams, setDoseGrams] = useState(recipe.doseGrams);
  const [waterGrams, setWaterGrams] = useState(recipe.waterGrams);
  const [ratio, setRatio] = useState(originalRatio);

  const scaledSteps = useMemo(
    () => scaleRecipeSteps(recipe.steps, recipe.waterGrams, waterGrams),
    [recipe.steps, recipe.waterGrams, waterGrams]
  );

  function updateDose(nextDose: number) {
    const dose = clamp(nextDose, 1, 80);
    setDoseGrams(dose);
    setWaterGrams(Math.round(dose * ratio));
  }

  function updateWater(nextWater: number) {
    const water = clamp(nextWater, 1, 1500);
    setWaterGrams(water);
    setDoseGrams(roundOne(water / ratio));
  }

  function updateRatio(nextRatio: number) {
    const targetRatio = clamp(nextRatio, 1, 30);
    setRatio(targetRatio);
    setWaterGrams(Math.round(doseGrams * targetRatio));
  }

  function reset() {
    setDoseGrams(recipe.doseGrams);
    setWaterGrams(recipe.waterGrams);
    setRatio(originalRatio);
  }

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Adapt recipe</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="h-4 w-4" aria-hidden />}
          onClick={reset}
        >
          Reset
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor="scaled-dose">Coffee</Label>
          <Input
            id="scaled-dose"
            type="number"
            min="1"
            max="80"
            step="0.1"
            value={doseGrams}
            onChange={(event) => updateDose(Number(event.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="scaled-water">Water</Label>
          <Input
            id="scaled-water"
            type="number"
            min="1"
            max="1500"
            step="1"
            value={waterGrams}
            onChange={(event) => updateWater(Number(event.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="scaled-ratio">Ratio 1:</Label>
          <Input
            id="scaled-ratio"
            type="number"
            min="1"
            max="30"
            step="0.1"
            value={ratio}
            onChange={(event) => updateRatio(Number(event.target.value))}
          />
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        {[
          ["Coffee", `${doseGrams}g`],
          ["Water", `${waterGrams}g`],
          ["Ratio", formatRatio(doseGrams, waterGrams)],
          ["Time", formatDuration(recipe.totalTimeSeconds)]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[var(--radius-sm)] bg-white/5 p-3">
            <dt className="text-xs text-[var(--text-dim)]">{label}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5">
        <StepTable steps={scaledSteps} />
      </div>
    </Card>
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}
