"use client";

import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  ExploreFilterFields,
  type ExploreFilterValues,
  type ExploreGearOption
} from "@/components/explore/explore-filter-fields";
import { BottomSheetFrame } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function ExploreFilterDrawer({
  values,
  grinders,
  drippers,
  processes
}: {
  values: ExploreFilterValues;
  grinders: ExploreGearOption[];
  drippers: ExploreGearOption[];
  processes: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="lg:hidden"
        aria-expanded={open}
        aria-controls="explore-filter-sheet"
        onClick={() => setOpen(true)}
        icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />}
      >
        Filters
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Explore filters"
        >
          <button
            className="absolute inset-0 bg-black/70"
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <BottomSheetFrame id="explore-filter-sheet" className="max-h-[86dvh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Explore</p>
                <h2 className="text-xl font-bold">Filters</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
                icon={<X className="h-5 w-5" aria-hidden />}
              />
            </div>
            <form action="/explore">
              <ExploreFilterFields
                values={values}
                grinders={grinders}
                drippers={drippers}
                processes={processes}
                idPrefix="mobile-filter"
              />
            </form>
          </BottomSheetFrame>
        </div>
      ) : null}
    </>
  );
}
