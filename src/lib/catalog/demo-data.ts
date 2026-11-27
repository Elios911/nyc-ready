import type { CatalogEntry, CostItem, DataSource, PriceObservation } from "./types";

/**
 * ⚠️ DEMONSTRATION DATA — NOT REAL PRICES.
 *
 * Every price below is an illustrative round number written by hand so the
 * Cost Explorer can be explored without a database. They are not observed
 * prices, not averages and not estimates of the current market. Merchants are
 * deliberately fictional ("Demo Market A"). Every observation is flagged
 * `isDemo: true` and attached to the "demo" source type, so the UI always
 * labels it "Demo data".
 *
 * The same records are written to `supabase/seed.sql` by
 * `npm run db:seed:generate`, so a fresh Supabase project shows the same
 * (clearly labelled) catalog until real sources are imported.
 */

export const DEMO_SOURCE: DataSource = {
  id: "demo-source",
  name: "NYC Ready demonstration data",
  sourceType: "demo",
  sourceUrl: null,
  description: "Hand-written illustrative prices bundled with the app for development and demos.",
  geographicScope: "Illustrative only",
  limitations: "Not real prices. Do not use for real planning. Replace with verified sources before launch.",
  refreshIntervalDays: null,
};

/** Fixed date so demo records are deterministic (freshness is always "Demo data" anyway). */
export const DEMO_OBSERVED_AT = "2026-11-01T12:00:00.000Z";

type DemoPrice = [merchant: string, location: string, priceCents: number, quantity: number];
type DemoItem = {
  slug: string;
  name: string;
  categoryId: string;
  unit: string;
  packageSize: number;
  description?: string;
  prices: DemoPrice[];
};

const A = "Demo Market A";
const B = "Demo Grocer B";
const C = "Demo Corner Store C";

