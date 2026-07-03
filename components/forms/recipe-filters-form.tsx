"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/components/ui/form";
import type { BrewMethod, GearItem, Visibility } from "@/lib/domain";

type SetupFilter = "all" | "compatible";

type FilterValues = {
  q?: string;
  view: "mine" | "saved";
  visibility: Visibility | "all";
  method: BrewMethod | "all";
  dripperId: string;
  grinderId: string;
  filterId: string;
  setup: SetupFilter;
};

export function RecipeFiltersForm({
  values,
  visibilityOptions,
  methodOptions,
  drippers,
  grinders,
  filters
}: {
  values: FilterValues;
  visibilityOptions: Array<{ value: Visibility | "all"; label: string }>;
  methodOptions: Array<{ value: BrewMethod | "all"; label: string }>;
  drippers: GearItem[];
  grinders: GearItem[];
  filters: GearItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(values.q ?? "");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === (values.q ?? "")) {
      return;
    }

    const timeout = window.setTimeout(() => {
      applyFilter("q", trimmed);
    }, 450);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, values.q]);

  function applyFilter(name: keyof FilterValues | "q", value: string) {
    const params = new URLSearchParams();

    if (values.view === "saved") params.set("view", "saved");
    if ((name === "q" ? value : values.q)?.trim()) {
      params.set("q", (name === "q" ? value : (values.q ?? "")).trim());
    }

    const nextVisibility = name === "visibility" ? value : values.visibility;
    const nextMethod = name === "method" ? value : values.method;
    const nextDripperId = name === "dripperId" ? value : values.dripperId;
    const nextGrinderId = name === "grinderId" ? value : values.grinderId;
    const nextFilterId = name === "filterId" ? value : values.filterId;
    const nextSetup = name === "setup" ? value : values.setup;

    if (nextVisibility !== "all") params.set("visibility", nextVisibility);
    if (nextMethod !== "all") params.set("method", nextMethod);
    if (nextDripperId) params.set("dripperId", nextDripperId);
    if (nextGrinderId) params.set("grinderId", nextGrinderId);
    if (nextFilterId) params.set("filterId", nextFilterId);
    if (nextSetup !== "all") params.set("setup", nextSetup);

    const href = params.size > 0 ? `/recipes?${params.toString()}` : "/recipes";
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="mb-5 grid gap-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_150px_150px_180px_180px_160px_160px]">
        <Input
          value={query}
          placeholder="Search my recipes..."
          aria-label="Search recipes"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyFilter("q", query.trim());
            }
          }}
        />
        <Select
          value={values.visibility}
          aria-label="Filter recipes by visibility"
          disabled={isPending}
          onChange={(event) => applyFilter("visibility", event.target.value)}
          className="md:w-40"
        >
          {visibilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={values.method}
          aria-label="Filter recipes by method"
          disabled={isPending}
          onChange={(event) => applyFilter("method", event.target.value)}
        >
          {methodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={values.dripperId}
          aria-label="Filter recipes by dripper"
          disabled={isPending}
          onChange={(event) => applyFilter("dripperId", event.target.value)}
        >
          <option value="">Any dripper</option>
          {drippers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          value={values.grinderId}
          aria-label="Filter recipes by grinder"
          disabled={isPending}
          onChange={(event) => applyFilter("grinderId", event.target.value)}
        >
          <option value="">Any grinder</option>
          {grinders.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          value={values.filterId}
          aria-label="Filter recipes by filter"
          disabled={isPending}
          onChange={(event) => applyFilter("filterId", event.target.value)}
        >
          <option value="">Any filter</option>
          {filters.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          value={values.setup}
          aria-label="Filter recipes by setup"
          disabled={isPending}
          onChange={(event) => applyFilter("setup", event.target.value)}
        >
          <option value="all">Any setup</option>
          <option value="compatible">My setup</option>
        </Select>
      </div>
      <p
        className="flex min-h-5 items-center gap-2 text-xs text-[var(--text-muted)]"
        aria-live="polite"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Updating recipes...
          </>
        ) : (
          "Filters apply automatically."
        )}
      </p>
    </div>
  );
}
