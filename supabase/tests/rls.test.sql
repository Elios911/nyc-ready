-- Row Level Security tests: one user must never read or change another user's data.
--
-- Runs inside a transaction that is rolled back, so it leaves no data behind.
-- Usage: scripts/test-db.sh (local Postgres) — see README "Database tests".
-- Each failed expectation raises an exception and aborts the run.

begin;

-- Two users. The signup trigger creates their profiles and primary scenarios.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', '{"full_name":"Alice"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test', '{}');

do $$
begin
  if (select count(*) from public.profiles) <> 2 then raise exception 'signup trigger should create 2 profiles'; end if;
  if (select count(*) from public.scenarios where is_primary) <> 2 then raise exception 'signup trigger should create 2 primary scenarios'; end if;
  if (select full_name from public.profiles where id = '11111111-1111-1111-1111-111111111111') <> 'Alice' then
    raise exception 'full_name should be copied from signup metadata';
  end if;
end $$;

-- Seed one budget item and one schedule block for each user (as the table owner, bypassing RLS).
insert into public.budget_items (scenario_id, user_id, category_id, name, amount_cents, frequency, item_type)
select id, user_id, 'housing.rent', 'Rent', 150000, 'monthly', 'fixed' from public.scenarios;

insert into public.weekly_schedule_blocks (scenario_id, user_id, day_of_week, title, activity_type, start_time, end_time, estimated_cost_cents)
select id, user_id, 1, 'Gym', 'fitness', '18:00', '19:00', 0 from public.scenarios;

-- Act as Alice.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

do $$
declare
  bob_scenario uuid;
  affected integer;
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'Alice should only see her own profile'; end if;
  if (select count(*) from public.scenarios) <> 1 then raise exception 'Alice should only see her own scenario'; end if;
  if (select count(*) from public.budget_items) <> 1 then raise exception 'Alice should only see her own budget items'; end if;
  if (select count(*) from public.weekly_schedule_blocks) <> 1 then raise exception 'Alice should only see her own schedule'; end if;

  -- Updates and deletes on Bob's rows silently affect nothing.
  update public.profiles set full_name = 'hacked' where id = '22222222-2222-2222-2222-222222222222';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Alice must not update Bob''s profile'; end if;

  delete from public.budget_items where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Alice must not delete Bob''s budget items'; end if;

  -- Inserting rows owned by Bob is rejected by the RLS WITH CHECK clause.
  begin
    insert into public.scenarios (user_id, name) values ('22222222-2222-2222-2222-222222222222', 'Sneaky');
    raise exception 'Alice must not create scenarios for Bob';
  exception when insufficient_privilege then null;
  end;

  -- Attaching her own item to Bob's scenario is rejected by the composite foreign key.
  reset role;
  select id into bob_scenario from public.scenarios where user_id = '22222222-2222-2222-2222-222222222222';
  set local role authenticated;
  begin
    insert into public.budget_items (scenario_id, user_id, category_id, name, amount_cents, frequency, item_type)
    values (bob_scenario, '11111111-1111-1111-1111-111111111111', 'other', 'Sneaky', 100, 'monthly', 'fixed');
    raise exception 'Alice must not attach items to Bob''s scenario';
  exception when foreign_key_violation then null;
  end;

  -- Reference data is readable but not writable.
  if (select count(*) from public.expense_categories) = 0 then raise exception 'categories should be readable'; end if;
  begin
    insert into public.data_sources (slug, name, source_type) values ('x', 'x', 'official');
    raise exception 'authenticated users must not write data sources';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.price_observations set price_cents = 1;
    -- With no update privilege this raises; reaching here means it was allowed.
    raise exception 'authenticated users must not rewrite price history';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Anonymous visitors see reference data but no user data.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
begin
  begin
    perform count(*) from public.profiles;
    raise exception 'anon must not read profiles';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.expense_categories) = 0 then raise exception 'anon should read categories'; end if;
end $$;

reset role;

-- Data integrity checks.
do $$
declare
  alice_scenario uuid;
begin
  select id into alice_scenario from public.scenarios where user_id = '11111111-1111-1111-1111-111111111111';
  begin
    insert into public.budget_items (scenario_id, user_id, category_id, name, amount_cents, frequency, item_type)
    values (alice_scenario, '11111111-1111-1111-1111-111111111111', 'relocation.deposit', 'Deposit', 100, 'monthly', 'relocation');
    raise exception 'relocation items must be one-time';
  exception when check_violation then null;
  end;
  begin
    insert into public.budget_items (scenario_id, user_id, category_id, name, amount_cents, frequency, item_type)
    values (alice_scenario, '11111111-1111-1111-1111-111111111111', 'other', 'Negative', -1, 'monthly', 'fixed');
    raise exception 'amounts must not be negative';
  exception when check_violation then null;
  end;
  begin
    insert into public.weekly_schedule_blocks (scenario_id, user_id, day_of_week, title, activity_type, start_time, end_time)
    values (alice_scenario, '11111111-1111-1111-1111-111111111111', 8, 'Bad day', 'other', '09:00', '10:00');
    raise exception 'day_of_week must be 1-7';
  exception when check_violation then null;
  end;
  begin
    insert into public.weekly_schedule_blocks (scenario_id, user_id, day_of_week, title, activity_type, start_time, end_time)
    values (alice_scenario, '11111111-1111-1111-1111-111111111111', 1, 'Backwards', 'other', '10:00', '09:00');
    raise exception 'end_time must be after start_time';
  exception when check_violation then null;
  end;
  begin
    insert into public.scenarios (user_id, name, is_primary) values ('11111111-1111-1111-1111-111111111111', 'Second primary', true);
    raise exception 'only one primary scenario per user';
  exception when unique_violation then null;
  end;
end $$;

-- Deleting a user removes all of their data.
delete from auth.users where id = '22222222-2222-2222-2222-222222222222';
do $$
begin
  if exists (select 1 from public.scenarios where user_id = '22222222-2222-2222-2222-222222222222') then
    raise exception 'deleting a user should cascade to their data';
  end if;
end $$;

select 'RLS and integrity tests passed' as result;

rollback;
