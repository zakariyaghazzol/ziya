begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'fr', 'es', 'ar')),
  unit_system text not null default 'us' check (unit_system in ('us', 'metric')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  allergies jsonb not null default '[]'::jsonb,
  diet_preferences jsonb not null default '[]'::jsonb,
  avoided_ingredients jsonb not null default '[]'::jsonb,
  watchlist_ingredients jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.today_plate_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goals jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.today_plate_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_entry_id text not null,
  local_date text not null check (local_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  product_key text,
  product_snapshot jsonb not null,
  serving jsonb not null,
  nutrients jsonb not null,
  goal_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_entry_id)
);

create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_history_id text not null,
  product_key text,
  barcode text,
  product_snapshot jsonb not null,
  scanned_at timestamptz not null default now(),
  unique (user_id, local_history_id)
);

create table if not exists public.product_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null,
  barcode text,
  override_data jsonb not null,
  provider_snapshot jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, product_key)
);

create index if not exists today_plate_logs_user_date_idx on public.today_plate_logs (user_id, local_date);
create index if not exists scan_history_user_scanned_idx on public.scan_history (user_id, scanned_at desc);
create index if not exists product_overrides_user_barcode_idx on public.product_overrides (user_id, barcode);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists profile_preferences_set_updated_at on public.profile_preferences;
create trigger profile_preferences_set_updated_at before update on public.profile_preferences for each row execute function public.set_updated_at();
drop trigger if exists today_plate_goals_set_updated_at on public.today_plate_goals;
create trigger today_plate_goals_set_updated_at before update on public.today_plate_goals for each row execute function public.set_updated_at();
drop trigger if exists today_plate_logs_set_updated_at on public.today_plate_logs;
create trigger today_plate_logs_set_updated_at before update on public.today_plate_logs for each row execute function public.set_updated_at();
drop trigger if exists product_overrides_set_updated_at on public.product_overrides;
create trigger product_overrides_set_updated_at before update on public.product_overrides for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.today_plate_goals enable row level security;
alter table public.today_plate_logs enable row level security;
alter table public.scan_history enable row level security;
alter table public.product_overrides enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.profile_preferences to authenticated;
grant select, insert, update, delete on public.today_plate_goals to authenticated;
grant select, insert, update, delete on public.today_plate_logs to authenticated;
grant select, insert, update, delete on public.scan_history to authenticated;
grant select, insert, update, delete on public.product_overrides to authenticated;

drop policy if exists "Users manage their profile" on public.profiles;
create policy "Users manage their profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "Users manage their preferences" on public.profile_preferences;
create policy "Users manage their preferences" on public.profile_preferences for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users manage their goals" on public.today_plate_goals;
create policy "Users manage their goals" on public.today_plate_goals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users manage their food logs" on public.today_plate_logs;
create policy "Users manage their food logs" on public.today_plate_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users manage their scan history" on public.scan_history;
create policy "Users manage their scan history" on public.scan_history for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users manage their product corrections" on public.product_overrides;
create policy "Users manage their product corrections" on public.product_overrides for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

commit;
