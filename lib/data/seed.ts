import type { BrewLog, Challenge, Club, CoffeeBean, Conversation, FeedItem, GearItem, Notification, Recipe, UserProfile } from "@/lib/domain";
import { images } from "@/lib/data/images";

export const currentUser: UserProfile = {
  id: "user_tetsu",
  handle: "tetsu",
  displayName: "Tetsu Kasuya",
  role: "Barista & Designer",
  bio: "Coffee is my life. Sharing clean, repeatable brews from Tokyo.",
  location: "Tokyo, Japan",
  website: "https://coffee-journey.example/tetsu",
  avatarUrl: images.avatar,
  coverUrl: images.beans,
  verified: true,
  defaultVisibility: "private",
  favoriteMethods: ["V60", "Origami", "Kalita"],
  stats: {
    recipes: 128,
    brewLogs: 342,
    followers: 3400,
    following: 320,
    totalRecipeBrews: 12800
  }
};

export const creators: UserProfile[] = [
  currentUser,
  {
    id: "user_alex",
    handle: "alexbrews",
    displayName: "Alex Brewer",
    role: "Home barista",
    bio: "Clean cups, small changes, honest notes.",
    location: "Warsaw, Poland",
    website: "https://coffee-journey.example/alexbrews",
    avatarUrl: images.avatarTwo,
    coverUrl: images.cafe,
    defaultVisibility: "private",
    favoriteMethods: ["V60", "AeroPress"],
    stats: {
      recipes: 42,
      brewLogs: 126,
      followers: 890,
      following: 210,
      totalRecipeBrews: 2800
    }
  }
];

export const coffees: CoffeeBean[] = [
  {
    id: "coffee_worka",
    name: "Worka Chelbesa",
    slug: "worka-chelbesa",
    roaster: "Kurasa Kyoto",
    origin: "Yirgacheffe, Ethiopia",
    process: "Washed",
    roastLevel: "light",
    flavorNotes: ["Jasmine", "Bergamot", "White peach", "Honey"],
    rating: 4.8,
    visibility: "public",
    imageUrl: images.beans
  },
  {
    id: "coffee_colombia",
    name: "Colombia Finca La Palma",
    slug: "colombia-finca-la-palma",
    roaster: "April Coffee",
    origin: "Huila, Colombia",
    process: "Honey",
    roastLevel: "medium-light",
    flavorNotes: ["Orange", "Caramel", "Cacao"],
    rating: 4.6,
    visibility: "public",
    imageUrl: images.espresso
  }
];

export const gear: GearItem[] = [
  {
    id: "gear_v60",
    type: "dripper",
    brand: "Hario",
    model: "V60 02",
    name: "Hario V60 02",
    notes: "Fast, clean ceramic dripper.",
    imageUrl: images.dripper,
    visibility: "public",
    defaultForMethod: "V60"
  },
  {
    id: "gear_c40",
    type: "grinder",
    brand: "Comandante",
    model: "C40 MK4",
    name: "Comandante C40",
    notes: "40-45 clicks for this recipe.",
    imageUrl: images.grinder,
    visibility: "public"
  },
  {
    id: "gear_scale",
    type: "scale",
    brand: "Acaia",
    model: "Pearl",
    name: "Acaia Pearl",
    notes: "0.1g precision and flow timer.",
    imageUrl: images.darkPour,
    visibility: "private"
  }
];

const morningSteps = [
  {
    id: "step_bloom",
    label: "Bloom",
    startsAtSeconds: 0,
    endsAtSeconds: 30,
    pourGrams: 40,
    cumulativeWaterGrams: 40,
    instruction: "Saturate all grounds with a gentle spiral.",
    cue: "Stay steady. Let it bloom."
  },
  {
    id: "step_pour_1",
    label: "Pour 1",
    startsAtSeconds: 30,
    endsAtSeconds: 60,
    pourGrams: 60,
    cumulativeWaterGrams: 100,
    instruction: "Pour slowly in the center, then widen.",
    cue: "Target 100 grams."
  },
  {
    id: "step_pour_2",
    label: "Pour 2",
    startsAtSeconds: 60,
    endsAtSeconds: 90,
    pourGrams: 60,
    cumulativeWaterGrams: 160,
    instruction: "Keep the slurry level with a controlled circle.",
    cue: "Maintain level."
  },
  {
    id: "step_pour_3",
    label: "Pour 3",
    startsAtSeconds: 90,
    endsAtSeconds: 120,
    pourGrams: 60,
    cumulativeWaterGrams: 220,
    instruction: "Slow, even pour around the bed.",
    cue: "Do not rush."
  },
  {
    id: "step_drawdown",
    label: "Drawdown",
    startsAtSeconds: 120,
    endsAtSeconds: 165,
    cumulativeWaterGrams: 300,
    instruction: "Let it drain cleanly.",
    cue: "Finish around 2:45."
  }
];

