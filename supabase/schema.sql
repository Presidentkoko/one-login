-- One Login: run this once in the Supabase SQL editor.
-- One table. Every dollar in or out is a row; the screen is just a sum.

create table if not exists public.entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('in', 'out')),
  customer     text check (char_length(customer) <= 120),
  description  text not null check (char_length(description) between 1 and 200),
  amount_cents integer not null check (amount_cents > 0 and amount_cents < 1000000000),
  created_at   timestamptz not null default now()
);

create index if not exists entries_user_created_idx
  on public.entries (user_id, created_at desc);

alter table public.entries enable row level security;

grant select, insert, delete on public.entries to authenticated;

drop policy if exists "Own entries: read" on public.entries;
create policy "Own entries: read" on public.entries
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Own entries: add" on public.entries;
create policy "Own entries: add" on public.entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Own entries: remove" on public.entries;
create policy "Own entries: remove" on public.entries
  for delete to authenticated using ((select auth.uid()) = user_id);
