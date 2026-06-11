import { GripVertical } from "lucide-react";
import { ExportPreview } from "@/components/export/export-preview";
import { ExportControls } from "@/components/export/export-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getRecipes } from "@/lib/data/queries";

export default async function ExportStudioPage() {
  const [recipe] = await getRecipes();

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-6 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
      <section className="grid min-w-0 content-start gap-5">
        <div>
          <h1 className="text-3xl font-bold">Export Studio</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Build beautiful recipe cards and share your brews.</p>
        </div>
        <Card>
          <CardTitle>Workflow</CardTitle>
          <div className="mt-4 grid gap-3">
            {[
              ["1", "Recipe", recipe.title],
              ["2", "Customize", "Design your card"],
              ["3", "Format", "Choose output"]
            ].map(([step, title, sub]) => (
              <div key={step} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-white/5 p-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-black">{step}</span>
                <span>
                  <strong className="block text-sm">{title}</strong>
                  <span className="text-xs text-[var(--text-dim)]">{sub}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Content blocks</CardTitle>
          <div className="mt-4 grid gap-3">
            {["Hero", "Brew Specs", "Pouring Steps", "Notes", "Footer"].map((block, index) => (
              <label key={block} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
                <span className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-[var(--text-dim)]" aria-hidden />
                  <span>
                    <strong className="block text-sm">{block}</strong>
                    <span className="text-xs text-[var(--text-dim)]">{index < 3 ? "Shown" : "Optional"}</span>
                  </span>
                </span>
                <input type="checkbox" defaultChecked={index < 3} className="accent-[var(--accent)]" />
              </label>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid min-w-0 content-start gap-5">
        <div className="flex items-center justify-between gap-3">
          <Tabs tabs={[{ value: "mobile", label: "Mobile" }, { value: "post", label: "Post", active: true }, { value: "print", label: "Print" }]} />
          <Badge>Saved 2m ago</Badge>
        </div>
        <ExportPreview recipe={recipe} />
      </section>

      <aside className="grid min-w-0 content-start gap-5">
        <ExportControls recipe={recipe} />
      </aside>
    </div>
  );
}