export const recipes: Recipe[] = [
  {
    id: "recipe_morning_v60",
    slug: "morning-clarity-v60",
    title: "Morning Clarity with V60",
    subtitle: "Clean, sweet and bright.",
    description:
      "A delicate and expressive cup that highlights jasmine florals, citrus lift and a silky clean finish.",
    method: "V60",
    visibility: "public",
    remixPolicy: "with_credit",
    commentPolicy: "public",
    coverUrl: images.v60Pour,
    author: currentUser,
    coffee: coffees[0],
    doseGrams: 20,
    waterGrams: 300,
    ratio: 15,
    temperatureCelsius: 95,
    grindLabel: "Medium-fine",
    grindSetting: "40-45 clicks",
    totalTimeSeconds: 165,
    difficulty: "intermediate",
    flavorNotes: ["Jasmine", "Bergamot", "White peach", "Honey"],
    tasteProfile: { sweetness: 82, acidity: 76, body: 56, balance: 80, finish: 74 },
    steps: morningSteps,
    gear,
    stats: { likes: 256, saves: 88, brews: 1280, averageRating: 4.8, remixes: 21, comments: 34 },
    createdAt: "2026-05-11T08:00:00.000Z",
    updatedAt: "2026-06-02T08:00:00.000Z"
  },
  {
    id: "recipe_origami",
    slug: "origami-sweet-balance",
    title: "Origami Sweet Balance",
    subtitle: "Round sweetness with a floral finish.",
    description: "A forgiving Origami recipe that keeps clarity without losing body.",
    method: "Origami",
    visibility: "public",
    remixPolicy: "with_credit",
    commentPolicy: "public",
    coverUrl: images.dripper,
    author: creators[1],
    coffee: coffees[0],
    doseGrams: 15,
    waterGrams: 250,
    ratio: 16.7,
    temperatureCelsius: 93,
    grindLabel: "Medium-fine",
    grindSetting: "9.5 EK43",
    totalTimeSeconds: 150,
    difficulty: "beginner",
    flavorNotes: ["Peach", "Tea", "Honey"],
    tasteProfile: { sweetness: 86, acidity: 68, body: 62, balance: 82, finish: 78 },
    steps: morningSteps.slice(0, 4).map((step, index) => ({
      ...step,
      id: `origami_${step.id}`,
      cumulativeWaterGrams: [40, 100, 160, 250][index] ?? 250
    })),
    gear: gear.slice(0, 2),
    stats: { likes: 198, saves: 54, brews: 764, averageRating: 4.7, remixes: 12, comments: 19 },
    createdAt: "2026-05-17T08:00:00.000Z",
    updatedAt: "2026-05-28T08:00:00.000Z"
  },
  {
    id: "recipe_aero",
    slug: "travel-aeropress",
    title: "Travel AeroPress",
    subtitle: "Reliable hotel-room cup.",
    description: "A compact recipe for repeatable sweetness while travelling.",
    method: "AeroPress",
    visibility: "public",
    remixPolicy: "ask_permission",
    commentPolicy: "followers",
    coverUrl: images.iced,
    author: creators[1],
    coffee: coffees[1],
    doseGrams: 16,
    waterGrams: 220,
    ratio: 13.8,
    temperatureCelsius: 90,
    grindLabel: "Medium",
    grindSetting: "24 clicks",
    totalTimeSeconds: 135,
    difficulty: "beginner",
    flavorNotes: ["Orange", "Cocoa", "Brown sugar"],
    tasteProfile: { sweetness: 74, acidity: 58, body: 70, balance: 72, finish: 64 },
    steps: morningSteps.slice(0, 3).map((step) => ({ ...step, id: `aero_${step.id}` })),
    gear: gear.slice(1, 3),
    stats: { likes: 142, saves: 39, brews: 455, averageRating: 4.6, remixes: 7, comments: 18 },
    createdAt: "2026-04-18T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z"
  }
];

