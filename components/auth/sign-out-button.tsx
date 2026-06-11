"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function signOut() {
    setError(null);
    startTransition(async () => {
      const response = await authClient.signOut();

      if (response.error) {
        setError(response.error.message ?? "Could not sign out.");
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    });
  }

  return (
    <div className={compact ? "grid gap-1" : "grid gap-2"}>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon" : "sm"}
        aria-label="Sign out"
        disabled={isPending}
        icon={<LogOut className="h-4 w-4" aria-hidden />}
        onClick={signOut}
      >
        {compact ? null : isPending ? "Signing out..." : "Sign out"}
      </Button>
      {error ? <p role="alert" className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
