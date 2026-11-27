-- NYC Ready: initial schema
--
-- Conventions
--   * Money is stored as BIGINT cents (USD). Never use float/real for money.
--   * Reference data (categories, cost items, data sources, price observations)
--     is readable by everyone and writable only with the service role.
--   * User data (profiles, scenarios, budget items, schedule blocks) is
--     protected by Row Level Security: a user can only see and change rows
--     where user_id = auth.uid().
--   * price_observations is append-only for application users: new prices
--     are new rows, so history is preserved.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table public.expense_categories (
  id text primary key check (id ~ '^[a-z_]+(\.[a-z_]+)?$'),
  name text not null,
  description text,
  parent_category_id text references public.expense_categories (id) on delete restrict,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
comment on table public.expense_categories is
  'Expense category hierarchy. IDs are stable slugs mirrored in src/lib/domain/categories.ts.';

create index expense_categories_parent_idx on public.expense_categories (parent_category_id);

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_type text not null check (
    source_type in ('official', 'licensed_provider', 'public_dataset', 'curated_manual', 'user_submission', 'demo')
  ),
  source_url text,
  description text,
  geographic_scope text,
  limitations text,
  refresh_interval_days integer check (refresh_interval_days is null or refresh_interval_days > 0),
  created_at timestamptz not null default now()
);
comment on table public.data_sources is
  'Where prices come from. Every price observation references exactly one source.';

create table public.cost_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category_id text not null references public.expense_categories (id) on delete restrict,
  brand text,
  unit text not null,
  package_size numeric(12, 3) check (package_size is null or package_size > 0),
  product_identifier text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.cost_items is
  'Searchable products and services. Prices live in price_observations, never here.';

create index cost_items_category_idx on public.cost_items (category_id);
create index cost_items_name_search_idx on public.cost_items using gin (to_tsvector('english', name || ' ' || coalesce(description, '')));

create trigger cost_items_set_updated_at
  before update on public.cost_items
  for each row execute function public.set_updated_at();

create table public.price_observations (
  id uuid primary key default gen_random_uuid(),
  cost_item_id uuid not null references public.cost_items (id) on delete cascade,
  data_source_id uuid not null references public.data_sources (id) on delete restrict,
  merchant_name text,
  location text,
  price_cents bigint not null check (price_cents >= 0),
  currency char(3) not null default 'USD' check (currency = 'USD'),
  package_quantity numeric(12, 3) check (package_quantity is null or package_quantity > 0),
  -- Price per item unit, in (fractional) cents. Derived, so it can never disagree with price/quantity.
  unit_price_cents numeric(14, 4) generated always as (price_cents / package_quantity) stored,
  observed_at timestamptz not null,
  verified_at timestamptz,
  price_type text not null check (price_type in ('verified_observation', 'provider_estimate', 'user_submitted', 'demo')),
  confidence_level text not null default 'medium' check (confidence_level in ('high', 'medium', 'low')),
  expires_at timestamptz,
  is_demo boolean not null default false,
  -- Set for user submissions (future feature); null for imported data.
  submitted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint price_observations_demo_consistency check (is_demo = (price_type = 'demo')),
  -- A user submission must record who submitted it.
  constraint price_observations_submission_has_author check (price_type <> 'user_submitted' or submitted_by is not null)
);
comment on table public.price_observations is
  'Append-only price history. A new price is a new row; old rows are kept for history and trends.';

create index price_observations_item_observed_idx on public.price_observations (cost_item_id, observed_at desc);
create index price_observations_source_idx on public.price_observations (data_source_id);

-- Latest observation per item + merchant + location + source. Used by the Cost Explorer.
create view public.latest_price_observations
with (security_invoker = true) as
select distinct on (cost_item_id, data_source_id, coalesce(merchant_name, ''), coalesce(location, ''))
  *
from public.price_observations
order by cost_item_id, data_source_id, coalesce(merchant_name, ''), coalesce(location, ''), observed_at desc, created_at desc;

