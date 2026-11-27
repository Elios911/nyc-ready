/**
 * Expense categories: the single source of truth for category IDs in code.
 *
 * The same rows are inserted by `supabase/migrations/*_initial_schema.sql`.
 * A unit test (`categories.test.ts`) fails if the two drift apart.
 *
 * IDs are stable, human-readable slugs ("groceries.dairy_eggs"). Child IDs are
 * prefixed by their parent's ID so the top-level group is easy to derive.
 */

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  /** Lucide icon name, resolved in `components/finance/category-icon.tsx`. */
  icon: string;
  sortOrder: number;
}

type CategorySeed = Omit<ExpenseCategory, "sortOrder" | "parentId">;

function group(parent: CategorySeed, children: CategorySeed[]): ExpenseCategory[] {
  return [
    { ...parent, parentId: null, sortOrder: 0 },
    ...children.map((child, index) => ({ ...child, parentId: parent.id, sortOrder: index + 1 })),
  ];
}

export const CATEGORIES: ExpenseCategory[] = [
  ...group({ id: "housing", name: "Housing & utilities", description: "Rent, utilities, internet and running a home.", icon: "home" }, [
    { id: "housing.rent", name: "Rent", description: "Your share of monthly rent.", icon: "key-round" },
    { id: "housing.utilities", name: "Electricity & gas", description: "Utility bills.", icon: "zap" },
    { id: "housing.internet_phone", name: "Internet & phone", description: "Home internet and mobile plans.", icon: "wifi" },
    { id: "housing.household", name: "Household supplies", description: "Cleaning products, paper goods, small items.", icon: "spray-can" },
    { id: "housing.laundry", name: "Laundry", description: "Laundromat, wash-and-fold, detergent.", icon: "shirt" },
  ]),
  ...group({ id: "groceries", name: "Groceries", description: "Food and household products bought at stores.", icon: "shopping-basket" }, [
    { id: "groceries.dairy_eggs", name: "Dairy & eggs", description: "Milk, eggs, cheese, yogurt.", icon: "milk" },
    { id: "groceries.bakery", name: "Bread & bakery", description: "Bread, bagels, tortillas.", icon: "croissant" },
    { id: "groceries.meat_seafood", name: "Meat & seafood", description: "Chicken, beef, fish.", icon: "drumstick" },
    { id: "groceries.produce", name: "Fruits & vegetables", description: "Fresh produce.", icon: "apple" },
    { id: "groceries.pantry", name: "Pantry staples", description: "Rice, pasta, canned and dry goods.", icon: "package" },
    { id: "groceries.snacks", name: "Snacks", description: "Chips, bars, sweets.", icon: "cookie" },
    { id: "groceries.coffee_tea", name: "Coffee & tea", description: "Beans, grounds and tea for home.", icon: "coffee" },
  ]),
  ...group({ id: "transportation", name: "Transportation", description: "Getting around the city.", icon: "train-front" }, [
    { id: "transportation.transit", name: "Subway & bus", description: "MTA fares and passes.", icon: "train-front" },
    { id: "transportation.rideshare", name: "Rideshare & taxi", description: "Occasional rides.", icon: "car-taxi-front" },
    { id: "transportation.bike_other", name: "Bike & other", description: "Bike share, ferry, other options.", icon: "bike" },
  ]),
  ...group({ id: "fitness", name: "Fitness", description: "Staying active.", icon: "dumbbell" }, [
    { id: "fitness.gym", name: "Gym membership", description: "Monthly gym access.", icon: "dumbbell" },
    { id: "fitness.classes", name: "Fitness classes", description: "Drop-in or class packs.", icon: "activity" },
    { id: "fitness.recreation", name: "Recreation", description: "Climbing, courts, pools and other activities.", icon: "mountain" },
  ]),
  ...group({ id: "personal", name: "Clothing & personal care", description: "Looking and feeling good.", icon: "sparkles" }, [
    { id: "personal.clothing", name: "Clothing", description: "Everyday clothes.", icon: "shirt" },
    { id: "personal.shoes", name: "Shoes", description: "Footwear.", icon: "footprints" },
    { id: "personal.haircut", name: "Haircuts & grooming", description: "Barber, salon.", icon: "scissors" },
    { id: "personal.skincare_hygiene", name: "Skincare & hygiene", description: "Toiletries and skincare.", icon: "droplet" },
  ]),
  ...group({ id: "lifestyle", name: "Entertainment & lifestyle", description: "Eating out, going out, hobbies.", icon: "ticket" }, [
    { id: "lifestyle.restaurants", name: "Restaurants", description: "Meals out and takeout.", icon: "utensils" },
    { id: "lifestyle.coffee_shops", name: "Coffee shops", description: "Coffee and snacks out.", icon: "coffee" },
    { id: "lifestyle.bars_social", name: "Bars & social", description: "Drinks and nights out.", icon: "wine" },
    { id: "lifestyle.movies_events", name: "Movies & events", description: "Tickets, shows, concerts.", icon: "clapperboard" },
    { id: "lifestyle.hobbies", name: "Hobbies", description: "Supplies and activities.", icon: "palette" },
  ]),
  ...group({ id: "health", name: "Health & insurance", description: "Healthcare and insurance.", icon: "heart-pulse" }, [
    { id: "health.insurance", name: "Insurance premiums", description: "Health, renters or other insurance.", icon: "shield" },
    { id: "health.medical", name: "Medical & dental", description: "Copays and out-of-pocket care.", icon: "stethoscope" },
    { id: "health.pharmacy", name: "Pharmacy", description: "Prescriptions and over-the-counter.", icon: "pill" },
  ]),
  ...group({ id: "subscriptions", name: "Subscriptions", description: "Streaming, software and memberships.", icon: "repeat" }, []),
  ...group({ id: "income", name: "Income", description: "Income on top of take-home pay.", icon: "wallet" }, []),
  ...group({ id: "savings", name: "Savings", description: "Money set aside on purpose.", icon: "piggy-bank" }, [
    { id: "savings.emergency", name: "Emergency fund", description: "A cushion for surprises.", icon: "life-buoy" },
    { id: "savings.relocation", name: "Relocation fund", description: "Saving for the move itself.", icon: "truck" },
    { id: "savings.general", name: "General savings & investing", description: "Long-term savings goals.", icon: "trending-up" },
  ]),
  ...group({ id: "relocation", name: "Moving & setup", description: "One-time costs to get settled.", icon: "truck" }, [
    { id: "relocation.deposit", name: "Security deposit & fees", description: "Deposit, application and broker fees.", icon: "key-round" },
    { id: "relocation.first_rent", name: "First month's rent", description: "Rent due at signing.", icon: "calendar" },
    { id: "relocation.moving", name: "Moving costs", description: "Movers, truck, travel.", icon: "truck" },
    { id: "relocation.furniture", name: "Furniture", description: "Bed, desk, essentials.", icon: "sofa" },
    { id: "relocation.setup", name: "Initial household purchases", description: "Kitchen, bedding, first stock-up.", icon: "package-open" },
  ]),
  ...group({ id: "other", name: "Other", description: "Anything that doesn't fit elsewhere.", icon: "circle-ellipsis" }, []),
];

const BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export function getCategory(id: string | null | undefined): ExpenseCategory | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function isKnownCategory(id: string): boolean {
  return BY_ID.has(id);
}

/** The top-level group of a category ("groceries.produce" → "groceries"). */
export function topLevelCategoryId(id: string): string {
  let current = BY_ID.get(id);
  while (current?.parentId) current = BY_ID.get(current.parentId);
  return current?.id ?? "other";
}

export const TOP_LEVEL_CATEGORIES = CATEGORIES.filter((category) => category.parentId === null);

export function childCategories(parentId: string): ExpenseCategory[] {
  return CATEGORIES.filter((category) => category.parentId === parentId);
}

/** Categories that represent spending (used for expense pickers and the Cost Explorer). */
export const SPENDING_GROUP_IDS = [
  "housing",
  "groceries",
  "transportation",
  "fitness",
  "personal",
  "lifestyle",
  "health",
  "subscriptions",
  "other",
] as const;

/** Category groups that make sense for each budget item type. */
export function categoryGroupsForItemType(
  itemType: "income" | "fixed" | "variable" | "savings" | "relocation",
): string[] {
  switch (itemType) {
    case "income":
      return ["income"];
    case "savings":
      return ["savings"];
    case "relocation":
      return ["relocation"];
    default:
      return [...SPENDING_GROUP_IDS];
  }
}
