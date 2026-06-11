import type { HTMLAttributes } from "react";
import { cn } from "@/lib/format";

export function ModalFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className={cn("soft-panel w-full max-w-lg rounded-[var(--radius-lg)] p-5", className)} {...props} />
    </div>
  );
}

export function DrawerFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <aside
      className={cn(
        "soft-panel fixed right-0 top-0 z-40 h-dvh w-full max-w-md rounded-l-[var(--radius-lg)] p-5",
        className
      )}
      {...props}
    />
  );
}

export function BottomSheetFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "soft-panel fixed inset-x-0 bottom-0 z-40 rounded-t-[var(--radius-lg)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
        className
      )}
      {...props}
    />
  );
}