-- ---------------------------------------------------------------------------
-- User data
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  expected_move_date date,
  annual_gross_income_cents bigint check (annual_gross_income_cents is null or annual_gross_income_cents >= 0),
  monthly_take_home_income_cents bigint check (monthly_take_home_income_cents is null or monthly_take_home_income_cents >= 0),
  current_savings_cents bigint check (current_savings_cents is null or current_savings_cents >= 0),
  household_size smallint check (household_size is null or household_size between 1 and 12),
  living_arrangement text check (living_arrangement is null or living_arrangement in ('alone', 'roommates', 'partner', 'undecided')),
  preferred_neighborhoods text[] not null default '{}',
  work_location text check (char_length(work_location) <= 200),
  commute_days_per_week smallint check (commute_days_per_week is null or commute_days_per_week between 0 and 7),
  lifestyle_preferences text[] not null default '{}',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user. Email lives in auth.users and is not duplicated here.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  -- Null means "use the value from the profile".
  monthly_take_home_income_cents bigint check (monthly_take_home_income_cents is null or monthly_take_home_income_cents >= 0),
  current_savings_cents bigint check (current_savings_cents is null or current_savings_cents >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index scenarios_user_idx on public.scenarios (user_id);
-- At most one primary scenario per user.
create unique index scenarios_one_primary_per_user on public.scenarios (user_id) where is_primary;

create trigger scenarios_set_updated_at
  before update on public.scenarios
  for each row execute function public.set_updated_at();

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null,
  -- Denormalised owner for simple, fast RLS. The composite FK guarantees it matches the scenario's owner.
  user_id uuid not null,
  category_id text not null references public.expense_categories (id) on delete restrict,
  cost_item_id uuid references public.cost_items (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  amount_cents bigint not null check (amount_cents >= 0),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly', 'one_time')),
  item_type text not null check (item_type in ('income', 'fixed', 'variable', 'savings', 'relocation')),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (scenario_id, user_id) references public.scenarios (id, user_id) on delete cascade,
  -- Relocation costs are one-time, and only relocation costs are one-time.
  constraint budget_items_one_time_is_relocation check ((item_type = 'relocation') = (frequency = 'one_time'))
);

create index budget_items_scenario_idx on public.budget_items (scenario_id);
create index budget_items_user_idx on public.budget_items (user_id);

create trigger budget_items_set_updated_at
  before update on public.budget_items
  for each row execute function public.set_updated_at();

create table public.weekly_schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null,
  user_id uuid not null,
  day_of_week smallint not null check (day_of_week between 1 and 7), -- ISO: 1 = Monday
  title text not null check (char_length(title) between 1 and 120),
  activity_type text not null check (
    activity_type in ('work', 'commute', 'groceries', 'cooking', 'dining_out', 'fitness', 'social', 'shopping', 'entertainment', 'personal', 'other')
  ),
  start_time time not null,
  end_time time not null,
  estimated_cost_cents bigint not null default 0 check (estimated_cost_cents >= 0),
  category_id text references public.expense_categories (id) on delete set null,
  location text check (char_length(location) <= 200),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (scenario_id, user_id) references public.scenarios (id, user_id) on delete cascade,
  constraint weekly_schedule_blocks_time_order check (end_time > start_time)
);

create index weekly_schedule_blocks_scenario_day_idx on public.weekly_schedule_blocks (scenario_id, day_of_week, start_time);
create index weekly_schedule_blocks_user_idx on public.weekly_schedule_blocks (user_id);

