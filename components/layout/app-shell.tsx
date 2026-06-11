import {
  Bell,
  BookOpen,
  Coffee,
  Compass,
  Download,
  FolderHeart,
  Home,
  MessageCircle,
  Search,
  Settings,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { CoffeeLogo } from "@/components/coffee/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/lib/data/queries";
import { AuthRequiredError } from "@/lib/data/repositories";
import { isAdminProfile } from "@/lib/permissions/admin";

const desktopNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/recipes", label: "My Recipes", icon: BookOpen },
  { href: "/brews", label: "Brew Logs", icon: Coffee },
  { href: "/collections", label: "Collections", icon: FolderHeart },
  { href: "/coffees", label: "Coffees", icon: Coffee },
  { href: "/gear", label: "Gear", icon: Settings },
  { href: "/community", label: "Community", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldAlert, adminOnly: true },
  { href: "/export-studio", label: "Export Studio", icon: Download },
  { href: "/profile", label: "Profile", icon: User }
];

const mobileNav = desktopNav.slice(0, 4).concat({ href: "/profile", label: "Profile", icon: User });

export async function AppShell({ children }: { children: ReactNode }) {
  let user;

  try {
    user = await getCurrentUser();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/sign-in");
    }

    throw error;
  }

  const navItems = desktopNav.filter((item) => !("adminOnly" in item) || !item.adminOnly || isAdminProfile(user));

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--border)] bg-black/25 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <CoffeeLogo />
        <nav className="mt-10 space-y-1" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm text-[var(--text-muted)] transition hover:bg-white/7 hover:text-[var(--text)]"
            >
              <item.icon aria-hidden className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-[var(--border)] pt-5">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.displayName}</p>
              <p className="truncate text-xs text-[var(--text-dim)]">{user.role}</p>
            </div>
            <div className="ml-auto">
              <SignOutButton compact />
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 hidden border-b border-[var(--border)] bg-[var(--background)]/78 px-6 py-4 backdrop-blur-xl lg:ml-64 lg:flex lg:items-center lg:justify-between">
        <label className="focus-within:border-[var(--accent)] flex h-11 w-full max-w-xl items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 px-3">
          <Search aria-hidden className="h-4 w-4 text-[var(--text-dim)]" />
          <input
            aria-label="Search recipes, people and beans"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-dim)]"
            placeholder="Search recipes, people, beans..."
          />
        </label>
        <div className="flex items-center gap-2">
          <Link href="/messages" className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/5" aria-label="Messages">
            <MessageCircle aria-hidden className="h-4 w-4" />
          </Link>
          <Link href="/notifications" className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/5" aria-label="Notifications">
            <Bell aria-hidden className="h-4 w-4" />
          </Link>
          <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
        </div>
      </header>

      <main className="pb-28 lg:ml-64 lg:pb-0">{children}</main>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#10100f]/92 p-2 shadow-2xl backdrop-blur-xl lg:hidden"
        aria-label="Mobile primary"
      >
        {mobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="focus-ring flex flex-col items-center gap-1 rounded-[var(--radius-sm)] px-1 py-2 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            <item.icon aria-hidden className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
