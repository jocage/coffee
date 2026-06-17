import "server-only";

// Domain data access is organized by area under lib/data/*. This barrel keeps
// the historical "@/lib/data/repositories" import path stable for callers.
export * from "@/lib/data/shared";
export * from "@/lib/data/profiles";
export * from "@/lib/data/catalog";
export * from "@/lib/data/recipes";
export * from "@/lib/data/community";
export * from "@/lib/data/social";
