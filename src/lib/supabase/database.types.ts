/**
 * Database types for the Supabase client.
 *
 * Hand-written to match supabase/migrations. Once you have a Supabase project
 * you can regenerate this file instead:
 *
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 *
 * Keep the `Database` export name so imports keep working.
 */

type Timestamp = string;

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  expected_move_date: string | null;
  annual_gross_income_cents: number | null;
  monthly_take_home_income_cents: number | null;
  current_savings_cents: number | null;
  household_size: number | null;
  living_arrangement: string | null;
  preferred_neighborhoods: string[];
  work_location: string | null;
  commute_days_per_week: number | null;
  lifestyle_preferences: string[];
  onboarding_completed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ScenarioRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  monthly_take_home_income_cents: number | null;
  current_savings_cents: number | null;
  is_primary: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type BudgetItemRow = {
  id: string;
  scenario_id: string;
  user_id: string;
  category_id: string;
  cost_item_id: string | null;
  name: string;
  amount_cents: number;
  frequency: string;
  item_type: string;
  notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ScheduleBlockRow = {
  id: string;
  scenario_id: string;
  user_id: string;
  day_of_week: number;
  title: string;
  activity_type: string;
  start_time: string;
  end_time: string;
  estimated_cost_cents: number;
  category_id: string | null;
  location: string | null;
  notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ExpenseCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  icon: string | null;
  sort_order: number;
  created_at: Timestamp;
};

export type DataSourceRow = {
  id: string;
  slug: string;
  name: string;
  source_type: string;
  source_url: string | null;
  description: string | null;
  geographic_scope: string | null;
  limitations: string | null;
  refresh_interval_days: number | null;
  created_at: Timestamp;
};

export type CostItemRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string;
  brand: string | null;
  unit: string;
  package_size: number | null;
  product_identifier: string | null;
  image_url: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type PriceObservationRow = {
  id: string;
  cost_item_id: string;
  data_source_id: string;
  merchant_name: string | null;
  location: string | null;
  price_cents: number;
  currency: string;
  package_quantity: number | null;
  unit_price_cents: number | null;
  observed_at: Timestamp;
  verified_at: Timestamp | null;
  price_type: string;
  confidence_level: string;
  expires_at: Timestamp | null;
  is_demo: boolean;
  submitted_by: string | null;
  created_at: Timestamp;
};

type Generated = "id" | "created_at" | "updated_at";
type InsertOf<Row, Optional extends keyof Row = never> = Omit<Row, Generated | Optional> &
  Partial<Pick<Row, Extract<Generated | Optional, keyof Row>>>;

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, { id: string } & Partial<Omit<ProfileRow, "id">>>;
      scenarios: TableDef<ScenarioRow, InsertOf<ScenarioRow, "description" | "monthly_take_home_income_cents" | "current_savings_cents" | "is_primary">>;
      budget_items: TableDef<BudgetItemRow, InsertOf<BudgetItemRow, "cost_item_id" | "notes">>;
      weekly_schedule_blocks: TableDef<
        ScheduleBlockRow,
        InsertOf<ScheduleBlockRow, "category_id" | "location" | "notes" | "estimated_cost_cents">
      >;
      expense_categories: TableDef<ExpenseCategoryRow, InsertOf<ExpenseCategoryRow>>;
      data_sources: TableDef<DataSourceRow, InsertOf<DataSourceRow>>;
      cost_items: TableDef<CostItemRow, InsertOf<CostItemRow>>;
      price_observations: TableDef<PriceObservationRow, Omit<InsertOf<PriceObservationRow>, "unit_price_cents">>;
    };
    Views: {
      latest_price_observations: { Row: PriceObservationRow; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
