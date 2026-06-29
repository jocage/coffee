export type RecipeStatsInput = {
  likes: number;
  saves: number;
  comments: number;
  brews: Array<{ rating: number }>;
  remixes: number;
};

export type RecipeStats = {
  likes: number;
  saves: number;
  brews: number;
  averageRating: number;
  remixes: number;
  comments: number;
};

export function calculateRecipeStats(input: RecipeStatsInput): RecipeStats {
  const brews = input.brews.length;
  const averageRating =
    brews === 0
      ? 0
      : Math.round((input.brews.reduce((total, brew) => total + brew.rating, 0) / brews) * 10) / 10;

  return {
    likes: input.likes,
    saves: input.saves,
    brews,
    averageRating,
    remixes: input.remixes,
    comments: input.comments
  };
}
