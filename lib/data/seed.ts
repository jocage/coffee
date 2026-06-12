import type {
  BrewLog,
  Challenge,
  Club,
  CoffeeBean,
  Conversation,
  FeedItem,
  GearItem,
  DripperCatalogItem,
  GrinderCatalogItem,
  Notification,
  Recipe,
  UserProfile
} from "@/lib/domain";
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
  defaultCommentPolicy: "public",
  messagePolicy: "followers",
  showGearOnProfile: true,
  showCoffeeOnProfile: true,
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
    defaultCommentPolicy: "public",
    messagePolicy: "followers",
    showGearOnProfile: true,
    showCoffeeOnProfile: true,
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

export const grinderCatalog: GrinderCatalogItem[] = [
  {
    id: "catalog_comandante_c40_mk4",
    name: "Comandante C40",
    brand: "Comandante",
    model: "C40 MK4",
    grinderDrive: "manual",
    burrType: "Stainless steel conical burrs",
    filterRange: "40-45 clicks",
    notes: "Reference hand grinder for pour-over recipes.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_comandante_c60",
    name: "Comandante C60 Baracuda",
    brand: "Comandante",
    model: "C60 Baracuda",
    grinderDrive: "manual",
    burrType: "Stainless steel conical burrs",
    filterRange: "35-45 clicks",
    notes: "High-capacity hand grinder with espresso-capable adjustment.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_1zpresso_zp6_special",
    name: "1Zpresso ZP6 Special",
    brand: "1Zpresso",
    model: "ZP6 Special",
    grinderDrive: "manual",
    burrType: "Stainless steel heptagonal burrs",
    filterRange: "4.0-5.5",
    notes: "Clarity-focused hand grinder for filter coffee.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_1zpresso_j_ultra",
    name: "1Zpresso J-Ultra",
    brand: "1Zpresso",
    model: "J-Ultra",
    grinderDrive: "manual",
    burrType: "Stainless steel coated conical burrs",
    filterRange: "Espresso 1.0-2.0, filter 3.5-5.5",
    notes: "Espresso-focused hand grinder with fine external adjustment.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_1zpresso_k_ultra",
    name: "1Zpresso K-Ultra",
    brand: "1Zpresso",
    model: "K-Ultra",
    grinderDrive: "manual",
    burrType: "Stainless steel heptagonal burrs",
    filterRange: "6.0-8.0",
    notes: "All-round hand grinder with external adjustment.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_kingrinder_k6",
    name: "KINGrinder K6",
    brand: "KINGrinder",
    model: "K6",
    grinderDrive: "manual",
    burrType: "Stainless steel heptagonal burrs",
    filterRange: "90-120 clicks",
    notes: "Popular value hand grinder for filter and espresso.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_timemore_chestnut_c3",
    name: "Timemore Chestnut C3",
    brand: "Timemore",
    model: "Chestnut C3",
    grinderDrive: "manual",
    burrType: "S2C stainless steel burrs",
    filterRange: "13-18 clicks",
    notes: "Compact entry-level hand grinder.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_fellow_ode_gen_2",
    name: "Fellow Ode Gen 2",
    brand: "Fellow",
    model: "Ode Gen 2",
    grinderDrive: "electric",
    burrType: "64 mm flat burrs",
    filterRange: "4-7",
    notes: "Single-dose electric grinder for brewed coffee.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_fellow_opus",
    name: "Fellow Opus",
    brand: "Fellow",
    model: "Opus",
    grinderDrive: "electric",
    burrType: "40 mm conical burrs",
    filterRange: "Espresso 1-3, filter 6-9",
    notes: "Compact all-purpose grinder for espresso and brewed coffee.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_df64_gen_2",
    name: "DF64 Gen 2",
    brand: "DF64",
    model: "Gen 2",
    grinderDrive: "electric",
    burrType: "64 mm flat burrs",
    filterRange: "50-70",
    notes: "Single-dose flat burr grinder with broad burr compatibility.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_baratza_encore_esp",
    name: "Baratza Encore ESP",
    brand: "Baratza",
    model: "Encore ESP",
    grinderDrive: "electric",
    burrType: "40 mm conical burrs",
    filterRange: "18-28",
    notes: "Home grinder covering espresso and filter ranges.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_baratza_vario_w_plus",
    name: "Baratza Vario W+",
    brand: "Baratza",
    model: "Vario W+",
    grinderDrive: "electric",
    burrType: "54 mm flat burrs",
    filterRange: "Espresso macro 1-2, filter macro 5-8",
    notes: "Weight-based grinder that can cover espresso and filter.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_eureka_mignon_specialita",
    name: "Eureka Mignon Specialita",
    brand: "Eureka",
    model: "Mignon Specialita",
    grinderDrive: "electric",
    burrType: "55 mm flat burrs",
    filterRange: "",
    notes: "Quiet espresso-focused grinder with stepless adjustment.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_niche_zero",
    name: "Niche Zero",
    brand: "Niche",
    model: "Zero",
    grinderDrive: "electric",
    burrType: "63 mm conical burrs",
    filterRange: "40-50",
    notes: "Single-dose conical burr grinder for home espresso and filter.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_niche_duo",
    name: "Niche Duo",
    brand: "Niche",
    model: "Duo",
    grinderDrive: "electric",
    burrType: "83 mm flat burrs",
    filterRange: "Espresso 10-20, filter 35-50",
    notes: "Single-dose flat burr grinder with espresso/filter burr options.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_varia_vs3",
    name: "Varia VS3",
    brand: "Varia",
    model: "VS3",
    grinderDrive: "electric",
    burrType: "38 mm conical burrs",
    filterRange: "4-8",
    notes: "Compact single-dose grinder.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_mahlkonig_ek43",
    name: "Mahlkonig EK43",
    brand: "Mahlkonig",
    model: "EK43",
    grinderDrive: "electric",
    burrType: "98 mm flat burrs",
    filterRange: "8-11",
    notes: "Commercial grinder used as a shop benchmark.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_mahlkonig_x54",
    name: "Mahlkonig X54",
    brand: "Mahlkonig",
    model: "X54",
    grinderDrive: "electric",
    burrType: "54 mm flat burrs",
    filterRange: "Espresso 1-3, filter 7-10",
    notes: "Home all-rounder with espresso and filter presets.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_lagom_p64",
    name: "Option-O Lagom P64",
    brand: "Option-O",
    model: "Lagom P64",
    grinderDrive: "electric",
    burrType: "64 mm flat burrs",
    filterRange: "Espresso 0.5-2.0, filter 6.0-9.0",
    notes: "Single-dose flat burr grinder with burr-dependent settings.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_lagom_mini",
    name: "Option-O Lagom Mini",
    brand: "Option-O",
    model: "Lagom Mini",
    grinderDrive: "electric",
    burrType: "48 mm conical burrs",
    filterRange: "Espresso 0.5-1.5, filter 3.5-6.0",
    notes: "Compact single-dose grinder for home brewing.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_timemore_sculptor_078",
    name: "Timemore Sculptor 078",
    brand: "Timemore",
    model: "Sculptor 078",
    grinderDrive: "electric",
    burrType: "78 mm turbo flat burrs",
    filterRange: "8-12",
    notes: "Filter-focused electric grinder.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_timemore_sculptor_078s",
    name: "Timemore Sculptor 078S",
    brand: "Timemore",
    model: "Sculptor 078S",
    grinderDrive: "electric",
    burrType: "78 mm flat burrs",
    filterRange: "Espresso 2-5, filter 10-14",
    notes: "Espresso-capable version with broader adjustment.",
    imageUrl: images.grinder,
    status: "approved"
  },
  {
    id: "catalog_weber_eg1",
    name: "Weber EG-1",
    brand: "Weber Workshops",
    model: "EG-1",
    grinderDrive: "electric",
    burrType: "80 mm flat burrs",
    filterRange: "Espresso 4-7, filter 9-12",
    notes: "High-end single-dose grinder for espresso and filter.",
    imageUrl: images.grinder,
    status: "approved"
  }
];

