import Link from "next/link";
import { SignUpForm } from "@/components/auth/auth-forms";
import { CoffeeLogo } from "@/components/coffee/logo";
import { Card } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Card className="w-full max-w-md">
        <CoffeeLogo />
        <h1 className="serif mt-8 text-4xl">Join Coffee Journey</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Create your journal and start saving better brews.</p>
        <SignUpForm />
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link className="text-[var(--accent)]" href="/sign-in">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
