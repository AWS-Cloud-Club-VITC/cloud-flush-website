-- Update: 2026-03-15
-- Purpose: Add admin-managed dashboard updates for leader/member notification bell and updates pages.

create table if not exists public.dashboard_updates (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  body        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table public.dashboard_updates enable row level security;

drop policy if exists "Authenticated can view dashboard updates" on public.dashboard_updates;
create policy "Authenticated can view dashboard updates"
  on public.dashboard_updates for select to authenticated
  using (true);

drop policy if exists "Admin can manage dashboard updates" on public.dashboard_updates;
create policy "Admin can manage dashboard updates"
  on public.dashboard_updates for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_dashboard_updates_created_at_desc
  on public.dashboard_updates (created_at desc);