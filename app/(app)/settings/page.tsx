import Link from "next/link";
import { Bell, Download, Eye, Ruler, Shield, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/data/queries";

const sections = [
  {
    title: "Account",
    description: "Email, session, connected providers and account security.",
    icon: User,
    status: "Planned"
  },
  {
    title: "Profile",
    description: "Public identity, avatar, cover image and favorite brew methods.",
    icon: User,
    href: "/settings/profile",
    status: "Available"
  },
  {
    title: "Privacy",
    description: "Default visibility, commenting, messages and public profile sections.",
    icon: Shield,
    href: "/settings/privacy",
    status: "Available"
  },
  {
    title: "Units",
    description: "Preferred temperature, weight and ratio display options.",
    icon: Ruler,
    href: "/settings/units",
    status: "Available"
  },
  {
    title: "Notifications",
    description: "Choose which follows, comments, challenges and messages create alerts.",
    icon: Bell,
    status: "Planned"
  },
  {
    title: "Export preferences",
    description: "Default export format, theme and block visibility presets.",
    icon: Download,
    href: "/export-studio",
    status: "Partial"
  },
  {
    title: "Profile visibility",
    description: "Show or hide gear and coffee collections on your public profile.",
    icon: Eye,
    href: "/settings/privacy",
    status: "Available"
  },
  {
    title: "Data and deletion",
    description: "Export account data or request account deletion.",
    icon: Trash2,
    status: "Planned"
  }
];

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage account, privacy, notification and export preferences.
          </p>
        </div>
        <Badge>{user.defaultVisibility} by default</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const content = (
            <Card className="grid h-full content-between gap-5">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-white/7 text-[var(--accent)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <Badge>{section.status}</Badge>
                </div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{section.description}</p>
              </div>
              {section.href ? (
                <span className="focus-ring inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white/7 px-4 text-sm font-semibold text-[var(--text)] transition group-hover:bg-white/12">
                  Open
                </span>
              ) : null}
            </Card>
          );

          return section.href ? (
            <Link key={section.title} href={section.href} className="focus-ring rounded-[var(--radius-md)]">
              {content}
            </Link>
          ) : (
            <div key={section.title}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
