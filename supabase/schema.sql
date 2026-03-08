-- Run this in Supabase SQL Editor. Drops everything for a clean slate.

-- STEP 1: Drop all
drop table if exists public.attendance cascade;
drop table if exists public.registrations cascade;
drop table if exists public.sessions cascade;
drop table if exists public.core_users cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;

-- STEP 2: Teams
create table public.teams (
  id             uuid default gen_random_uuid() primary key,
  team_name      text not null,
  leader_id      uuid references auth.users(id) on delete cascade not null,
  is_vit_chennai boolean default false,
  points         integer default 0,
  created_at     timestamp with time zone default timezone('utc', now()) not null
);

create table public.team_members (
  id         uuid default gen_random_uuid() primary key,
  team_id    uuid references public.teams(id) on delete cascade not null,
  name       text not null,
  reg_no     text not null,
  email      text not null,
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- STEP 3: Core users (manually inserted by admin)
create table public.core_users (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null unique,
  name       text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- STEP 4: Sessions (5 slots, toggle on/off from settings)
create table public.sessions (
  id         serial primary key,
  name       text not null,
  is_enabled boolean default false,
  slot_order integer not null unique
);
insert into public.sessions (name, is_enabled, slot_order) values
  ('Session 1', false, 1),
  ('Session 2', false, 2),
  ('Session 3', false, 3),
  ('Session 4', false, 4),
  ('Session 5', false, 5);

-- STEP 5: Registrations (uploaded bulk by core team)
create table public.registrations (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  reg_no      text not null unique,
  email       text not null default '',
  team_name   text not null default '',
  uploaded_at timestamp with time zone default timezone('utc', now()) not null
);

-- STEP 6: Attendance (one row per student per session)
create table public.attendance (
  id           uuid default gen_random_uuid() primary key,
  student_name text not null,
  reg_no       text not null,
  email        text not null,
  team_name    text not null,
  session_id   integer references public.sessions(id),
  scanned_at   timestamp with time zone default timezone('utc', now()) not null,
  scanned_by   uuid references auth.users(id),
  unique(reg_no, session_id)
);

-- STEP 7: Enable RLS
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.core_users    enable row level security;
alter table public.sessions      enable row level security;
alter table public.registrations enable row level security;
alter table public.attendance    enable row level security;

-- STEP 7.5: Helper to get the current user's team_id without recursive RLS
-- security definer runs as the function owner (bypasses RLS internally)
create or replace function public.get_my_team_id()
  returns uuid language sql security definer stable
  set search_path = public as $$
    select team_id from team_members where user_id = auth.uid() limit 1;
  $$;

-- STEP 8: Teams policies
create policy "Leader can insert own team"
  on public.teams for insert with check (auth.uid() = leader_id);
create policy "Leader can update own team"
  on public.teams for update using (auth.uid() = leader_id);
create policy "All authenticated can view teams"
  on public.teams for select to authenticated using (true);

-- STEP 9: Team members policies
create policy "Leader can manage members"
  on public.team_members for all
  using   (exists (select 1 from public.teams where teams.id = team_members.team_id and teams.leader_id = auth.uid()))
  with check (exists (select 1 from public.teams where teams.id = team_members.team_id and teams.leader_id = auth.uid()));
create policy "Team members can view their team"
  on public.team_members for select using (
    team_id = public.get_my_team_id()
  );

-- STEP 10: Core users policy
create policy "Core user verify own access"
  on public.core_users for select to authenticated using (user_id = auth.uid());

-- STEP 11: Sessions policies
create policy "Core users can read sessions"
  on public.sessions for select to authenticated
  using (exists (select 1 from public.core_users where user_id = auth.uid()));
create policy "Core users can update sessions"
  on public.sessions for update to authenticated
  using (exists (select 1 from public.core_users where user_id = auth.uid()));

-- STEP 12: Registrations policies
create policy "Core users can manage registrations"
  on public.registrations for all to authenticated
  using   (exists (select 1 from public.core_users where user_id = auth.uid()))
  with check (exists (select 1 from public.core_users where user_id = auth.uid()));

-- STEP 13: Attendance policies
create policy "Core users can insert attendance"
  on public.attendance for insert to authenticated
  with check (exists (select 1 from public.core_users where user_id = auth.uid()));
create policy "Core users can view attendance"
  on public.attendance for select to authenticated
  using (exists (select 1 from public.core_users where user_id = auth.uid()));
