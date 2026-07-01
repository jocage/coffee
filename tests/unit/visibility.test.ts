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
    expect(
      canReadVisibility("followers", { ownerId: "u1", viewer: { id: "u2" }, isFollower: true })
    ).toBe(true);
    expect(
      canReadVisibility("followers", { ownerId: "u1", viewer: { id: "u2" }, isFollower: false })
    ).toBe(false);
  });

  it("filters profile content without leaking private or follower-only entries", () => {
    const items = [
      { id: "public", visibility: "public" as const },
      { id: "followers", visibility: "followers" as const },
      { id: "private", visibility: "private" as const }
    ];
    const visibleToGuest = items.filter((item) =>
      canReadVisibility(item.visibility, { ownerId: "u1", viewer: null })
    );
    const visibleToFollower = items.filter((item) =>
      canReadVisibility(item.visibility, {
        ownerId: "u1",
        viewer: { id: "u2" },
        isFollower: true
      })
    );

    expect(visibleToGuest.map((item) => item.id)).toEqual(["public"]);
    expect(visibleToFollower.map((item) => item.id)).toEqual(["public", "followers"]);
  });

  it("blocks detail reads unless the viewer passes owner or follower checks", () => {
    expect(canReadVisibility("private", { ownerId: "u1", viewer: { id: "u2" } })).toBe(false);
    expect(canReadVisibility("followers", { ownerId: "u1", viewer: { id: "u2" } })).toBe(false);
    expect(
      canReadVisibility("followers", { ownerId: "u1", viewer: { id: "u2" }, isFollower: true })
    ).toBe(true);
    expect(canReadVisibility("private", { ownerId: "u1", viewer: { id: "u1" } })).toBe(true);
  });

  it("allows remix for public with credit recipes", () => {
    expect(canRemix("public", "with_credit", false)).toBe(true);
    expect(canRemix("private", "with_credit", false)).toBe(false);
    expect(canRemix("public", "none", false)).toBe(false);
  });
});
