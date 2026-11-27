import type { ActivityType } from "@/lib/domain/types";

/** Left-border accent per activity type. Muted so a full week stays calm to look at. */
export const ACTIVITY_ACCENT: Record<ActivityType, string> = {
  work: "border-l-slate-400",
  commute: "border-l-sky-500",
  groceries: "border-l-emerald-500",
  cooking: "border-l-emerald-300",
  dining_out: "border-l-amber-500",
  fitness: "border-l-indigo-500",
  social: "border-l-rose-400",
  shopping: "border-l-violet-400",
  entertainment: "border-l-fuchsia-400",
  personal: "border-l-teal-400",
  other: "border-l-zinc-300",
};

/** Category suggested when an activity type is picked (the user can change it). */
export const ACTIVITY_DEFAULT_CATEGORY: Record<ActivityType, string> = {
  work: "",
  commute: "transportation.transit",
  groceries: "groceries",
  cooking: "",
  dining_out: "lifestyle.restaurants",
  fitness: "fitness",
  social: "lifestyle.bars_social",
  shopping: "personal.clothing",
  entertainment: "lifestyle.movies_events",
  personal: "personal",
  other: "",
};
