import { expect, test } from "@playwright/test";

test("landing page renders primary CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Brew better/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Join Coffee Journey/i })).toBeVisible();
});

test("home app shell renders dashboard", async ({ page }) => {
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: /Every drop tells your story/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /View all/i }).first()).toBeVisible();
});

test("auth screens render actionable forms", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  await page.goto("/sign-up");
  await expect(page.getByRole("heading", { name: /Join Coffee Journey/i })).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
});

test("onboarding renders profile setup controls", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Set up your coffee profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Welcome" })).toHaveAttribute(
    "aria-current",
    "step"
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByLabel("Choose handle")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Favorite methods" })).toBeVisible();
  await page.getByRole("button", { name: "Community" }).click();
  await expect(page.getByRole("heading", { name: "Suggested follows and clubs" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish setup" })).toBeVisible();
});

test("profile privacy defaults apply to new content forms", async ({ page }) => {
  await page.goto("/settings/privacy");
  await page.getByLabel("Default content visibility").selectOption("public");
  await page.getByLabel("Who can comment").selectOption("followers");
  await page.getByLabel("Who can message").selectOption("none");
  await page.getByLabel(/Show gear on profile/).setChecked(false);
  await page.getByLabel(/Show coffee on profile/).setChecked(false);
  await Promise.all([
    page.waitForURL("**/settings/privacy?saved=1"),
    page.getByRole("button", { name: "Save privacy" }).click()
  ]);
  await expect(page.getByRole("status")).toContainText("Privacy settings saved.");
  await expect(page.getByLabel("Who can comment")).toHaveValue("followers");
  await expect(page.getByLabel("Who can message")).toHaveValue("none");

  await page.goto("/recipes/new");
  await expect(page.getByLabel("Visibility")).toHaveValue("public");

  await page.goto("/u/tetsu");
  await expect(page.getByRole("heading", { name: "Coffees" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Gear" })).toBeHidden();
});

test("unit settings persist display preferences", async ({ page }) => {
  await page.goto("/settings/units");
  await page.getByLabel("Weight unit").selectOption("ounces");
  await page.getByLabel("Temperature unit").selectOption("fahrenheit");
  await page.getByLabel("Ratio style").selectOption("percent");
  await Promise.all([
    page.waitForURL("**/settings/units?saved=1"),
    page.getByRole("button", { name: "Save units" }).click()
  ]);

  await expect(page.getByRole("status")).toContainText("Unit settings saved.");
  await expect(page.getByLabel("Weight unit")).toHaveValue("ounces");
  await expect(page.getByLabel("Temperature unit")).toHaveValue("fahrenheit");
  await expect(page.getByLabel("Ratio style")).toHaveValue("percent");
  await expect(page.getByText("oz / F / %")).toBeVisible();
});

test("coffee form persists a new coffee", async ({ page }, testInfo) => {
  const name = `Playwright Shakiso ${Date.now()}`;

  await page.goto("/coffees/new");

  if (testInfo.project.name.includes("mobile")) {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Coffee name").fill(name);
    await page.getByLabel("Coffee roaster").fill("Test Roaster");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Coffee origin").fill("Ethiopia");
    await page.getByLabel("Coffee process").fill("Washed");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Coffee rating").fill("4.5");
    await page.getByRole("button", { name: "Continue" }).click();
  } else {
    await page.getByLabel("Name", { exact: true }).fill(name);
    await page.getByLabel("Roaster", { exact: true }).fill("Test Roaster");
    await page.getByLabel("Origin", { exact: true }).fill("Ethiopia");
    await page.getByLabel("Process", { exact: true }).fill("Washed");
    await page.getByLabel("Rating", { exact: true }).fill("4.5");
  }

  await Promise.all([
    page.waitForURL("**/coffees"),
    page.getByRole("button", { name: "Save coffee" }).click()
  ]);
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
});

test("recipe form persists multiple ordered brew steps", async ({ page }) => {
  const title = `Playwright V60 ${Date.now()}`;

  await page.goto("/recipes/new");
  const isMobileWizard = await page.locator("#mobile-title").isVisible();
  const recipeForm = page
    .locator("form")
    .filter({ has: page.locator(isMobileWizard ? "#mobile-title" : "#title") });
  await recipeForm.getByLabel("Recipe name").fill(title);
  if (await page.getByRole("button", { name: "Steps" }).isVisible()) {
    await page.getByRole("button", { name: "Steps" }).click();
  }
  await recipeForm.getByRole("button", { name: "Add step" }).click();
  await recipeForm.locator('input[name="stepLabel"]').nth(1).fill("Pour 2");
  await recipeForm.locator('input[name="stepStartsAtSeconds"]').nth(1).fill("45");
  await recipeForm.locator('input[name="stepPourGrams"]').nth(1).fill("80");
  await recipeForm.locator('input[name="stepCumulativeWaterGrams"]').nth(1).fill("120");
  await recipeForm.locator('textarea[name="stepInstruction"]').nth(1).fill("Second steady pour");

  await Promise.all([
    page.waitForURL(
      (url) => url.pathname.startsWith("/recipes/") && url.pathname !== "/recipes/new"
    ),
    recipeForm.getByRole("button", { name: "Save draft" }).click()
  ]);

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Pour 2")).toBeVisible();
  await expect(page.getByText("Second steady pour")).toBeVisible();
});

test("brew log form persists a new brew", async ({ page }, testInfo) => {
  const grind = `PW espresso ${Date.now()}`;

  await page.goto("/brews/new");

  if (testInfo.project.name.includes("mobile")) {
    await page.getByLabel("Recipe source").selectOption("");
    await page.getByLabel("Method", { exact: true }).selectOption("Espresso");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Dose grams").fill("18");
    await page.getByLabel("Water grams").fill("38");
    await page.getByLabel("Yield grams").fill("36");
    await page.getByLabel("Time seconds").fill("29");
    await page.getByLabel("Pressure bars").fill("9");
    await page.getByLabel("Grind notes").fill(grind);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Tasting notes").fill("Playwright espresso brew log entry");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
  } else {
    await page.getByLabel("Recipe", { exact: true }).selectOption("");
    await page.getByLabel("Brew method").selectOption("Espresso");
    await page.getByLabel("Dose (g)").fill("18");
    await page.getByLabel("Water in / total water (g)").fill("38");
    await page.getByLabel("Beverage yield (g)").fill("36");
    await page.getByLabel("Brew time (s)").fill("29");
    await page.getByLabel("Pressure (bar)").fill("9");
    await page.getByLabel("Grind setting").fill(grind);
    await page.getByLabel("Notes", { exact: true }).fill("Playwright espresso brew log entry");
  }

  await Promise.all([
    page.waitForURL("**/brews"),
    page.getByRole("button", { name: "Save Brew Log" }).click()
  ]);

  await expect(page.getByText("Espresso").first()).toBeVisible();
  await expect(page.getByText("Espresso with").first()).toBeVisible();
  await expect(page.getByText("36g out").first()).toBeVisible();
  await expect(page.getByText(grind).first()).toBeVisible();
});

test("brew log detail renders actual brew data", async ({ page }) => {
  await page.goto("/brews");
  const href = await page.getByRole("link", { name: "Open" }).first().getAttribute("href");
  expect(href).toMatch(/^\/brews\/.+/);
  await page.goto(href ?? "/brews");

  await expect(page.getByRole("heading", { name: /Tasting notes/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Post comment" })).toBeVisible();
});

test("live brew mode controls timer flow", async ({ page }, testInfo) => {
  await page.goto("/brew/recipe_morning_v60");
  await expect(page.getByRole("heading", { name: "Morning Clarity with V60" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("button", { name: "Skip step" }).click();
  await expect(page.getByRole("heading", { name: "Pour 1" })).toBeVisible();
  await Promise.all([
    page.waitForURL("**/brews/new?recipeId=recipe_morning_v60"),
    page.getByRole("link", { name: "End brew" }).click()
  ]);
  await expect(
    page.getByLabel(testInfo.project.name.includes("mobile") ? "Recipe source" : "Recipe", {
      exact: true
    })
  ).toHaveValue("recipe_morning_v60");
});

test("dripper and filter forms persist new gear", async ({ page }) => {
  const dripper = `Playwright Dripper ${Date.now()}`;
  const filter = `Playwright Filter ${Date.now()}`;

  await page.goto("/gear/drippers/new");
  await page.getByLabel("Name").fill(dripper);
  await page.getByLabel("Brand").fill("Origami");
  await page.getByLabel("Model").fill("Air S");
  await page.getByLabel("Material").fill("Resin");
  await Promise.all([
    page.waitForURL("**/gear"),
    page.getByRole("button", { name: "Save dripper" }).click()
  ]);
  await expect(page.getByRole("heading", { name: dripper })).toBeVisible();

  await page.goto("/gear/filters/new");
  await page.getByLabel("Name").fill(filter);
  await page.getByLabel("Brand").fill("Cafec");
  await page.getByLabel("Model").fill("Abaca 02");
  await page.getByLabel("Material / paper type").fill("Abaca");
  await Promise.all([
    page.waitForURL("**/gear"),
    page.getByRole("button", { name: "Save filter" }).click()
  ]);
  await expect(page.getByRole("heading", { name: filter })).toBeVisible();
});

test("grinder form persists a new grinder", async ({ page }, testInfo) => {
  const grinder = `Playwright Grinder ${Date.now()}`;

  await page.goto("/gear/grinders/new");

  if (testInfo.project.name.includes("mobile")) {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Grinder name").fill(grinder);
    await page.getByLabel("Grinder brand").fill("Comandante");
    await page.getByLabel("Grinder model").fill("C40 MK4");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Grinder burr type").fill("Stainless steel conical");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Grinder filter range").fill("40-45 clicks");
    await page.getByLabel("Default for method").selectOption("V60");
    await page.getByRole("button", { name: "Continue" }).click();
  } else {
    await page.getByLabel("Name", { exact: true }).fill(grinder);
    await page.getByLabel("Brand", { exact: true }).fill("Comandante");
    await page.getByLabel("Model", { exact: true }).fill("C40 MK4");
    await page.locator("#burrType").fill("Stainless steel conical");
    await page.locator("#filterRange").fill("40-45 clicks");
    await page.locator("#defaultForMethod").selectOption("V60");
  }

  await Promise.all([
    page.waitForURL("**/gear"),
    page.getByRole("button", { name: "Save grinder" }).click()
  ]);
  await expect(page.getByRole("heading", { name: grinder }).first()).toBeVisible();
});

test("collection form creates a collection detail page", async ({ page }) => {
  test.setTimeout(60_000);

  const title = `Playwright Collection ${Date.now()}`;

  await page.goto("/collections");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Playwright collection description");
  await page.getByLabel("Visibility").selectOption("public");
  await Promise.all([
    page.waitForURL("**/collections/**"),
    page.getByRole("button", { name: "Create collection" }).click()
  ]);

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open public page" })).toBeVisible();

  const collectionUrl = page.url();
  const collectionId = collectionUrl.split("/").pop();
  await page.goto("/r/tetsu/morning-clarity-v60");
  await page.getByLabel("Collection").selectOption(collectionId ?? "");
  await Promise.all([
    page.waitForURL("**/r/tetsu/morning-clarity-v60?collected=1"),
    page.getByRole("button", { name: "Add to collection" }).click()
  ]);

  await page.goto(collectionUrl);
  await expect(page.getByRole("heading", { name: "Morning Clarity with V60" })).toBeVisible();
  await Promise.all([
    page.waitForURL("**/collections/**?removed=1"),
    page.getByRole("button", { name: "Remove" }).click()
  ]);
  await expect(page.getByRole("heading", { name: "No items yet" })).toBeVisible();
});

test("public coffee and gear pages render aggregations", async ({ page }) => {
  test.setTimeout(60_000);

  const coffeeComment = `Playwright coffee comment ${Date.now()}`;
  const gearComment = `Playwright gear comment ${Date.now()}`;

  await page.goto("/coffee/worka-chelbesa");
  await expect(page.getByRole("heading", { name: "Lot profile" })).toBeVisible();
  await page.getByRole("textbox", { name: "Coffee comment" }).fill(coffeeComment);
  await Promise.all([
    page.waitForURL("**/coffee/**?commented=1"),
    page.getByRole("button", { name: "Post comment" }).click()
  ]);
  await expect(page.getByText(coffeeComment)).toBeVisible();

  await page.goto("/gear/gear_c40");
  await expect(page.getByRole("heading", { name: "Popular recipes using it" })).toBeVisible();
  await page.getByRole("textbox", { name: "Gear comment" }).fill(gearComment);
  await Promise.all([
    page.waitForURL("**/gear/**?commented=1"),
    page.getByRole("button", { name: "Post comment" }).click()
  ]);
  await expect(page.getByText(gearComment)).toBeVisible();
});

test("explore renders non-recipe categories", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/explore?tab=people");
  await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
  await expect(page.getByText("@tetsu")).toBeVisible();

  await page.goto("/explore?tab=beans");
  await expect(page.getByText("Worka Chelbesa")).toBeVisible();

  await page.goto("/explore?tab=gear");
  await expect(page.getByText("Comandante C40")).toBeVisible();

  await page.goto("/explore?tab=clubs");
  await expect(page.getByText("Pour-over Lab")).toBeVisible();
});

test("explore filters combine on desktop and mobile", async ({ page }, testInfo) => {
  await page.goto("/explore");

  if (testInfo.project.name.includes("mobile")) {
    await page.getByRole("button", { name: "Filters" }).click();
    const dialog = page.getByRole("dialog", { name: "Explore filters" });
    await dialog.getByLabel("Method", { exact: true }).selectOption("AeroPress");
    await dialog.getByLabel("Roast", { exact: true }).selectOption("medium-light");
    await dialog.getByLabel("Max brew time").fill("180");
    await Promise.all([
      page.waitForURL(/method=AeroPress/),
      dialog.getByRole("button", { name: "Apply filters" }).click()
    ]);
  } else {
    const filters = page.locator("aside");
    await filters.getByLabel("Method", { exact: true }).selectOption("AeroPress");
    await filters.getByLabel("Roast", { exact: true }).selectOption("medium-light");
    await filters.getByLabel("Max brew time").fill("180");
    await Promise.all([
      page.waitForURL(/method=AeroPress/),
      filters.getByRole("button", { name: "Apply filters" }).click()
    ]);
  }

  await expect(page.getByRole("heading", { name: "Travel AeroPress" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Morning Clarity with V60" })).toBeHidden();
});

test("recipe comments persist and render", async ({ page }) => {
  test.setTimeout(60_000);

  const body = `Playwright comment ${Date.now()}`;
  const deleteBody = `Playwright delete ${Date.now()}`;
  const reply = `Playwright reply ${Date.now()}`;

  await page.goto("/r/tetsu/morning-clarity-v60");
  await page.getByRole("textbox", { name: "Recipe comment" }).fill(body);
  await Promise.all([
    page.waitForURL("**/r/tetsu/morning-clarity-v60?commented=1"),
    page.getByRole("button", { name: "Post comment" }).click()
  ]);

  await expect(page.getByText(body)).toBeVisible();
  const commentArticle = page.locator("article").filter({ hasText: body });
  await commentArticle.getByLabel("Reply to Tetsu Kasuya").fill(reply);
  await Promise.all([
    page.waitForURL("**/r/tetsu/morning-clarity-v60?replied=1"),
    commentArticle.getByRole("button", { name: "Reply" }).click()
  ]);
  await expect(page.getByText(reply)).toBeVisible();

  await page.getByRole("textbox", { name: "Recipe comment" }).fill(deleteBody);
  await Promise.all([
    page.waitForURL("**/r/tetsu/morning-clarity-v60?commented=1"),
    page.getByRole("button", { name: "Post comment" }).click()
  ]);
  await expect(page.getByText(deleteBody)).toBeVisible();
  await Promise.all([
    page.waitForURL("**/r/tetsu/morning-clarity-v60?commentDeleted=1"),
    page
      .locator("article")
      .filter({ hasText: deleteBody })
      .getByRole("button", { name: "Delete" })
      .first()
      .click()
  ]);
  await expect(page.getByText(deleteBody)).toBeHidden();

  await Promise.all([
    page.waitForURL("**/r/tetsu/morning-clarity-v60?reported=1"),
    page
      .locator("article")
      .filter({ hasText: body })
      .getByRole("button", { name: "Report comment" })
      .first()
      .click()
  ]);
  await page.goto("/admin/moderation");
  await expect(page.getByText(`Reported comment: ${body}`)).toBeVisible();
});

test("saved recipes appear in recipes saved tab", async ({ page }) => {
  await page.goto("/r/tetsu/morning-clarity-v60");
  await Promise.all([
    page.waitForURL("**/r/tetsu/morning-clarity-v60?saved=1"),
    page.getByRole("button", { name: "Save" }).click()
  ]);

  await page.goto("/recipes?view=saved");
  await expect(page.getByRole("tab", { name: "Saved" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Morning Clarity with V60" })).toBeVisible();
});

test("public recipe can be remixed into an editable draft", async ({ page }) => {
  await page.goto("/r/tetsu/morning-clarity-v60");
  await Promise.all([
    page.waitForURL("**/recipes/**/edit"),
    page.getByRole("button", { name: "Remix" }).click()
  ]);

  await expect(
    page.getByRole("heading", { name: "Remix of Morning Clarity with V60" })
  ).toBeVisible();
  await expect(page.getByText("Remix draft based on")).toBeVisible();
  const remixDiff = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Remix diff" }) });
  await expect(remixDiff).toBeVisible();
  await expect(remixDiff.getByText("Based on Morning Clarity with V60")).toBeVisible();
  await expect(page.getByRole("button", { name: "Update recipe" })).toBeVisible();
});

test("reports content into moderation queue", async ({ page }) => {
  const details = `Playwright report ${Date.now()}`;

  await page.goto("/r/tetsu/morning-clarity-v60");
  await page.getByLabel("Details").fill(details);
  await Promise.all([
    page.waitForURL("**/r/tetsu/morning-clarity-v60?reported=1"),
    page.getByRole("button", { name: "Report content" }).click()
  ]);

  await page.goto("/admin/moderation");
  await expect(page.getByText(details)).toBeVisible();
  await page.getByRole("button", { name: "Resolve" }).first().click();
  await expect(page.getByRole("heading", { name: "Moderation" })).toBeVisible();
});

test("community, messages and notifications routes render", async ({ page }) => {
  await page.goto("/community");
  await expect(page.getByRole("heading", { name: "Community" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pour-over Lab 2,480 members" })).toBeVisible();

  await page.goto("/clubs/pourover-lab");
  await expect(page.getByRole("heading", { name: "Pour-over Lab" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open challenge/i })).toBeVisible();

  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();

  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
});

test("community actions submit successfully", async ({ page }) => {
  await page.goto("/clubs/pourover-lab");
  await page.getByRole("button", { name: "Join club" }).click();
  await expect(page.getByRole("heading", { name: "Pour-over Lab" })).toBeVisible();

  await page.goto("/challenges/challenge_bloom");
  await page.getByLabel("Entry notes").fill("Playwright challenge entry");
  await Promise.all([
    page.waitForURL("**/challenges/challenge_bloom"),
    page.getByRole("button", { name: "Enter challenge" }).click()
  ]);
  await expect(page.getByRole("heading", { name: "Bloom control week" })).toBeVisible();
});

test("messages and notifications actions submit", async ({ page }) => {
  const body = `Playwright message ${Date.now()}`;

  await page.goto("/messages/conversation_alex");
  await page.getByLabel("Write a message").fill(body);
  await Promise.all([
    page.waitForURL("**/messages/conversation_alex?sent=1"),
    page.getByRole("button", { name: "Send" }).click()
  ]);
  await expect(page.getByText(body)).toBeVisible();

  await page.goto("/notifications");
  await Promise.all([
    page.waitForURL("**/notifications?read=1"),
    page.getByRole("button", { name: "Mark all read" }).click()
  ]);
  await expect(page.getByRole("status")).toContainText("Notifications marked as read.");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
});

test("export studio exposes PNG export controls", async ({ page }) => {
  await page.goto("/export-studio");
  await expect(page.getByRole("heading", { name: "Export Studio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export PNG" })).toBeVisible();
});
