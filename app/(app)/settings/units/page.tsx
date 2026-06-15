import { saveUnitsAction } from "@/lib/server-actions/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/form";
import { getCurrentUser } from "@/lib/data/queries";

export default async function SettingsUnitsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit Settings</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Choose how brew weights, temperatures and extraction ratios are displayed.
          </p>
        </div>
        <Badge>{unitSummary(user.weightUnit, user.temperatureUnit, user.ratioStyle)}</Badge>
      </div>

      {params.saved ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-[var(--olive)]"
        >
          Unit settings saved.
        </p>
      ) : null}

      <Card>
        <CardTitle>Display preferences</CardTitle>
        <form action={saveUnitsAction} className="mt-5 grid gap-5">
          <div>
            <Label htmlFor="weightUnit">Weight unit</Label>
            <Select id="weightUnit" name="weightUnit" defaultValue={user.weightUnit}>
              <option value="grams">Grams</option>
              <option value="ounces">Ounces</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="temperatureUnit">Temperature unit</Label>
            <Select id="temperatureUnit" name="temperatureUnit" defaultValue={user.temperatureUnit}>
              <option value="celsius">Celsius</option>
              <option value="fahrenheit">Fahrenheit</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="ratioStyle">Ratio style</Label>
            <Select id="ratioStyle" name="ratioStyle" defaultValue={user.ratioStyle}>
              <option value="brew_ratio">Brew ratio</option>
              <option value="percent">Percent strength</option>
            </Select>
          </div>

          <Button type="submit">Save units</Button>
        </form>
      </Card>
    </div>
  );
}

function unitSummary(weightUnit: string, temperatureUnit: string, ratioStyle: string) {
  const weight = weightUnit === "ounces" ? "oz" : "g";
  const temperature = temperatureUnit === "fahrenheit" ? "F" : "C";
  const ratio = ratioStyle === "percent" ? "%" : "1:x";

  return `${weight} / ${temperature} / ${ratio}`;
}
