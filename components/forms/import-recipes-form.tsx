"use client";

import Link from "next/link";
import { Download, Loader2, Upload } from "lucide-react";
import { useFormStatus } from "react-dom";
import { importRecipesAction } from "@/lib/server-actions/recipes";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select, Textarea } from "@/components/ui/form";
import type { GearItem } from "@/lib/domain";

export function ImportRecipesForm({
  sampleRecipesJson,
  drippers,
  grinders
}: {
  sampleRecipesJson: string;
  drippers: GearItem[];
  grinders: GearItem[];
}) {
  return (
    <form action={importRecipesAction} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardTitle>Recipes JSON</CardTitle>
        <div className="mt-5">
          <Label htmlFor="recipesJson">Paste recipes</Label>
          <Textarea
            id="recipesJson"
            name="recipesJson"
            className="min-h-[560px] font-mono text-xs leading-5"
            defaultValue={sampleRecipesJson}
            spellCheck={false}
            required
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ImportSubmitButton />
          <Link href="/recipes/export" prefetch={false}>
            <Button
              type="button"
              variant="secondary"
              icon={<Download className="h-4 w-4" aria-hidden />}
            >
              Download current recipes
            </Button>
          </Link>
        </div>
        <ImportStatus />
      </Card>

      <Card>
        <CardTitle>Gear</CardTitle>
        <div className="mt-5 grid gap-4">
          <div>
            <Label htmlFor="dripperId">Dripper</Label>
            <Select id="dripperId" name="dripperId" defaultValue={drippers[0]?.id ?? ""}>
              <option value="">No dripper</option>
              {drippers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="grinderId">Grinder</Label>
            <Select id="grinderId" name="grinderId" defaultValue={grinders[0]?.id ?? ""}>
              <option value="">No grinder</option>
              {grinders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Selected gear will be attached to every recipe in this import.
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>Accepted fields</CardTitle>
        <dl className="mt-5 grid gap-4 text-sm">
          <div>
            <dt className="font-semibold">Required shape</dt>
            <dd className="mt-1 text-[var(--text-muted)]">
              Either an array of recipes or an object with a{" "}
              <code className="text-[var(--accent)]">recipes</code> array.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Recipe aliases</dt>
            <dd className="mt-1 text-[var(--text-muted)]">
              <code className="text-[var(--accent)]">dose</code>,{" "}
              <code className="text-[var(--accent)]">water</code>,
              <code className="text-[var(--accent)]">temperature</code> and{" "}
              <code className="text-[var(--accent)]">grind</code> work.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Step aliases</dt>
            <dd className="mt-1 text-[var(--text-muted)]">
              Use <code className="text-[var(--accent)]">time</code> as seconds or{" "}
              <code className="text-[var(--accent)]">m:ss</code>.
              <code className="text-[var(--accent)]">waterGrams</code> is cumulative water.
            </dd>
          </div>
        </dl>
      </Card>
    </form>
  );
}

function ImportSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      icon={
        pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Upload className="h-4 w-4" aria-hidden />
        )
      }
    >
      {pending ? "Importing..." : "Import recipes"}
    </Button>
  );
}

function ImportStatus() {
  const { pending } = useFormStatus();

  return pending ? (
    <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--accent)] bg-[var(--accent)]/10 p-3 text-sm text-[var(--text)]">
      Import is running. Keep this page open until recipes appear.
    </div>
  ) : null;
}
