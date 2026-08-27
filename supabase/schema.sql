-- ---------------------------------------------------------------------------
-- 2IC Budget Management — Phase 2 schema
--
-- How to use: Supabase dashboard → SQL Editor → paste this whole file → Run.
-- Safe to re-run: every statement is idempotent (create-if-not-exists /
-- drop-if-exists-then-create), so running it twice won't error or duplicate.
--
-- Model: one Supabase Auth login per household (matches the app's existing
-- "everyone shares one login, profiles just split views" design). Every
-- table below carries a household_id that always equals auth.uid() for the
-- signed-in household, and Row Level Security enforces that a household can
-- only ever see or touch its own rows — never another household's.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---- households --------------------------------------------------------
-- One row per signed-in household. id IS the Supabase auth user id.
create table if not exists households (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Our Household',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a household row the moment someone signs up, so the app
-- never has to handle a signed-in user with no household yet.
create or replace function public.handle_new_household_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.households (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_household_user();

-- ---- members (profiles) -------------------------------------------------
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  color text not null check (color in ('rose','sage','champagne','coral','plum')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---- accounts ------------------------------------------------------------
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  label text not null,
  kind text not null check (kind in ('cheque','credit','savings','other')),
  current_balance numeric not null default 0,
  as_of_date date not null default current_date,
  member_id uuid references members(id) on delete set null
);

-- ---- cycles ----------------------------------------------------------------
create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  income_expected numeric not null default 0,
  income_received numeric not null default 0
);

-- ---- pools -----------------------------------------------------------------
create table if not exists pools (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('variable','fixed','excluded')),
  monthly_budget numeric not null default 0,
  reserve_as_essential boolean not null default false,
  sort_order int not null default 0,
  member_id uuid references members(id) on delete set null
);

-- ---- commitments -------------------------------------------------------------
create table if not exists commitments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  item text not null,
  pool_id uuid references pools(id) on delete set null,
  account_id uuid not null references accounts(id) on delete cascade,
  search_term text not null,
  amount numeric not null,
  day_of_month int not null check (day_of_month between 1 and 31),
  paid boolean not null default false
);

-- ---- rules -------------------------------------------------------------------
create table if not exists rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  priority int not null,
  search_term text not null,
  pool_id uuid not null references pools(id) on delete cascade
);

-- ---- transactions --------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  date date not null,
  account_id uuid not null references accounts(id) on delete cascade,
  description text not null,
  merchant text not null,
  amount numeric not null,
  pool_id uuid references pools(id) on delete set null,
  cycle_id uuid not null references cycles(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  mapped_by text check (mapped_by in ('commitment','rule','manual')),
  commitment_id uuid references commitments(id) on delete set null
);

-- ---- income sources --------------------------------------------------------
create table if not exists income_sources (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  label text not null,
  amount_expected numeric not null default 0,
  day_of_month int not null check (day_of_month between 1 and 31),
  recurring boolean not null default true,
  account_id uuid not null references accounts(id) on delete cascade
);

-- ---- savings entries -----------------------------------------------------
create table if not exists savings_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  cycle_id uuid not null references cycles(id) on delete cascade,
  contribution numeric not null default 0,
  closing_balance numeric not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security — a household can only see/change its own rows.
-- ---------------------------------------------------------------------------

alter table households enable row level security;
alter table members enable row level security;
alter table accounts enable row level security;
alter table cycles enable row level security;
alter table pools enable row level security;
alter table commitments enable row level security;
alter table rules enable row level security;
alter table transactions enable row level security;
alter table income_sources enable row level security;
alter table savings_entries enable row level security;

drop policy if exists "own household" on households;
create policy "own household" on households
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array[
    'members','accounts','cycles','pools','commitments',
    'rules','transactions','income_sources','savings_entries'
  ]
  loop
    execute format(
      'drop policy if exists "own household rows" on %I;
       create policy "own household rows" on %I
         for all using (household_id = auth.uid()) with check (household_id = auth.uid());',
      t, t
    );
  end loop;
end $$;
