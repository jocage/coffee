export type Visibility = "private" | "unlisted" | "followers" | "public";
export type RemixPolicy = "none" | "with_credit" | "ask_permission";
export type CommentPolicy = "disabled" | "followers" | "public";
export type MessagePolicy = "none" | "followers" | "public";
export type WeightUnit = "grams" | "ounces";
export type TemperatureUnit = "celsius" | "fahrenheit";
export type RatioStyle = "brew_ratio" | "percent";
export type SocialTargetType = "recipe" | "brew_log" | "comment" | "collection" | "coffee" | "gear";
export type BrewMethod =
  | "V60"
  | "Origami"
  | "Kalita"
  | "AeroPress"
  | "Espresso"
  | "French Press"
  | "Switch";
export type RoastLevel = "light" | "medium-light" | "medium" | "medium-dark" | "dark";
export type GearType = "grinder" | "dripper" | "filter" | "kettle" | "scale" | "server";

export type UserProfile = {
  id: string;
  handle: string;
  displayName: string;
  role: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string;
  coverUrl: string;
  verified?: boolean;
  defaultVisibility: Visibility;
  defaultCommentPolicy: CommentPolicy;
  messagePolicy: MessagePolicy;
  showGearOnProfile: boolean;
  showCoffeeOnProfile: boolean;
  weightUnit: WeightUnit;
  temperatureUnit: TemperatureUnit;
  ratioStyle: RatioStyle;
  favoriteMethods: BrewMethod[];
  defaultGrinderId?: string;
  defaultDripperId?: string;
  defaultFilterId?: string;
  stats: {
    recipes: number;
    brewLogs: number;
    followers: number;
    following: number;
    totalRecipeBrews: number;
  };
};

export type RecipeStep = {
  id: string;
  label: string;
  startsAtSeconds: number;
  endsAtSeconds?: number;
  pourGrams?: number;
  cumulativeWaterGrams: number;
  instruction: string;
  cue: string;
};

export type TasteProfile = {
  sweetness: number;
  acidity: number;
  body: number;
  balance: number;
  finish: number;
};

export type CoffeeBean = {
  id: string;
  name: string;
  slug: string;
  roaster: string;
  origin: string;
  process: string;
  roastLevel: RoastLevel;
  flavorNotes: string[];
  rating: number;
  visibility: Visibility;
  imageUrl: string;
};

export type GearItem = {
  id: string;
  type: GearType;
  brand: string;
  model: string;
  name: string;
  notes: string;
  imageUrl: string;
  visibility: Visibility;
  defaultForMethod?: BrewMethod;
};

export type GrinderCatalogStatus = "pending" | "approved" | "rejected";

export type GrinderCatalogItem = {
  id: string;
  name: string;
  brand: string;
  model: string;
  grinderDrive: "manual" | "electric";
  burrType: string;
  filterRange: string;
  notes: string;
  imageUrl: string;
  status: GrinderCatalogStatus;
};

export type DripperCatalogStatus = "pending" | "approved" | "rejected";

export type DripperCatalogItem = {
  id: string;
  name: string;
  brand: string;
  model: string;
  material: string;
  size: string;
  brewSpeed: string;
  compatibleFilters: string;
  notes: string;
  imageUrl: string;
  status: DripperCatalogStatus;
};

export type Recipe = {
  id: string;
  parentRecipeId?: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  method: BrewMethod;
  visibility: Visibility;
  remixPolicy: RemixPolicy;
  commentPolicy: CommentPolicy;
  coverUrl: string;
  author: UserProfile;
  coffee: CoffeeBean;
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  temperatureCelsius: number;
  grindLabel: string;
  grindSetting: string;
  totalTimeSeconds: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  flavorNotes: string[];
  tasteProfile: TasteProfile;
  steps: RecipeStep[];
  gear: GearItem[];
  stats: {
    likes: number;
    saves: number;
    brews: number;
    averageRating: number;
    remixes: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type BrewLog = {
  id: string;
  title: string;
  method: BrewMethod;
  author: UserProfile;
  recipe?: Recipe;
  coffee: CoffeeBean;
  brewedAt: string;
  doseGrams: number;
  waterGrams: number;
  outputGrams?: number;
  temperatureCelsius: number;
  grindSetting: string;
  brewTimeSeconds: number;
  pressureBars?: number;
  rating: number;
  tastingNotes: string;
  flavorTags: string[];
  visibility: Visibility;
  photos: string[];
};

export type FeedItem =
  | {
      id: string;
      type: "recipe";
      recipe: Recipe;
      author: UserProfile;
      createdAt: string;
    }
  | {
      id: string;
      type: "brew_log";
      brewLog: BrewLog;
      author: UserProfile;
      createdAt: string;
    };

export type ExportFormat =
  | "instagram-post"
  | "instagram-story"
  | "square"
  | "transparent-png"
  | "print-a4";
export type ExportTheme = "mocha" | "midnight" | "latte" | "forest" | "sakura";

export type ExportPreset = {
  id: string;
  format: ExportFormat;
  theme: ExportTheme;
  accentColor: string;
  enabledBlocks: string[];
};

export type Comment = {
  id: string;
  author: UserProfile;
  targetType: SocialTargetType;
  targetId: string;
  parentId?: string;
  body: string;
  createdAt: string;
};

export type SocialCounts = {
  likes: number;
  saves: number;
  comments: number;
  followers: number;
};

export type Club = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: Visibility;
  coverUrl: string;
  memberCount: number;
  activeChallengeId?: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  clubSlug?: string;
  startsAt: string;
  endsAt: string;
  entryCount: number;
};

export type Conversation = {
  id: string;
  participant: UserProfile;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
};

export type Notification = {
  id: string;
  type:
    | "follow"
    | "like"
    | "comment"
    | "reply"
    | "recipe_brewed"
    | "recipe_remixed"
    | "mention"
    | "challenge"
    | "system";
  actor?: UserProfile;
  title: string;
  body: string;
  href: string;
  readAt?: string;
  createdAt: string;
};

export type ContentReport = {
  id: string;
  reporter: UserProfile;
  targetType: SocialTargetType;
  targetId: string;
  reason: "spam" | "harassment" | "unsafe" | "copyright" | "other";
  details: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  createdAt: string;
  reviewedAt?: string;
};

export type CollectionItem = {
  id: string;
  targetType: SocialTargetType;
  targetId: string;
  position: number;
  title: string;
  subtitle: string;
  imageUrl: string;
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  visibility: Visibility;
  owner: UserProfile;
  itemCount: number;
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
};
