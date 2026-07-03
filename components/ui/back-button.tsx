"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton({
  fallbackHref,
  label = "Back"
}: {
  fallbackHref: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      }}
    >
      {label}
    </Button>
  );
}
