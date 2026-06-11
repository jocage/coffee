import Image from "next/image";
import { cn } from "@/lib/format";

type AvatarProps = {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-20 w-20"
};

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={96}
      height={96}
      className={cn("rounded-full border border-[var(--border-strong)] object-cover", sizes[size], className)}
    />
  );
}
