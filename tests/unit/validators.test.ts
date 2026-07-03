import { describe, expect, it } from "vitest";
import { presignUploadSchema } from "@/lib/validators/media";
import { collectionInputSchema, collectionItemInputSchema } from "@/lib/validators/collections";
import { recipeInputSchema, validateStepWater } from "@/lib/validators/recipes";
import { brewLogInputSchema } from "@/lib/validators/brews";
import { coffeeInputSchema } from "@/lib/validators/coffee";
import { grinderInputSchema } from "@/lib/validators/gear";
import { commentInputSchema, hideReportedContentInputSchema, reportInputSchema } from "@/lib/validators/social";
import { signInInputSchema, signUpInputSchema } from "@/lib/validators/auth";

describe("validators", () => {
  it("accepts a valid recipe payload", () => {
    const result = recipeInputSchema.safeParse({
      title: "Morning V60",
      method: "V60",
      visibility: "public",
      doseGrams: 20,
      waterGrams: 300,
      temperatureCelsius: 93,
      grindLabel: "Medium-fine",
      steps: [
        {
          label: "Bloom",
          startsAtSeconds: 0,
          pourGrams: 40,
          cumulativeWaterGrams: 40,
          instruction: "Pour gently"
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects step water above total water", () => {
    expect(validateStepWater(250, [{ cumulativeWaterGrams: 300 }])).toBe(false);
  });

  it("accepts espresso brew log payloads", () => {
    expect(
      brewLogInputSchema.safeParse({
        recipeId: "recipe_espresso",
        coffeeId: "coffee_espresso",
        method: "Espresso",
        doseGrams: 18,
        waterGrams: 38,
        outputGrams: 36,
        temperatureCelsius: 93,
        grindSetting: "6.2",
        brewTimeSeconds: 29,
        pressureBars: 9,
        rating: 5,
        tastingNotes: "Syrupy, sweet shot.",
        visibility: "private"
      }).success
    ).toBe(true);

    expect(
      brewLogInputSchema.safeParse({
        recipeId: "",
        coffeeId: "coffee_espresso",
        method: "Espresso",
        doseGrams: 18,
        waterGrams: 38,
        outputGrams: 36,
        temperatureCelsius: 93,
        grindSetting: "6.2",
        brewTimeSeconds: 29,
        pressureBars: 9,
        rating: 5,
        tastingNotes: "Free espresso log without a recipe.",
        visibility: "private"
      }).success
    ).toBe(true);

    expect(
      brewLogInputSchema.safeParse({
        recipeId: "",
        coffeeId: "",
        method: "Espresso",
        doseGrams: 18,
        waterGrams: 38,
        temperatureCelsius: 93,
        grindSetting: "6.2",
        brewTimeSeconds: 29,
        rating: 5,
        tastingNotes: "Missing coffee.",
        visibility: "private"
      }).success
    ).toBe(false);
  });

  it("limits upload size", () => {
    expect(
      presignUploadSchema.safeParse({
        entityType: "recipe",
        fileName: "cover.jpg",
        mimeType: "image/jpeg",
        size: 16 * 1024 * 1024
      }).success
    ).toBe(false);
  });

  it("accepts coffee, grinder and comment payloads", () => {
    expect(
      coffeeInputSchema.safeParse({
        name: "Ethiopia Shakiso",
        roaster: "Kurasa Kyoto",
        origin: "Ethiopia",
        roastLevel: "light",
        rating: 4.8,
        visibility: "private"
      }).success
    ).toBe(true);

    expect(
      grinderInputSchema.safeParse({
        name: "Comandante C40",
        brand: "Comandante",
        model: "C40",
        type: "grinder",
        grinderDrive: "manual",
        visibility: "private"
      }).success
    ).toBe(true);

    expect(
      commentInputSchema.safeParse({
        targetType: "coffee",
        targetId: "coffee_1",
        path: "/coffee/worka-chelbesa",
        body: "How long off roast was this lot?"
      }).success
    ).toBe(true);

    expect(
      reportInputSchema.safeParse({
        targetType: "gear",
        targetId: "gear_1",
        path: "/gear/comandante-c40",
        reason: "spam",
        details: "Looks duplicated."
      }).success
    ).toBe(true);

    expect(
      hideReportedContentInputSchema.safeParse({
        id: "report_1",
        path: "/admin/moderation"
      }).success
    ).toBe(true);
  });

  it("validates auth form payloads", () => {
    expect(
      signInInputSchema.safeParse({
        email: "ALICE@example.com",
        password: "correct horse battery staple",
        rememberMe: true
      }).success
    ).toBe(true);

    expect(
      signUpInputSchema.safeParse({
        name: "Alice Brewer",
        email: "alice@example.com",
        password: "correct horse battery staple",
        acceptedTerms: true
      }).success
    ).toBe(true);

    expect(
      signUpInputSchema.safeParse({
        name: "A",
        email: "not-an-email",
        password: "short",
        acceptedTerms: false
      }).success
    ).toBe(false);
  });

  it("accepts collection payloads", () => {
    expect(
      collectionInputSchema.safeParse({
        title: "Summer filter recipes",
        description: "Bright public recipes.",
        visibility: "public"
      }).success
    ).toBe(true);

    expect(
      collectionItemInputSchema.safeParse({
        collectionId: "collection_1",
        targetType: "recipe",
        targetId: "recipe_1",
        path: "/r/tetsu/morning-clarity-v60"
      }).success
    ).toBe(true);
  });
});
