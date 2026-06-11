"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import type { RecipeStep } from "@/lib/domain";

type EditableStep = Pick<RecipeStep, "label" | "startsAtSeconds" | "pourGrams" | "cumulativeWaterGrams" | "instruction"> & {
  key: string;
};

export function RecipeStepEditor({ steps }: { steps?: RecipeStep[] }) {
  const [items, setItems] = useState<EditableStep[]>(
    steps && steps.length > 0
      ? steps.map((step) => ({ ...step, key: step.id }))
      : [
          {
            key: crypto.randomUUID(),
            label: "Bloom",
            startsAtSeconds: 0,
            pourGrams: 40,
            cumulativeWaterGrams: 40,
            instruction: "Saturate all grounds with a gentle spiral."
          }
        ]
  );

  function updateStep(index: number, patch: Partial<EditableStep>) {
    setItems((current) => current.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step)));
  }

  function addStep() {
    setItems((current) => {
      const last = current[current.length - 1];
      return [
        ...current,
        {
          key: crypto.randomUUID(),
          label: `Pour ${current.length}`,
          startsAtSeconds: (last?.startsAtSeconds ?? 0) + 45,
          pourGrams: 60,
          cumulativeWaterGrams: (last?.cumulativeWaterGrams ?? 0) + 60,
          instruction: "Pour steadily and keep the bed level."
        }
      ];
    });
  }

  function removeStep(index: number) {
    setItems((current) => (current.length === 1 ? current : current.filter((_, stepIndex) => stepIndex !== index)));
  }

  function moveStep(index: number, direction: -1 | 1) {
    setItems((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return (
    <div className="mt-5 grid gap-4">
      {items.map((step, index) => (
        <div key={step.key} className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--accent)]">Step {index + 1}</p>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" aria-label={`Move step ${index + 1} up`} disabled={index === 0} onClick={() => moveStep(index, -1)} icon={<ArrowUp className="h-4 w-4" aria-hidden />} />
              <Button type="button" variant="ghost" size="icon" aria-label={`Move step ${index + 1} down`} disabled={index === items.length - 1} onClick={() => moveStep(index, 1)} icon={<ArrowDown className="h-4 w-4" aria-hidden />} />
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove step ${index + 1}`} disabled={items.length === 1} onClick={() => removeStep(index)} icon={<Trash2 className="h-4 w-4" aria-hidden />} />
            </div>
          </div>
          <div>
            <Label htmlFor={`stepLabel-${step.key}`}>Step label</Label>
            <Input id={`stepLabel-${step.key}`} name="stepLabel" value={step.label} onChange={(event) => updateStep(index, { label: event.currentTarget.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`stepStartsAtSeconds-${step.key}`}>Start</Label>
              <Input id={`stepStartsAtSeconds-${step.key}`} name="stepStartsAtSeconds" type="number" value={step.startsAtSeconds} onChange={(event) => updateStep(index, { startsAtSeconds: Number(event.currentTarget.value) })} />
            </div>
            <div>
              <Label htmlFor={`stepPourGrams-${step.key}`}>Pour</Label>
              <Input id={`stepPourGrams-${step.key}`} name="stepPourGrams" type="number" value={step.pourGrams ?? 0} onChange={(event) => updateStep(index, { pourGrams: Number(event.currentTarget.value) })} />
            </div>
            <div>
              <Label htmlFor={`stepCumulativeWaterGrams-${step.key}`}>Total</Label>
              <Input id={`stepCumulativeWaterGrams-${step.key}`} name="stepCumulativeWaterGrams" type="number" value={step.cumulativeWaterGrams} onChange={(event) => updateStep(index, { cumulativeWaterGrams: Number(event.currentTarget.value) })} />
            </div>
          </div>
          <div>
            <Label htmlFor={`stepInstruction-${step.key}`}>Instruction</Label>
            <Textarea id={`stepInstruction-${step.key}`} name="stepInstruction" value={step.instruction} onChange={(event) => updateStep(index, { instruction: event.currentTarget.value })} />
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={addStep}>
        Add step
      </Button>
    </div>
  );
}
