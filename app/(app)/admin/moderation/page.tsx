import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CheckCircle2, CircleDashed, ExternalLink, EyeOff, ShieldAlert, XCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { getContentReports, getCurrentUser } from "@/lib/data/queries";
import { hideReportedContentAction, updateReportStatusAction } from "@/lib/server-actions/social";
import type { ContentReport } from "@/lib/domain";
import { isAdminProfile } from "@/lib/permissions/admin";

type SearchParams = { status?: ContentReport["status"] | "all" };

export default async function ModerationPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { status = "open" } = await searchParams;
  const user = await getCurrentUser();

  if (!isAdminProfile(user)) {
    notFound();
  }

  const reports = await getContentReports(status);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <ShieldAlert className="h-7 w-7 text-[var(--accent)]" aria-hidden />
            Moderation
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Review reported recipes, brew logs, comments and collections.</p>
        </div>
        <Badge>{reports.length} reports</Badge>
      </div>
      <Tabs
        className="mb-5"
        tabs={[
          { value: "open", label: "Open", active: status === "open", href: "/admin/moderation?status=open" },
          { value: "reviewing", label: "Reviewing", active: status === "reviewing", href: "/admin/moderation?status=reviewing" },
          { value: "resolved", label: "Resolved", active: status === "resolved", href: "/admin/moderation?status=resolved" },
          { value: "dismissed", label: "Dismissed", active: status === "dismissed", href: "/admin/moderation?status=dismissed" },
          { value: "all", label: "All", active: status === "all", href: "/admin/moderation?status=all" }
        ]}
      />
      {reports.length === 0 ? (
        <Card>
          <CardTitle>No reports</CardTitle>
          <p className="mt-2 text-sm text-[var(--text-muted)]">There is nothing waiting in this moderation queue.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{report.status}</Badge>
                    <Badge>{report.reason}</Badge>
                    <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-dim)]">{report.targetType}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{report.targetId}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{report.details || "No details provided."}</p>
                </div>
                <Link href={targetHref(report)} aria-label="Open reported content">
                  <Button variant="secondary" size="sm" icon={<ExternalLink className="h-4 w-4" aria-hidden />}>Open target</Button>
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
                <div className="flex items-center gap-2">
                  <Avatar src={report.reporter.avatarUrl} alt={report.reporter.displayName} size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{report.reporter.displayName}</p>
                    <p className="text-xs text-[var(--text-dim)]">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(report.createdAt))}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusForm id={report.id} status="reviewing" label="Reviewing" icon={<CircleDashed className="h-4 w-4" aria-hidden />} />
                  <StatusForm id={report.id} status="resolved" label="Resolve" icon={<CheckCircle2 className="h-4 w-4" aria-hidden />} />
                  <StatusForm id={report.id} status="dismissed" label="Dismiss" icon={<XCircle className="h-4 w-4" aria-hidden />} />
                  <HideContentForm id={report.id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusForm({
  id,
  status,
  label,
  icon
}: {
  id: string;
  status: Exclude<ContentReport["status"], "open">;
  label: string;
  icon: ReactNode;
}) {
  return (
    <form action={updateReportStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="path" value="/admin/moderation" />
      <Button type="submit" variant="secondary" size="sm" icon={icon}>{label}</Button>
    </form>
  );
}

function HideContentForm({ id }: { id: string }) {
  return (
    <form action={hideReportedContentAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="path" value="/admin/moderation" />
      <Button type="submit" variant="danger" size="sm" icon={<EyeOff className="h-4 w-4" aria-hidden />}>
        Hide content
      </Button>
    </form>
  );
}

function targetHref(report: ContentReport) {
  if (report.targetType === "brew_log") {
    return `/brews/${report.targetId}`;
  }

  if (report.targetType === "recipe") {
    return `/recipes/${report.targetId}`;
  }

  if (report.targetType === "coffee") {
    return `/coffee/${report.targetId}`;
  }

  if (report.targetType === "gear") {
    return `/gear/${report.targetId}`;
  }

  if (report.targetType === "conversation") {
    return `/messages/${report.targetId}`;
  }

  return "/admin/moderation";
}
