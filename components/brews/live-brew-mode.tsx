"use client";

import { Pause, Play, RotateCcw, SkipForward, Square, Volume2, VolumeX, Waves } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [timer, setTimer] = useState<PersistedTimer>({
    baseElapsed: 0,
    startedAt: null,
    running: false
  });
  const [now, setNow] = useState(0);
  const [voiceCues, setVoiceCues] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const previousStepId = useRef<string | null>(null);

  const elapsedSeconds = useMemo(() => {
    const elapsedMs =
      timer.running && timer.startedAt
        ? timer.baseElapsed * 1000 + (now - timer.startedAt)
        : timer.baseElapsed * 1000;
    return Math.min(recipe.totalTimeSeconds, Math.max(0, Math.floor(elapsedMs / 1000)));
  }, [now, recipe.totalTimeSeconds, timer]);

  const state = getBrewTimerState(recipe, elapsedSeconds);
  const progressDeg = `${state.progress * 360}deg`;
  const currentStepNumber = recipe.steps.indexOf(state.currentStep) + 1;
  const currentStepEnd =
    state.currentStep.endsAtSeconds ?? state.nextStep?.startsAtSeconds ?? recipe.totalTimeSeconds;
  const secondsInStep = Math.max(1, currentStepEnd - state.currentStep.startsAtSeconds);
  const remainingInStep = Math.max(0, currentStepEnd - elapsedSeconds);

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
    if (previousStepId.current === null) {
      previousStepId.current = state.currentStep.id;
      return;
    }

    if (previousStepId.current === state.currentStep.id) return;

    previousStepId.current = state.currentStep.id;

    if (haptics && "vibrate" in window.navigator) {
      window.navigator.vibrate([80, 40, 80]);
    }

    if (voiceCues && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        state.currentStep.cue || state.currentStep.label
      );
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }, [haptics, state.currentStep, voiceCues]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
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
    <div className="fixed inset-0 z-50 grid h-dvh touch-none place-items-center overflow-hidden bg-black px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] sm:relative sm:z-auto sm:min-h-[calc(100dvh-76px)] sm:touch-auto sm:bg-transparent sm:px-4 sm:py-6">
      <Image
        src={recipe.coverUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-black/76" />
      <section className="relative z-10 grid h-full w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] gap-3 sm:block sm:h-auto">
        <div className="flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)] sm:text-sm sm:tracking-[0.24em]">
              Live Brew
            </p>
            <h1 className="serif mt-1 truncate text-2xl sm:mt-2 sm:text-4xl">{recipe.title}</h1>
            <p className="mt-1 text-xs text-[var(--text-muted)] sm:hidden">
              {recipe.waterGrams}g water · {recipe.doseGrams}g dose ·{" "}
              {formatDuration(recipe.totalTimeSeconds)}
            </p>
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

        <div className="grid min-h-0 content-center gap-3 sm:block">
          <div
            className="mx-auto grid aspect-square w-[min(76vw,38dvh)] max-w-[620px] place-items-center rounded-full p-2 sm:w-full sm:p-3"
            style={{
              background: `conic-gradient(var(--accent) ${progressDeg}, rgba(255,255,255,.08) 0deg)`
            }}
            aria-label={`Brew progress ${Math.round(state.progress * 100)} percent`}
          >
            <div className="grid h-full w-full place-items-center rounded-full border border-[var(--border)] bg-black/58 p-5 text-center backdrop-blur sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-sm sm:tracking-[0.22em]">
                  Step {currentStepNumber} of {recipe.steps.length}
                </p>
                <h2 className="serif mt-3 text-3xl sm:mt-4 sm:text-5xl">
                  {state.currentStep.label}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-muted)] sm:mt-3 sm:text-lg">
                  {formatDuration(state.currentStep.startsAtSeconds)} -{" "}
                  {formatDuration(currentStepEnd)}
                </p>
                <p className="serif mt-3 text-6xl tabular-nums sm:mt-4 sm:text-8xl">
                  {formatDuration(elapsedSeconds)}
                </p>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-5 text-[var(--olive)] sm:mt-4 sm:text-lg sm:leading-7">
                  {state.currentStep.cue || state.currentStep.instruction}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:mt-6 sm:gap-4 md:grid-cols-2">
            <Card className="p-3 sm:p-6">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent)] sm:text-xs sm:tracking-[0.18em]">
                Next pour
              </p>
              <p className="serif mt-1 text-3xl sm:mt-2 sm:text-5xl">
                {state.nextStep?.pourGrams ?? 0}g
              </p>
              <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                at {formatDuration(state.nextStep?.startsAtSeconds ?? recipe.totalTimeSeconds)}
              </p>
            </Card>
            <Card className="p-3 sm:p-6">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent)] sm:text-xs sm:tracking-[0.18em]">
                Step left
              </p>
              <p className="serif mt-1 text-3xl tabular-nums sm:mt-2 sm:text-5xl">
                {formatDuration(remainingInStep)}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)] sm:text-sm">
                {recipe.gear[0]?.name ?? "Your setup"} · {recipe.temperatureCelsius}C
              </p>
            </Card>
          </div>
        </div>

        <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-black/50 p-3 backdrop-blur sm:mt-6 sm:flex sm:items-center sm:justify-center sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/10 sm:hidden"
            aria-label={`Step progress ${Math.round(((secondsInStep - remainingInStep) / secondsInStep) * 100)} percent`}
          >
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, ((secondsInStep - remainingInStep) / secondsInStep) * 100))}%`
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <Button
              variant={voiceCues ? "primary" : "secondary"}
              size="icon"
              aria-label={voiceCues ? "Disable voice cues" : "Enable voice cues"}
              aria-pressed={voiceCues}
              onClick={() => setVoiceCues((enabled) => !enabled)}
              icon={
                voiceCues ? (
                  <Volume2 className="h-5 w-5" aria-hidden />
                ) : (
                  <VolumeX className="h-5 w-5" aria-hidden />
                )
              }
            />
            <Button
              variant="secondary"
              size="icon"
              aria-label="Reset timer"
              onClick={reset}
              icon={<RotateCcw className="h-5 w-5" aria-hidden />}
            />
            <Button
              size="lg"
              className="h-20 w-20 rounded-full shadow-[0_16px_50px_rgba(216,155,93,0.28)] sm:h-20 sm:w-20"
              aria-label={timer.running ? "Pause" : "Resume"}
              onClick={pauseOrResume}
              icon={
                timer.running ? (
                  <Pause className="h-8 w-8" aria-hidden />
                ) : (
                  <Play className="h-8 w-8" aria-hidden />
                )
              }
            />
            <Button
              variant="secondary"
              size="icon"
              aria-label="Skip step"
              onClick={skipStep}
              disabled={!state.nextStep}
              icon={<SkipForward className="h-5 w-5" aria-hidden />}
            />
            <Button
              variant={haptics ? "primary" : "secondary"}
              size="icon"
              aria-label={haptics ? "Disable haptics" : "Enable haptics"}
              aria-pressed={haptics}
              onClick={() => setHaptics((enabled) => !enabled)}
              icon={<Waves className="h-5 w-5" aria-hidden />}
            />
          </div>
          <Link
            href={`/brews/new?recipeId=${recipe.id}`}
            className="focus-ring rounded-[var(--radius-sm)] sm:hidden"
            aria-label="End brew"
          >
            <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white/7 text-sm font-semibold text-[var(--text)] transition hover:bg-white/12">
              <Square className="h-4 w-4" aria-hidden />
              End brew
            </span>
          </Link>
          <Link
            href={`/brews/new?recipeId=${recipe.id}`}
            className="focus-ring hidden h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white/7 text-[var(--text)] transition hover:bg-white/12 sm:inline-flex"
            aria-label="End brew"
          >
            <Square className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