create trigger weekly_schedule_blocks_set_updated_at
  before update on public.weekly_schedule_blocks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New user bootstrap: create a profile and a primary scenario.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.scenarios (user_id, name, is_primary)
  values (new.id, 'My NYC plan', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.expense_categories enable row level security;
alter table public.data_sources enable row level security;
alter table public.cost_items enable row level security;
alter table public.price_observations enable row level security;
alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.budget_items enable row level security;
alter table public.weekly_schedule_blocks enable row level security;

-- Reference data: public read. No insert/update/delete policies, so only the
-- service role (which bypasses RLS) can write. User price submissions will get
-- their own narrowly scoped insert policy when that feature is built.
create policy "Categories are readable by everyone" on public.expense_categories for select to anon, authenticated using (true);
create policy "Data sources are readable by everyone" on public.data_sources for select to anon, authenticated using (true);
create policy "Cost items are readable by everyone" on public.cost_items for select to anon, authenticated using (true);
create policy "Price observations are readable by everyone" on public.price_observations for select to anon, authenticated using (true);

-- Profiles: the row id is the auth user id.
create policy "Users can read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users can insert their own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

-- Scenarios, budget items and schedule blocks: owner-only for every operation.
create policy "Users manage their own scenarios" on public.scenarios
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own budget items" on public.budget_items
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own schedule blocks" on public.weekly_schedule_blocks
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Table privileges (Supabase grants broadly by default; keep reference data read-only for app roles).
revoke insert, update, delete on public.expense_categories, public.data_sources, public.cost_items, public.price_observations from anon, authenticated;
grant select on public.latest_price_observations to anon, authenticated;
revoke all on public.profiles, public.scenarios, public.budget_items, public.weekly_schedule_blocks from anon;

-- ---------------------------------------------------------------------------
-- Reference data: expense categories (mirrors src/lib/domain/categories.ts)
-- ---------------------------------------------------------------------------

insert into public.expense_categories (id, name, description, parent_category_id, icon, sort_order) values
  ('housing', 'Housing & utilities', 'Rent, utilities, internet and running a home.', null, 'home', 0),
  ('housing.rent', 'Rent', 'Your share of monthly rent.', 'housing', 'key-round', 1),
  ('housing.utilities', 'Electricity & gas', 'Utility bills.', 'housing', 'zap', 2),
  ('housing.internet_phone', 'Internet & phone', 'Home internet and mobile plans.', 'housing', 'wifi', 3),
  ('housing.household', 'Household supplies', 'Cleaning products, paper goods, small items.', 'housing', 'spray-can', 4),
  ('housing.laundry', 'Laundry', 'Laundromat, wash-and-fold, detergent.', 'housing', 'shirt', 5),
  ('groceries', 'Groceries', 'Food and household products bought at stores.', null, 'shopping-basket', 0),
  ('groceries.dairy_eggs', 'Dairy & eggs', 'Milk, eggs, cheese, yogurt.', 'groceries', 'milk', 1),
  ('groceries.bakery', 'Bread & bakery', 'Bread, bagels, tortillas.', 'groceries', 'croissant', 2),
  ('groceries.meat_seafood', 'Meat & seafood', 'Chicken, beef, fish.', 'groceries', 'drumstick', 3),
  ('groceries.produce', 'Fruits & vegetables', 'Fresh produce.', 'groceries', 'apple', 4),
  ('groceries.pantry', 'Pantry staples', 'Rice, pasta, canned and dry goods.', 'groceries', 'package', 5),
  ('groceries.snacks', 'Snacks', 'Chips, bars, sweets.', 'groceries', 'cookie', 6),
  ('groceries.coffee_tea', 'Coffee & tea', 'Beans, grounds and tea for home.', 'groceries', 'coffee', 7),
  ('transportation', 'Transportation', 'Getting around the city.', null, 'train-front', 0),
  ('transportation.transit', 'Subway & bus', 'MTA fares and passes.', 'transportation', 'train-front', 1),
  ('transportation.rideshare', 'Rideshare & taxi', 'Occasional rides.', 'transportation', 'car-taxi-front', 2),
  ('transportation.bike_other', 'Bike & other', 'Bike share, ferry, other options.', 'transportation', 'bike', 3),
  ('fitness', 'Fitness', 'Staying active.', null, 'dumbbell', 0),
  ('fitness.gym', 'Gym membership', 'Monthly gym access.', 'fitness', 'dumbbell', 1),
  ('fitness.classes', 'Fitness classes', 'Drop-in or class packs.', 'fitness', 'activity', 2),
  ('fitness.recreation', 'Recreation', 'Climbing, courts, pools and other activities.', 'fitness', 'mountain', 3),
  ('personal', 'Clothing & personal care', 'Looking and feeling good.', null, 'sparkles', 0),
  ('personal.clothing', 'Clothing', 'Everyday clothes.', 'personal', 'shirt', 1),
  ('personal.shoes', 'Shoes', 'Footwear.', 'personal', 'footprints', 2),
  ('personal.haircut', 'Haircuts & grooming', 'Barber, salon.', 'personal', 'scissors', 3),
  ('personal.skincare_hygiene', 'Skincare & hygiene', 'Toiletries and skincare.', 'personal', 'droplet', 4),
  ('lifestyle', 'Entertainment & lifestyle', 'Eating out, going out, hobbies.', null, 'ticket', 0),
  ('lifestyle.restaurants', 'Restaurants', 'Meals out and takeout.', 'lifestyle', 'utensils', 1),
  ('lifestyle.coffee_shops', 'Coffee shops', 'Coffee and snacks out.', 'lifestyle', 'coffee', 2),
  ('lifestyle.bars_social', 'Bars & social', 'Drinks and nights out.', 'lifestyle', 'wine', 3),
  ('lifestyle.movies_events', 'Movies & events', 'Tickets, shows, concerts.', 'lifestyle', 'clapperboard', 4),
  ('lifestyle.hobbies', 'Hobbies', 'Supplies and activities.', 'lifestyle', 'palette', 5),
  ('health', 'Health & insurance', 'Healthcare and insurance.', null, 'heart-pulse', 0),
  ('health.insurance', 'Insurance premiums', 'Health, renters or other insurance.', 'health', 'shield', 1),
  ('health.medical', 'Medical & dental', 'Copays and out-of-pocket care.', 'health', 'stethoscope', 2),
  ('health.pharmacy', 'Pharmacy', 'Prescriptions and over-the-counter.', 'health', 'pill', 3),
  ('subscriptions', 'Subscriptions', 'Streaming, software and memberships.', null, 'repeat', 0),
  ('income', 'Income', 'Income on top of take-home pay.', null, 'wallet', 0),
  ('savings', 'Savings', 'Money set aside on purpose.', null, 'piggy-bank', 0),
  ('savings.emergency', 'Emergency fund', 'A cushion for surprises.', 'savings', 'life-buoy', 1),
  ('savings.relocation', 'Relocation fund', 'Saving for the move itself.', 'savings', 'truck', 2),
  ('savings.general', 'General savings & investing', 'Long-term savings goals.', 'savings', 'trending-up', 3),
  ('relocation', 'Moving & setup', 'One-time costs to get settled.', null, 'truck', 0),
  ('relocation.deposit', 'Security deposit & fees', 'Deposit, application and broker fees.', 'relocation', 'key-round', 1),
  ('relocation.first_rent', 'First month''s rent', 'Rent due at signing.', 'relocation', 'calendar', 2),
  ('relocation.moving', 'Moving costs', 'Movers, truck, travel.', 'relocation', 'truck', 3),
  ('relocation.furniture', 'Furniture', 'Bed, desk, essentials.', 'relocation', 'sofa', 4),
  ('relocation.setup', 'Initial household purchases', 'Kitchen, bedding, first stock-up.', 'relocation', 'package-open', 5),
  ('other', 'Other', 'Anything that doesn''t fit elsewhere.', null, 'circle-ellipsis', 0);