export const brewLogs: BrewLog[] = [
  {
    id: "brew_1",
    title: "Sweet, clean cup after lowering temp",
    method: "V60",
    author: currentUser,
    recipe: recipes[0],
    coffee: coffees[0],
    brewedAt: "2026-06-10T07:30:00.000Z",
    doseGrams: 20,
    waterGrams: 300,
    temperatureCelsius: 93,
    grindSetting: "42 clicks",
    brewTimeSeconds: 170,
    rating: 5,
    tastingNotes: "Tasted very clean with floral notes and a longer finish.",
    flavorTags: ["floral", "sweet", "clean"],
    visibility: "public",
    photos: [images.v60Pour, images.dripper]
  },
  {
    id: "brew_2",
    title: "A little faster, brighter finish",
    method: "Origami",
    author: currentUser,
    recipe: recipes[1],
    coffee: coffees[0],
    brewedAt: "2026-06-09T08:10:00.000Z",
    doseGrams: 15,
    waterGrams: 250,
    temperatureCelsius: 94,
    grindSetting: "9.0 EK43",
    brewTimeSeconds: 145,
    rating: 4,
    tastingNotes: "Nice peach sweetness, could use slightly more body.",
    flavorTags: ["peach", "tea-like"],
    visibility: "followers",
    photos: [images.darkPour]
  }
];

export const feedItems: FeedItem[] = [
  { id: "feed_1", type: "recipe", recipe: recipes[0], author: recipes[0].author, createdAt: recipes[0].updatedAt },
  { id: "feed_2", type: "brew_log", brewLog: brewLogs[0], author: currentUser, createdAt: brewLogs[0].brewedAt },
  { id: "feed_3", type: "recipe", recipe: recipes[1], author: recipes[1].author, createdAt: recipes[1].updatedAt }
];

export const challenges: Challenge[] = [
  {
    id: "challenge_bloom",
    title: "Bloom control week",
    description: "Dial bloom water and agitation across three brews, then compare clarity and sweetness.",
    clubSlug: "pourover-lab",
    startsAt: "2026-06-08T00:00:00.000Z",
    endsAt: "2026-06-15T00:00:00.000Z",
    entryCount: 124
  },
  {
    id: "challenge_aeropress",
    title: "Travel recipe sprint",
    description: "Build a reliable AeroPress recipe with minimal gear and a 3-minute ceiling.",
    clubSlug: "home-barista-warsaw",
    startsAt: "2026-06-10T00:00:00.000Z",
    endsAt: "2026-06-17T00:00:00.000Z",
    entryCount: 68
  }
];

export const clubs: Club[] = [
  {
    id: "club_pourover_lab",
    slug: "pourover-lab",
    name: "Pour-over Lab",
    description: "Structured recipe experiments for V60, Origami, Kalita and Switch brewers.",
    visibility: "public",
    coverUrl: images.v60Pour,
    memberCount: 2480,
    activeChallengeId: challenges[0].id
  },
  {
    id: "club_home_barista_warsaw",
    slug: "home-barista-warsaw",
    name: "Home Barista Warsaw",
    description: "Local beans, gear swaps, cuppings and beginner-friendly brew feedback.",
    visibility: "public",
    coverUrl: images.cafe,
    memberCount: 620,
    activeChallengeId: challenges[1].id
  }
];

export const conversations: Conversation[] = [
  {
    id: "conversation_alex",
    participant: creators[1],
    lastMessage: "Try the same pour structure with 92C and a slightly finer grind.",
    unreadCount: 2,
    updatedAt: "2026-06-10T14:20:00.000Z"
  },
  {
    id: "conversation_tetsu",
    participant: currentUser,
    lastMessage: "Saved your recipe for tomorrow's comparison brew.",
    unreadCount: 0,
    updatedAt: "2026-06-09T18:05:00.000Z"
  }
];

export const notifications: Notification[] = [
  {
    id: "notification_comment",
    type: "comment",
    actor: creators[1],
    title: "New recipe question",
    body: "Alex asked what grind setting you used for Morning Clarity.",
    href: `/r/${currentUser.handle}/${recipes[0].slug}`,
    createdAt: "2026-06-10T15:15:00.000Z"
  },
  {
    id: "notification_challenge",
    type: "challenge",
    title: "Challenge started",
    body: "Bloom control week is live in Pour-over Lab.",
    href: "/challenges/challenge_bloom",
    createdAt: "2026-06-10T09:00:00.000Z"
  }
];
