import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: ReactNode;
};

const variants = {
  primary: "bg-[var(--accent)] text-black hover:bg-[var(--accent-strong)]",
  secondary: "border border-[var(--border-strong)] bg-white/7 text-[var(--text)] hover:bg-white/12",
  ghost: "text-[var(--text-muted)] hover:bg-white/8 hover:text-[var(--text)]",
  danger: "bg-[var(--danger)] text-black hover:brightness-110"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-6 text-base",
  icon: "h-11 w-11 p-0"
};

export function Button({ className, variant = "primary", size = "md", icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] font-semibold transition disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
