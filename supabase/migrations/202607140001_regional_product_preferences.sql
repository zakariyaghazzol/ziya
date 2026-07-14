begin;

alter table public.profiles
  add column if not exists product_region text not null default 'global',
  add column if not exists ingredient_display_mode text not null default 'translated';

alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles
  add constraint profiles_preferred_language_check
  check (preferred_language in ('auto', 'en', 'fr', 'es', 'ar'));

alter table public.profiles drop constraint if exists profiles_product_region_check;
alter table public.profiles
  add constraint profiles_product_region_check
  check (product_region in ('global', 'us', 'ca', 'fr', 'ma', 'gb', 'es'));

alter table public.profiles drop constraint if exists profiles_ingredient_display_mode_check;
alter table public.profiles
  add constraint profiles_ingredient_display_mode_check
  check (ingredient_display_mode in ('translated', 'original', 'both'));

commit;