export const dripperCatalog: DripperCatalogItem[] = [
  {
    id: "catalog_hario_v60_02",
    name: "Hario V60 02",
    brand: "Hario",
    model: "V60 02",
    material: "Ceramic, plastic, glass, metal",
    size: "02",
    brewSpeed: "Fast",
    compatibleFilters: "V60 02",
    notes: "Classic conical dripper with high flow and clear cups.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_origami_air_s",
    name: "Origami Air S",
    brand: "Origami",
    model: "Air S",
    material: "AS resin",
    size: "S",
    brewSpeed: "Fast to balanced",
    compatibleFilters: "V60 01, Kalita 155",
    notes: "Ribbed cone that supports conical and wave filters.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_origami_air_m",
    name: "Origami Air M",
    brand: "Origami",
    model: "Air M",
    material: "AS resin",
    size: "M",
    brewSpeed: "Fast to balanced",
    compatibleFilters: "V60 02, Kalita 185",
    notes: "Flexible dripper for one or two-cup recipes.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_kalita_wave_185",
    name: "Kalita Wave 185",
    brand: "Kalita",
    model: "Wave 185",
    material: "Stainless steel, glass, ceramic",
    size: "185",
    brewSpeed: "Balanced",
    compatibleFilters: "Kalita 185",
    notes: "Flat-bottom dripper with repeatable extraction.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_hario_switch_03",
    name: "Hario Switch 03",
    brand: "Hario",
    model: "Switch 03",
    material: "Glass and silicone",
    size: "03",
    brewSpeed: "Immersion / hybrid",
    compatibleFilters: "V60 03",
    notes: "Immersion-capable V60-style dripper.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_orea_v4_wide",
    name: "Orea V4 Wide",
    brand: "Orea",
    model: "V4 Wide",
    material: "Polypropylene",
    size: "Wide",
    brewSpeed: "Fast",
    compatibleFilters: "Orea flat, negotiated Kalita 185",
    notes: "Modern fast flat-bottom brewer with interchangeable bottoms.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_april_plastic",
    name: "April Plastic Brewer",
    brand: "April",
    model: "Plastic Brewer",
    material: "Plastic",
    size: "155/185 style",
    brewSpeed: "Balanced",
    compatibleFilters: "April, Kalita 155/185",
    notes: "Flat-bottom brewer tuned for April-style pulse pours.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_orea_big_boy",
    name: "Orea Big Boy",
    brand: "Orea",
    model: "Big Boy",
    material: "Polypropylene",
    size: "Large",
    brewSpeed: "Fast",
    compatibleFilters: "Large flat-bottom filters",
    notes: "Large batch flat-bottom brewer.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_cafec_flower_02",
    name: "Cafec Flower Dripper 02",
    brand: "Cafec",
    model: "Flower 02",
    material: "Tritan, ceramic",
    size: "02",
    brewSpeed: "Fast",
    compatibleFilters: "V60 02, Cafec cone 02",
    notes: "Cone dripper with deep petal ribs and high flow.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_clever_large",
    name: "Clever Dripper Large",
    brand: "Clever",
    model: "Large",
    material: "Plastic",
    size: "Large",
    brewSpeed: "Immersion",
    compatibleFilters: "Melitta #4",
    notes: "Immersion brewer with drawdown release valve.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_tricolate",
    name: "Tricolate Brewer",
    brand: "Tricolate",
    model: "Brewer",
    material: "Tritan",
    size: "Standard",
    brewSpeed: "Slow / high extraction",
    compatibleFilters: "Tricolate filters",
    notes: "No-bypass brewer for high extraction filter recipes.",
    imageUrl: images.dripper,
    status: "approved"
  },
  {
    id: "catalog_nextlevel_pulsar",
    name: "NextLevel Pulsar",
    brand: "NextLevel",
    model: "Pulsar",
    material: "Plastic",
    size: "Standard",
    brewSpeed: "No-bypass / controllable",
    compatibleFilters: "Pulsar filters",
    notes: "No-bypass brewer with flow-control valve.",
    imageUrl: images.dripper,
    status: "approved"
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
  {
    id: "feed_1",
    type: "recipe",
    recipe: recipes[0],
    author: recipes[0].author,
    createdAt: recipes[0].updatedAt
  },
  {
    id: "feed_2",
    type: "brew_log",
    brewLog: brewLogs[0],
    author: currentUser,
    createdAt: brewLogs[0].brewedAt
  },
  {
    id: "feed_3",
    type: "recipe",
    recipe: recipes[1],
    author: recipes[1].author,
    createdAt: recipes[1].updatedAt
  }
];

export const challenges: Challenge[] = [
  {
    id: "challenge_bloom",
    title: "Bloom control week",
    description:
      "Dial bloom water and agitation across three brews, then compare clarity and sweetness.",
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
