"use client";

import { Pause, Play, RotateCcw, SkipForward, Square, Volume2, Waves } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Recipe } from "@/lib/domain";
import { formatDuration } from "@/lib/format";
import { getBrewTimerState } from "@/modules/brews/timer";

type PersistedTimer = {
  baseElapsed: number;
  startedAt: number | null;
  running: boolean;
};

export function LiveBrewMode({ recipe }: { recipe: Recipe }) {
  const storageKey = `coffee-journey:brew-timer:${recipe.id}`;
  const [timer, setTimer] = useState<PersistedTimer>({ baseElapsed: 0, startedAt: null, running: false });
  const [now, setNow] = useState(0);

  const elapsedSeconds = useMemo(() => {
    const elapsedMs = timer.running && timer.startedAt ? timer.baseElapsed * 1000 + (now - timer.startedAt) : timer.baseElapsed * 1000;
    return Math.min(recipe.totalTimeSeconds, Math.max(0, Math.floor(elapsedMs / 1000)));
  }, [now, recipe.totalTimeSeconds, timer]);

  const state = getBrewTimerState(recipe, elapsedSeconds);
  const progressDeg = `${state.progress * 360}deg`;

  const persist = useCallback(
    (nextTimer: PersistedTimer) => {
      setTimer(nextTimer);
      window.localStorage.setItem(storageKey, JSON.stringify(nextTimer));
    },
    [storageKey]
  );

  const pauseOrResume = useCallback(() => {
    setTimer((current) => {
      const next = current.running
        ? {
            baseElapsed: elapsedSeconds,
            startedAt: null,
            running: false
          }
        : {
            baseElapsed: elapsedSeconds,
            startedAt: Date.now(),
            running: true
          };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [elapsedSeconds, storageKey]);

  const reset = useCallback(() => {
    persist({ baseElapsed: 0, startedAt: Date.now(), running: true });
    setNow(Date.now());
  }, [persist]);

  const skipStep = useCallback(() => {
    if (!state.nextStep) return;
    persist({ baseElapsed: state.nextStep.startsAtSeconds, startedAt: Date.now(), running: true });
    setNow(Date.now());
  }, [persist, state.nextStep]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const currentTime = Date.now();
      const stored = window.localStorage.getItem(storageKey);

      if (!stored) {
        setTimer({ baseElapsed: 0, startedAt: currentTime, running: true });
        setNow(currentTime);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as PersistedTimer;
        setTimer(parsed);
        setNow(currentTime);
      } catch {
        window.localStorage.removeItem(storageKey);
        setTimer({ baseElapsed: 0, startedAt: currentTime, running: true });
        setNow(currentTime);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [storageKey]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        pauseOrResume();
      }
      if (event.key.toLowerCase() === "r") reset();
      if (event.key === "ArrowRight") skipStep();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pauseOrResume, reset, skipStep]);

  return (
    <div className="relative grid min-h-[calc(100dvh-76px)] place-items-center overflow-hidden px-4 py-6">
      <Image src={recipe.coverUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-35" />
      <div className="absolute inset-0 bg-black/70" />
      <section className="relative z-10 w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Live Brew</p>
            <h1 className="serif mt-2 text-4xl">{recipe.title}</h1>
          </div>
          <Card className="hidden grid-cols-2 gap-6 sm:grid">
            <div>
              <p className="text-2xl font-bold">{recipe.waterGrams}g</p>
              <p className="text-xs text-[var(--text-muted)]">Total water</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{recipe.doseGrams}g</p>
              <p className="text-xs text-[var(--text-muted)]">Coffee dose</p>
            </div>
          </Card>
        </div>

        <div
          className="mx-auto grid aspect-square max-w-[620px] place-items-center rounded-full p-3"
          style={{ background: `conic-gradient(var(--accent) ${progressDeg}, rgba(255,255,255,.08) 0deg)` }}
        >
          <div className="grid h-full w-full place-items-center rounded-full border border-[var(--border)] bg-black/55 p-8 text-center backdrop-blur">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Step {recipe.steps.indexOf(state.currentStep) + 1} of {recipe.steps.length}
              </p>
              <h2 className="serif mt-4 text-5xl">{state.currentStep.label}</h2>
              <p className="mt-3 text-lg text-[var(--text-muted)]">
                {formatDuration(state.currentStep.startsAtSeconds)} - {formatDuration(state.currentStep.endsAtSeconds ?? state.nextStep?.startsAtSeconds ?? recipe.totalTimeSeconds)}
              </p>
              <p className="serif mt-4 text-8xl">{formatDuration(elapsedSeconds)}</p>
              <p className="mt-4 text-lg text-[var(--olive)]">{state.currentStep.cue || state.currentStep.instruction}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Next pour</p>
            <p className="serif mt-2 text-5xl">{state.nextStep?.pourGrams ?? 0}g</p>
            <p className="text-sm text-[var(--text-muted)]">at {formatDuration(state.nextStep?.startsAtSeconds ?? recipe.totalTimeSeconds)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Target range</p>
            <p className="serif mt-2 text-5xl">{Math.max(0, (state.nextStep?.pourGrams ?? 60) - 2)}-{(state.nextStep?.pourGrams ?? 60) + 2}g</p>
            <p className="text-sm text-[var(--text-muted)]">{recipe.gear[0]?.name ?? "Your setup"} · {recipe.temperatureCelsius}C · {recipe.grindSetting}</p>
          </Card>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Button variant="secondary" size="icon" aria-label="Voice cues" icon={<Volume2 className="h-5 w-5" aria-hidden />} />
          <Button variant="secondary" size="icon" aria-label="Haptics" icon={<Waves className="h-5 w-5" aria-hidden />} />
          <Button
            size="lg"
            className="h-20 w-20 rounded-full"
            aria-label={timer.running ? "Pause" : "Resume"}
            onClick={pauseOrResume}
            icon={timer.running ? <Pause className="h-8 w-8" aria-hidden /> : <Play className="h-8 w-8" aria-hidden />}
          />
          <Button variant="secondary" size="icon" aria-label="Reset timer" onClick={reset} icon={<RotateCcw className="h-5 w-5" aria-hidden />} />
          <Button variant="secondary" size="icon" aria-label="Skip step" onClick={skipStep} disabled={!state.nextStep} icon={<SkipForward className="h-5 w-5" aria-hidden />} />
          <Link href={`/brews/new?recipeId=${recipe.id}`}>
            <Button variant="secondary" size="icon" aria-label="End brew" icon={<Square className="h-5 w-5" aria-hidden />} />
          </Link>
        </div>
      </section>
    </div>
  );
}
