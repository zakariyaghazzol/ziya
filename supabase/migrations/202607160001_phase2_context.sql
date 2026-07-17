begin;

create table if not exists public.phase2_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists phase2_state_set_updated_at on public.phase2_state;
create trigger phase2_state_set_updated_at
  before update on public.phase2_state
  for each row execute function public.set_updated_at();

alter table public.phase2_state enable row level security;

grant select, insert, update, delete on public.phase2_state to authenticated;

drop policy if exists "Users manage their goals and context" on public.phase2_state;
create policy "Users manage their goals and context"
  on public.phase2_state
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
