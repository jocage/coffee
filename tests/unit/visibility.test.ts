import { describe, expect, it } from "vitest";
import { canReadVisibility, canRemix } from "@/lib/permissions/visibility";

describe("visibility permissions", () => {
  it("allows owners to read private content", () => {
    expect(canReadVisibility("private", { ownerId: "u1", viewer: { id: "u1" } })).toBe(true);
  });

  it("hides private content from other users", () => {
    expect(canReadVisibility("private", { ownerId: "u1", viewer: { id: "u2" } })).toBe(false);
  });

  it("allows followers content only for followers", () => {
    expect(canReadVisibility("followers", { ownerId: "u1", viewer: { id: "u2" }, isFollower: true })).toBe(true);
    expect(canReadVisibility("followers", { ownerId: "u1", viewer: { id: "u2" }, isFollower: false })).toBe(false);
  });

  it("allows remix for public with credit recipes", () => {
    expect(canRemix("public", "with_credit", false)).toBe(true);
    expect(canRemix("private", "with_credit", false)).toBe(false);
    expect(canRemix("public", "none", false)).toBe(false);
  });
});