const ITEMS: DemoItem[] = [
  // Groceries
  { slug: "whole-milk-gallon", name: "Whole milk", categoryId: "groceries.dairy_eggs", unit: "gallon", packageSize: 1, prices: [[A, "Astoria, Queens", 500, 1], [B, "Bushwick, Brooklyn", 300, 0.5], [C, "Upper West Side, Manhattan", 600, 1]] },
  { slug: "eggs-dozen", name: "Large eggs", categoryId: "groceries.dairy_eggs", unit: "dozen", packageSize: 1, prices: [[A, "Astoria, Queens", 450, 1], [B, "Bushwick, Brooklyn", 800, 2]] },
  { slug: "cheddar-cheese", name: "Cheddar cheese", categoryId: "groceries.dairy_eggs", unit: "lb", packageSize: 0.5, prices: [[A, "Astoria, Queens", 450, 0.5], [B, "Bushwick, Brooklyn", 700, 1]] },
  { slug: "greek-yogurt", name: "Greek yogurt", categoryId: "groceries.dairy_eggs", unit: "oz", packageSize: 32, prices: [[A, "Astoria, Queens", 600, 32]] },
  { slug: "sandwich-bread", name: "Sandwich bread", categoryId: "groceries.bakery", unit: "loaf", packageSize: 1, prices: [[A, "Astoria, Queens", 400, 1], [C, "Upper West Side, Manhattan", 550, 1]] },
  { slug: "bagels-6", name: "Bagels", categoryId: "groceries.bakery", unit: "each", packageSize: 6, description: "Bakery bagels, sold by the half dozen.", prices: [[B, "Bushwick, Brooklyn", 750, 6]] },
  { slug: "white-rice", name: "White rice", categoryId: "groceries.pantry", unit: "lb", packageSize: 2, prices: [[A, "Astoria, Queens", 350, 2], [B, "Bushwick, Brooklyn", 1200, 10]] },
  { slug: "dry-pasta", name: "Dry pasta", categoryId: "groceries.pantry", unit: "lb", packageSize: 1, prices: [[A, "Astoria, Queens", 200, 1], [B, "Bushwick, Brooklyn", 300, 1]] },
  { slug: "canned-beans", name: "Canned beans", categoryId: "groceries.pantry", unit: "oz", packageSize: 15, prices: [[A, "Astoria, Queens", 150, 15]] },
  { slug: "chicken-breast", name: "Chicken breast", categoryId: "groceries.meat_seafood", unit: "lb", packageSize: 1, prices: [[A, "Astoria, Queens", 600, 1], [B, "Bushwick, Brooklyn", 1500, 3]] },
  { slug: "ground-beef", name: "Ground beef", categoryId: "groceries.meat_seafood", unit: "lb", packageSize: 1, prices: [[A, "Astoria, Queens", 700, 1], [B, "Bushwick, Brooklyn", 650, 1]] },
  { slug: "salmon-fillet", name: "Salmon fillet", categoryId: "groceries.meat_seafood", unit: "lb", packageSize: 1, prices: [[A, "Astoria, Queens", 1300, 1]] },
  { slug: "bananas", name: "Bananas", categoryId: "groceries.produce", unit: "lb", packageSize: 1, prices: [[A, "Astoria, Queens", 80, 1], [C, "Upper West Side, Manhattan", 100, 1]] },
  { slug: "apples", name: "Apples", categoryId: "groceries.produce", unit: "lb", packageSize: 1, prices: [[A, "Astoria, Queens", 250, 1], [B, "Bushwick, Brooklyn", 600, 3]] },
  { slug: "spinach", name: "Baby spinach", categoryId: "groceries.produce", unit: "oz", packageSize: 5, prices: [[A, "Astoria, Queens", 400, 5]] },
  { slug: "onions", name: "Yellow onions", categoryId: "groceries.produce", unit: "lb", packageSize: 3, prices: [[B, "Bushwick, Brooklyn", 400, 3]] },
  { slug: "potato-chips", name: "Potato chips", categoryId: "groceries.snacks", unit: "oz", packageSize: 8, prices: [[A, "Astoria, Queens", 450, 8], [C, "Upper West Side, Manhattan", 550, 8]] },
  { slug: "granola-bars", name: "Granola bars", categoryId: "groceries.snacks", unit: "each", packageSize: 6, prices: [[A, "Astoria, Queens", 500, 6]] },
  { slug: "ground-coffee", name: "Ground coffee", categoryId: "groceries.coffee_tea", unit: "oz", packageSize: 12, prices: [[A, "Astoria, Queens", 1000, 12], [B, "Bushwick, Brooklyn", 1500, 24]] },
  { slug: "paper-towels", name: "Paper towels", categoryId: "housing.household", unit: "roll", packageSize: 6, prices: [[A, "Astoria, Queens", 1000, 6]] },
  { slug: "dish-soap", name: "Dish soap", categoryId: "housing.household", unit: "oz", packageSize: 20, prices: [[A, "Astoria, Queens", 350, 20]] },

  // Transportation
  { slug: "subway-bus-ride", name: "Subway or local bus ride", categoryId: "transportation.transit", unit: "ride", packageSize: 1, description: "Single fare. Check the MTA's official fare page for current fares and fare-capping rules.", prices: [["Demo transit fare", "NYC (all boroughs)", 300, 1]] },
  { slug: "monthly-transit-pass", name: "Unlimited monthly transit pass", categoryId: "transportation.transit", unit: "month", packageSize: 1, prices: [["Demo transit fare", "NYC (all boroughs)", 13500, 1]] },
  { slug: "rideshare-trip", name: "Rideshare trip (short, within a borough)", categoryId: "transportation.rideshare", unit: "ride", packageSize: 1, prices: [["Demo rideshare", "Brooklyn", 2000, 1]] },
  { slug: "bike-share-membership", name: "Bike share annual membership", categoryId: "transportation.bike_other", unit: "year", packageSize: 1, prices: [["Demo bike share", "NYC service area", 22000, 1]] },

  // Fitness
  { slug: "budget-gym-membership", name: "Budget gym membership", categoryId: "fitness.gym", unit: "month", packageSize: 1, prices: [["Demo Gym A", "Astoria, Queens", 2500, 1]] },
  { slug: "full-service-gym-membership", name: "Full-service gym membership", categoryId: "fitness.gym", unit: "month", packageSize: 1, prices: [["Demo Gym B", "Midtown, Manhattan", 9000, 1]] },
  { slug: "boutique-fitness-class", name: "Boutique fitness class (drop-in)", categoryId: "fitness.classes", unit: "class", packageSize: 1, prices: [["Demo Studio C", "Williamsburg, Brooklyn", 3500, 1]] },
  { slug: "climbing-day-pass", name: "Climbing gym day pass", categoryId: "fitness.recreation", unit: "visit", packageSize: 1, prices: [["Demo Climbing", "Gowanus, Brooklyn", 3000, 1]] },

  // Clothing & personal care
  { slug: "basic-t-shirt", name: "Basic T-shirt", categoryId: "personal.clothing", unit: "each", packageSize: 1, prices: [["Demo Apparel", "SoHo, Manhattan", 1500, 1]] },
  { slug: "winter-coat", name: "Winter coat", categoryId: "personal.clothing", unit: "each", packageSize: 1, prices: [["Demo Apparel", "SoHo, Manhattan", 15000, 1]] },
  { slug: "everyday-sneakers", name: "Everyday sneakers", categoryId: "personal.shoes", unit: "each", packageSize: 1, prices: [["Demo Shoes", "Downtown Brooklyn", 8000, 1]] },
  { slug: "haircut-basic", name: "Basic haircut", categoryId: "personal.haircut", unit: "service", packageSize: 1, prices: [["Demo Barber", "Astoria, Queens", 3000, 1], ["Demo Salon", "West Village, Manhattan", 7000, 1]] },
  { slug: "shampoo", name: "Shampoo", categoryId: "personal.skincare_hygiene", unit: "oz", packageSize: 12, prices: [["Demo Pharmacy", "Astoria, Queens", 800, 12]] },
  { slug: "toothpaste", name: "Toothpaste", categoryId: "personal.skincare_hygiene", unit: "oz", packageSize: 4, prices: [["Demo Pharmacy", "Astoria, Queens", 450, 4]] },

  // Housing & utilities
  { slug: "room-in-shared-apartment", name: "Room in a shared apartment", categoryId: "housing.rent", unit: "month", packageSize: 1, description: "Your share of rent with roommates.", prices: [["Demo listing average", "Astoria, Queens", 140000, 1], ["Demo listing average", "Bushwick, Brooklyn", 150000, 1]] },
  { slug: "studio-apartment", name: "Studio apartment", categoryId: "housing.rent", unit: "month", packageSize: 1, prices: [["Demo listing average", "Astoria, Queens", 230000, 1], ["Demo listing average", "Upper East Side, Manhattan", 290000, 1]] },
  { slug: "electricity-bill", name: "Electricity & gas (1-bedroom share)", categoryId: "housing.utilities", unit: "month", packageSize: 1, prices: [["Demo utility", "NYC", 9000, 1]] },
  { slug: "home-internet", name: "Home internet", categoryId: "housing.internet_phone", unit: "month", packageSize: 1, prices: [["Demo ISP", "NYC", 6000, 1]] },
  { slug: "mobile-phone-plan", name: "Mobile phone plan", categoryId: "housing.internet_phone", unit: "month", packageSize: 1, prices: [["Demo Carrier", "National", 4000, 1]] },
  { slug: "laundromat-load", name: "Laundromat wash & dry", categoryId: "housing.laundry", unit: "load", packageSize: 1, prices: [["Demo Laundromat", "Bushwick, Brooklyn", 600, 1]] },
  { slug: "renters-insurance", name: "Renters insurance", categoryId: "health.insurance", unit: "month", packageSize: 1, prices: [["Demo Insurer", "New York State", 1500, 1]] },

  // Entertainment & lifestyle
  { slug: "casual-dinner", name: "Casual dinner out (per person)", categoryId: "lifestyle.restaurants", unit: "each", packageSize: 1, prices: [["Demo Restaurant", "Astoria, Queens", 3000, 1], ["Demo Restaurant", "East Village, Manhattan", 4000, 1]] },
  { slug: "slice-of-pizza", name: "Slice of pizza", categoryId: "lifestyle.restaurants", unit: "each", packageSize: 1, prices: [["Demo Pizzeria", "Midtown, Manhattan", 400, 1]] },
  { slug: "drip-coffee", name: "Drip coffee", categoryId: "lifestyle.coffee_shops", unit: "each", packageSize: 1, prices: [["Demo Café", "Astoria, Queens", 300, 1], ["Demo Café", "Financial District, Manhattan", 400, 1]] },
  { slug: "latte", name: "Latte", categoryId: "lifestyle.coffee_shops", unit: "each", packageSize: 1, prices: [["Demo Café", "Astoria, Queens", 550, 1]] },
  { slug: "beer-at-bar", name: "Draft beer at a bar", categoryId: "lifestyle.bars_social", unit: "each", packageSize: 1, prices: [["Demo Bar", "Williamsburg, Brooklyn", 900, 1]] },
  { slug: "movie-ticket", name: "Movie ticket", categoryId: "lifestyle.movies_events", unit: "ticket", packageSize: 1, prices: [["Demo Cinema", "Union Square, Manhattan", 2000, 1]] },
  { slug: "streaming-subscription", name: "Video streaming subscription", categoryId: "subscriptions", unit: "month", packageSize: 1, prices: [["Demo Streaming", "National", 1500, 1]] },
];

function toCostItem(item: DemoItem): CostItem {
  return {
    id: item.slug,
    slug: item.slug,
    name: item.name,
    description: item.description ?? null,
    categoryId: item.categoryId,
    brand: null,
    unit: item.unit,
    packageSize: item.packageSize,
    productIdentifier: null,
    imageUrl: null,
  };
}

function toObservations(item: DemoItem): PriceObservation[] {
  return item.prices.map(([merchantName, location, priceCents, quantity], index) => ({
    id: `${item.slug}-${index}`,
    costItemId: item.slug,
    dataSourceId: DEMO_SOURCE.id,
    merchantName,
    location,
    priceCents,
    currency: "USD",
    packageQuantity: quantity,
    observedAt: DEMO_OBSERVED_AT,
    verifiedAt: null,
    priceType: "demo",
    confidenceLevel: "low",
    expiresAt: null,
    isDemo: true,
  }));
}

export const DEMO_CATALOG: CatalogEntry[] = ITEMS.map((item) => ({
  item: toCostItem(item),
  prices: toObservations(item).map((observation) => ({ ...observation, source: DEMO_SOURCE })),
}));
