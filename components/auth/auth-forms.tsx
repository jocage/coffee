"use client";

import { Loader2, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth/client";
import { signInInputSchema, signUpInputSchema } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";

type AuthMode = "sign-in" | "sign-up";

function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Authentication failed. Check your details and try again.";
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const nextPath = searchParams.get("next") || "/home";

  function onSubmit(formData: FormData) {
    setError(null);
    const parsed = signInInputSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "on"
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    startTransition(async () => {
      const response = await authClient.signIn.email(parsed.data);

      if (response.error) {
        setError(getAuthErrorMessage(response.error));
        return;
      }

      router.replace(nextPath);
      router.refresh();
    });
  }

  function onGoogleSignIn() {
    setError(null);

    startTransition(async () => {
      const response = await authClient.signIn.social({
        provider: "google",
        callbackURL: nextPath
      });

      if (response.error) {
        setError(getAuthErrorMessage(response.error));
      }
    });
  }

  return <AuthForm mode="sign-in" error={error} isPending={isPending} onSubmit={onSubmit} onGoogleSignIn={onGoogleSignIn} />;
}

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    const parsed = signUpInputSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      acceptedTerms: formData.get("acceptedTerms") === "on"
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    startTransition(async () => {
      const response = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password
      });

      if (response.error) {
        setError(getAuthErrorMessage(response.error));
        return;
      }

      router.replace("/onboarding");
      router.refresh();
    });
  }

  function onGoogleSignIn() {
    setError(null);

    startTransition(async () => {
      const response = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/onboarding"
      });

      if (response.error) {
        setError(getAuthErrorMessage(response.error));
      }
    });
  }

  return <AuthForm mode="sign-up" error={error} isPending={isPending} onSubmit={onSubmit} onGoogleSignIn={onGoogleSignIn} />;
}

function AuthForm({
  mode,
  error,
  isPending,
  onSubmit,
  onGoogleSignIn
}: {
  mode: AuthMode;
  error: string | null;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onGoogleSignIn: () => void;
}) {
  const isSignUp = mode === "sign-up";

  return (
    <form action={onSubmit} className="mt-8 grid gap-4" noValidate>
      {isSignUp ? (
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Alex Brewer" required />
        </div>
      ) : null}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} required />
      </div>

      {isSignUp ? (
        <label className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
          <input name="acceptedTerms" type="checkbox" required className="mt-1 accent-[var(--accent)]" />
          I agree to the terms and understand public recipes can be indexed.
        </label>
      ) : (
        <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <input name="rememberMe" type="checkbox" defaultChecked className="accent-[var(--accent)]" />
          Keep me signed in
        </label>
      )}

      {error ? (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-[var(--danger)]/35 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending} icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : undefined}>
        {isPending ? "Working..." : isSignUp ? "Create account" : "Sign in"}
      </Button>
      <Button type="button" variant="secondary" className="w-full" disabled={isPending} onClick={onGoogleSignIn}>
        <Mail className="h-4 w-4" aria-hidden />
        Continue with Google
      </Button>
    </form>
  );
}
