import Link from "next/link";
import { Suspense } from "react";
import { CoffeeLogo } from "@/components/coffee/logo";
import { Card } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/auth-forms";

export default function SignInPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Card className="w-full max-w-md">
        <CoffeeLogo />
        <h1 className="serif mt-8 text-4xl">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Sign in to continue your coffee journal.</p>
        <Suspense fallback={<div className="mt-8 h-40 rounded-[var(--radius-sm)] bg-white/5" />}>
          <SignInForm />
        </Suspense>
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          New here?{" "}
          <Link className="text-[var(--accent)]" href="/sign-up">
            Create an account
          </Link>
        </p>
      </Card>
    </main>
  );
}
