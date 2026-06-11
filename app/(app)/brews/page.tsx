import { BrewLogCard } from "@/components/coffee/brew-log-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getBrewLogs } from "@/lib/data/queries";

export default async function BrewLogsPage() {
  const logs = await getBrewLogs();

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold">Brew Logs</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Timeline of actual brews with ratings and deltas.</p>
      </div>
      <Tabs
        className="mb-5"
        tabs={[
          { value: "all", label: "All", active: true },
          { value: "v60", label: "V60" },
          { value: "rating", label: "High rating" },
          { value: "month", label: "This month" }
        ]}
      />
      <Card>
        <CardTitle>June 2026</CardTitle>
        <div className="mt-4 grid gap-3">
          {logs.map((log) => (
            <BrewLogCard key={log.id} brewLog={log} />
          ))}
        </div>
      </Card>
    </div>
  );
}
