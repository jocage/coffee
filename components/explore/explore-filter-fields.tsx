import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import type { BrewMethod, Recipe, Visibility } from "@/lib/domain";

export const exploreMethods: Array<BrewMethod | "all"> = [
  "all",
  "V60",
  "Origami",
  "Kalita",
  "AeroPress",
  "Espresso",
  "French Press",
  "Switch"
];
export const exploreVisibilities: Array<Visibility | "all"> = [
  "all",
  "public",
  "followers",
  "unlisted",
  "private"
];
export const exploreRoastLevels = [
  "all",
  "light",
  "medium-light",
  "medium",
  "medium-dark",
  "dark"
] as const;
export const exploreDifficulties: Array<Recipe["difficulty"] | "all"> = [
  "all",
  "beginner",
  "intermediate",
  "advanced"
];

export type ExploreFilterValues = {
  q?: string;
  tab?: string;
  method: BrewMethod | "all";
  visibility: Visibility | "all";
  doseMin?: string;
  doseMax?: string;
  waterMin?: string;
  waterMax?: string;
  ratioMin?: string;
  ratioMax?: string;
  temperatureMin?: string;
  temperatureMax?: string;
  timeMax?: string;
  grinder?: string;
  dripper?: string;
  roastLevel?: string;
  process?: string;
  flavor?: string;
  difficulty?: Recipe["difficulty"] | "all";
  worksWithSetup?: boolean;
};

export type ExploreGearOption = {
  id: string;
  label: string;
};

export function ExploreFilterFields({
  values,
  grinders,
  drippers,
  processes,
  idPrefix
}: {
  values: ExploreFilterValues;
  grinders: ExploreGearOption[];
  drippers: ExploreGearOption[];
  processes: string[];
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 text-sm">
      <input type="hidden" name="tab" value={values.tab ?? "recipes"} />
      <div>
        <Label htmlFor={`${idPrefix}-q`}>Search</Label>
        <Input
          id={`${idPrefix}-q`}
          name="q"
          defaultValue={values.q}
          placeholder="Recipe, author, flavor note"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-method`}>Method</Label>
          <Select id={`${idPrefix}-method`} name="method" defaultValue={values.method}>
            {exploreMethods.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All methods" : item}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-visibility`}>Visibility</Label>
          <Select id={`${idPrefix}-visibility`} name="visibility" defaultValue={values.visibility}>
            {exploreVisibilities.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All visibility" : item}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <RangeFields
        idPrefix={idPrefix}
        label="Dose"
        minName="doseMin"
        maxName="doseMax"
        minValue={values.doseMin}
        maxValue={values.doseMax}
        unit="g"
      />
      <RangeFields
        idPrefix={idPrefix}
        label="Water"
        minName="waterMin"
        maxName="waterMax"
        minValue={values.waterMin}
        maxValue={values.waterMax}
        unit="g"
      />
      <RangeFields
        idPrefix={idPrefix}
        label="Ratio"
        minName="ratioMin"
        maxName="ratioMax"
        minValue={values.ratioMin}
        maxValue={values.ratioMax}
        unit="1:x"
      />
      <RangeFields
        idPrefix={idPrefix}
        label="Temperature"
        minName="temperatureMin"
        maxName="temperatureMax"
        minValue={values.temperatureMin}
        maxValue={values.temperatureMax}
        unit="C"
      />
      <div>
        <Label htmlFor={`${idPrefix}-timeMax`}>Max brew time</Label>
        <Input
          id={`${idPrefix}-timeMax`}
          name="timeMax"
          type="number"
          min="1"
          step="1"
          defaultValue={values.timeMax}
          placeholder="180 seconds"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-grinder`}>Grinder</Label>
          <Select id={`${idPrefix}-grinder`} name="grinder" defaultValue={values.grinder ?? "all"}>
            <option value="all">Any grinder</option>
            {grinders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-dripper`}>Dripper</Label>
          <Select id={`${idPrefix}-dripper`} name="dripper" defaultValue={values.dripper ?? "all"}>
            <option value="all">Any dripper</option>
            {drippers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-roastLevel`}>Roast</Label>
          <Select
            id={`${idPrefix}-roastLevel`}
            name="roastLevel"
            defaultValue={values.roastLevel ?? "all"}
          >
            {exploreRoastLevels.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All roasts" : item}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-process`}>Process</Label>
          <Select id={`${idPrefix}-process`} name="process" defaultValue={values.process ?? "all"}>
            <option value="all">All processes</option>
            {processes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-difficulty`}>Difficulty</Label>
          <Select
            id={`${idPrefix}-difficulty`}
            name="difficulty"
            defaultValue={values.difficulty ?? "all"}
          >
            {exploreDifficulties.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All levels" : item}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-flavor`}>Flavor notes</Label>
          <Input
            id={`${idPrefix}-flavor`}
            name="flavor"
            defaultValue={values.flavor}
            placeholder="citrus, cocoa"
          />
        </div>
      </div>
      <label className="focus-within:outline-accent flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3 text-sm">
        <input
          type="checkbox"
          name="worksWithSetup"
          value="1"
          defaultChecked={values.worksWithSetup}
          className="mt-1 accent-[var(--accent)]"
        />
        <span>
          <span className="block font-semibold text-[var(--text)]">Works with my setup</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
            Match recipes to gear marked as default for the recipe method.
          </span>
        </span>
      </label>
      <div className="flex gap-2">
        <Button
          type="submit"
          className="flex-1"
          icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />}
        >
          Apply filters
        </Button>
        <Link
          href={`/explore?tab=${values.tab ?? "recipes"}`}
          className="focus-ring inline-flex h-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white/7 px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-white/12"
        >
          Reset
        </Link>
      </div>
    </div>
  );
}

function RangeFields({
  idPrefix,
  label,
  minName,
  maxName,
  minValue,
  maxValue,
  unit
}: {
  idPrefix: string;
  label: string;
  minName: string;
  maxName: string;
  minValue?: string;
  maxValue?: string;
  unit: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input
          id={`${idPrefix}-${minName}`}
          name={minName}
          type="number"
          step="any"
          defaultValue={minValue}
          placeholder={`Min ${unit}`}
          aria-label={`${label} minimum`}
        />
        <Input
          id={`${idPrefix}-${maxName}`}
          name={maxName}
          type="number"
          step="any"
          defaultValue={maxValue}
          placeholder={`Max ${unit}`}
          aria-label={`${label} maximum`}
        />
      </div>
    </div>
  );
}

export function CompactExploreSearch({ values }: { values: ExploreFilterValues }) {
  return (
    <form className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto]" action="/explore">
      <input type="hidden" name="tab" value={values.tab ?? "recipes"} />
      <Input
        name="q"
        defaultValue={values.q}
        placeholder="Search recipes, people, flavor notes..."
        aria-label="Search explore"
      />
      <Select
        name="method"
        defaultValue={values.method}
        aria-label="Filter by brew method"
        className="md:w-44"
      >
        {exploreMethods.map((item) => (
          <option key={item} value={item}>
            {item === "all" ? "All methods" : item}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" icon={<Search className="h-4 w-4" aria-hidden />}>
        Search
      </Button>
    </form>
  );
}
