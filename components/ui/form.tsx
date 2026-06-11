import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/format";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/20 px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-28 w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/20 px-3 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)]",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/30 px-3 text-sm text-[var(--text)]",
        className
      )}
      {...props}
    />
  );
}
