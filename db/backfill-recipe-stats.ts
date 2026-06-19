import { backfillRecipeStats } from "@/db/recipe-stats";

async function main() {
  const count = await backfillRecipeStats();
  console.log(`Backfilled recipe stats for ${count} recipes.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
