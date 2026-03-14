-- Run this in Supabase SQL Editor. Drops everything for a clean slate.

-- STEP 1: Drop all
drop table if exists public.attendance cascade;
drop table if exists public.hackathon_config cascade;
drop table if exists public.registrations cascade;
drop table if exists public.problem_statements cascade;
drop table if exists public.domain_constraints cascade;
drop table if exists public.constraint_round_settings cascade;
drop table if exists public.betting_round_control cascade;
drop table if exists public.round_bets cascade;
drop table if exists public.round_evaluations cascade;
drop table if exists public.round_results cascade;
drop table if exists public.betting_transactions cascade;
drop table if exists public.sessions cascade;
drop table if exists public.judge_users cascade;
drop table if exists public.admin_users cascade;
drop table if exists public.core_users cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;
drop function if exists public.get_user_id_by_email(text) cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.is_judge() cascade;
drop function if exists public.is_team_actor(uuid) cascade;
drop function if exists public.is_team_leader(uuid) cascade;
drop function if exists public.prevent_problem_reselection() cascade;
drop function if exists public.submit_initial_bet(integer, integer) cascade;
drop function if exists public.submit_second_decision(integer, text) cascade;
drop function if exists public.apply_hold_timeouts(integer) cascade;
drop function if exists public.settle_betting_round(integer) cascade;

-- STEP 1.5: Problem statements (created by admin)
create table public.problem_statements (
  id          uuid default gen_random_uuid() primary key,
  domain      text not null,
  title       text not null,
  statement   text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

create table public.domain_constraints (
  id             uuid default gen_random_uuid() primary key,
  domain         text not null,
  round_no       integer not null check (round_no between 1 and 5),
  title          text not null,
  constraint_text text not null,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamp with time zone default timezone('utc', now()) not null
);

create table public.constraint_round_settings (
  round_no   integer primary key check (round_no between 1 and 5),
  is_enabled boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamp with time zone not null default timezone('utc', now())
);

insert into public.constraint_round_settings (round_no, is_enabled)
values (1, true), (2, true), (3, true), (4, true), (5, true)
on conflict (round_no) do nothing;

-- STEP 2: Teams
create table public.teams (
  id             uuid default gen_random_uuid() primary key,
  team_name      text not null,
  leader_id      uuid references auth.users(id) on delete cascade not null,
  is_vit_chennai boolean default false,
  points         integer default 1000,
  selected_problem_id uuid references public.problem_statements(id) on delete set null,
  created_at     timestamp with time zone default timezone('utc', now()) not null
);

-- For existing databases, backfill baseline points for uninitialized teams.
update public.teams
set points = 1000
where points is null or points = 0;

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
  email      text,
  name       text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- STEP 3.5: Admin users and Judge users
create table public.admin_users (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null unique,
  email      text,
  name       text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);
-- NOTE: Bootstrap the first admin by inserting directly in the Supabase SQL editor:
-- insert into public.admin_users (user_id, email, name) values ('<auth-user-uuid>', 'admin@email.com', 'Admin Name');

create table public.judge_users (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null unique,
  email      text,
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

-- STEP 6.5: Global hackathon timer config
create table public.hackathon_config (
  id               integer primary key check (id = 1),
  starts_at        timestamp with time zone not null default timezone('utc', now()),
  duration_minutes integer not null default 1440 check (duration_minutes > 0),
  is_running       boolean not null default false,
  updated_by       uuid references auth.users(id) on delete set null,
  updated_at       timestamp with time zone not null default timezone('utc', now())
);

insert into public.hackathon_config (id, starts_at, duration_minutes, is_running)
values (1, timezone('utc', now()), 1440, false)
on conflict (id) do nothing;

-- STEP 6.6: Constraint betting game tables
create table public.betting_round_control (
  round_no           integer primary key check (round_no between 1 and 5),
  phase              text not null default 'setup'
                     check (phase in ('setup', 'betting', 'decision', 'evaluation', 'settled')),
  betting_starts_at  timestamp with time zone,
  betting_ends_at    timestamp with time zone,
  decision_starts_at timestamp with time zone,
  decision_ends_at   timestamp with time zone,
  min_bet            integer not null default 50 check (min_bet >= 0),
  max_bet            integer not null default 1000 check (max_bet >= 0),
  updated_by         uuid references auth.users(id) on delete set null,
  updated_at         timestamp with time zone not null default timezone('utc', now())
);

insert into public.betting_round_control (round_no)
values (1), (2), (3), (4), (5)
on conflict (round_no) do nothing;

create table public.round_bets (
  id                 uuid default gen_random_uuid() primary key,
  round_no           integer not null check (round_no between 1 and 5),
  team_id            uuid not null references public.teams(id) on delete cascade,
  initial_bet        integer not null check (initial_bet >= 0),
  second_decision    text check (second_decision in ('hold', 'double', 'withdraw')),
  final_bet          integer check (final_bet >= 0),
  decision_locked    boolean not null default false,
  placed_by          uuid references auth.users(id) on delete set null,
  placed_at          timestamp with time zone not null default timezone('utc', now()),
  decision_at        timestamp with time zone,
  unique(round_no, team_id)
);

create table public.round_evaluations (
  id                 uuid default gen_random_uuid() primary key,
  round_no           integer not null check (round_no between 1 and 5),
  team_id            uuid not null references public.teams(id) on delete cascade,
  score              numeric(10, 3) not null,
  notes              text,
  evaluated_by       uuid references auth.users(id) on delete set null,
  created_at         timestamp with time zone not null default timezone('utc', now()),
  unique(round_no, team_id)
);

create table public.round_results (
  id                 uuid default gen_random_uuid() primary key,
  round_no           integer not null check (round_no between 1 and 5),
  team_id            uuid not null references public.teams(id) on delete cascade,
  rank_no            integer not null check (rank_no > 0),
  score              numeric(10, 3) not null,
  final_bet          integer not null check (final_bet >= 0),
  is_winner          boolean not null,
  payout             integer not null default 0 check (payout >= 0),
  settled_at         timestamp with time zone not null default timezone('utc', now()),
  unique(round_no, team_id)
);

create table public.betting_transactions (
  id                 uuid default gen_random_uuid() primary key,
  team_id            uuid not null references public.teams(id) on delete cascade,
  round_no           integer not null check (round_no between 1 and 5),
  delta_points       integer not null,
  reason             text not null,
  created_at         timestamp with time zone not null default timezone('utc', now())
);

-- STEP 7: Enable RLS
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.problem_statements enable row level security;
alter table public.domain_constraints enable row level security;
alter table public.constraint_round_settings enable row level security;
alter table public.core_users    enable row level security;
alter table public.admin_users   enable row level security;
alter table public.judge_users   enable row level security;
alter table public.betting_round_control enable row level security;
alter table public.round_bets enable row level security;
alter table public.round_evaluations enable row level security;
alter table public.round_results enable row level security;
alter table public.betting_transactions enable row level security;
alter table public.sessions      enable row level security;
alter table public.hackathon_config enable row level security;
alter table public.registrations enable row level security;
alter table public.attendance    enable row level security;

-- STEP 7.5: Security-definer helper functions (bypass RLS internally)
create or replace function public.get_my_team_id()
  returns uuid language sql security definer stable
  set search_path = public as $$
    select team_id from team_members where user_id = auth.uid() limit 1;
  $$;

create or replace function public.prevent_problem_reselection()
  returns trigger language plpgsql
  set search_path = public as $$
begin
  if old.selected_problem_id is not null
     and new.selected_problem_id is distinct from old.selected_problem_id then
    raise exception 'Problem statement already selected for this team';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_problem_reselection on public.teams;
create trigger trg_prevent_problem_reselection
before update on public.teams
for each row execute function public.prevent_problem_reselection();

create or replace function public.is_admin()
  returns boolean language sql security definer stable
  set search_path = public as $$
    select exists (select 1 from admin_users where user_id = auth.uid());
  $$;

create or replace function public.is_judge()
  returns boolean language sql security definer stable
  set search_path = public as $$
    select exists (select 1 from judge_users where user_id = auth.uid());
  $$;

create or replace function public.is_team_actor(p_team_id uuid)
  returns boolean language sql security definer stable
  set search_path = public as $$
    select exists (
      select 1
      from public.teams t
      where t.id = p_team_id
        and (
          t.leader_id = auth.uid()
          or exists (
            select 1 from public.team_members tm
            where tm.team_id = p_team_id and tm.user_id = auth.uid()
          )
        )
    );
  $$;

create or replace function public.is_team_leader(p_team_id uuid)
  returns boolean language sql security definer stable
  set search_path = public as $$
    select exists (
      select 1 from public.teams t
      where t.id = p_team_id and t.leader_id = auth.uid()
    );
  $$;

-- Leader sets initial bet once per round during betting phase.
create or replace function public.submit_initial_bet(p_round_no integer, p_initial_bet integer)
  returns public.round_bets language plpgsql security definer
  set search_path = public as $$
declare
  v_team_id uuid;
  v_points integer;
  v_ctrl public.betting_round_control%rowtype;
  v_row public.round_bets;
begin
  select t.id, t.points into v_team_id, v_points
  from public.teams t
  where t.leader_id = auth.uid()
  limit 1;

  if v_team_id is null then
    raise exception 'Only team leaders can place bets';
  end if;

  select * into v_ctrl
  from public.betting_round_control
  where round_no = p_round_no;

  if not found then
    raise exception 'Round % is not configured', p_round_no;
  end if;

  if v_ctrl.phase <> 'betting' then
    raise exception 'Round % is not in betting phase', p_round_no;
  end if;

  if p_initial_bet < v_ctrl.min_bet or p_initial_bet > v_ctrl.max_bet then
    raise exception 'Bet must be between % and %', v_ctrl.min_bet, v_ctrl.max_bet;
  end if;

  if p_initial_bet > coalesce(v_points, 0) then
    raise exception 'Insufficient team points for this bet';
  end if;

  if exists (
    select 1 from public.round_bets rb
    where rb.round_no = p_round_no and rb.team_id = v_team_id
  ) then
    raise exception 'Initial bet already submitted for this round';
  end if;

  insert into public.round_bets (
    round_no, team_id, initial_bet, second_decision, final_bet, decision_locked, placed_by
  )
  values (p_round_no, v_team_id, p_initial_bet, null, p_initial_bet, false, auth.uid())
  returning * into v_row;

  return v_row;
end;
$$;

-- Leader submits one-time second decision during decision phase.
create or replace function public.submit_second_decision(p_round_no integer, p_decision text)
  returns public.round_bets language plpgsql security definer
  set search_path = public as $$
declare
  v_team_id uuid;
  v_points integer;
  v_ctrl public.betting_round_control%rowtype;
  v_bet public.round_bets%rowtype;
  v_final integer;
  v_row public.round_bets;
begin
  if p_decision not in ('hold', 'double', 'withdraw') then
    raise exception 'Invalid decision';
  end if;

  select t.id, t.points into v_team_id, v_points
  from public.teams t
  where t.leader_id = auth.uid()
  limit 1;

  if v_team_id is null then
    raise exception 'Only team leaders can submit decisions';
  end if;

  select * into v_ctrl
  from public.betting_round_control
  where round_no = p_round_no;

  if not found then
    raise exception 'Round % is not configured', p_round_no;
  end if;

  if v_ctrl.phase <> 'decision' then
    raise exception 'Round % is not in decision phase', p_round_no;
  end if;

  select * into v_bet
  from public.round_bets
  where round_no = p_round_no and team_id = v_team_id
  for update;

  if not found then
    raise exception 'Initial bet not found for this round';
  end if;

  if v_bet.decision_locked then
    raise exception 'Second decision already submitted';
  end if;

  if p_decision = 'double' then
    v_final := v_bet.initial_bet * 2;
  elsif p_decision = 'withdraw' then
    v_final := 0;
  else
    v_final := v_bet.initial_bet;
  end if;

  if v_final > v_ctrl.max_bet then
    raise exception 'Final bet exceeds max bet for this round';
  end if;

  if v_final > coalesce(v_points, 0) then
    raise exception 'Insufficient team points for final bet';
  end if;

  update public.round_bets
  set
    second_decision = p_decision,
    final_bet = v_final,
    decision_locked = true,
    decision_at = timezone('utc', now())
  where id = v_bet.id
  returning * into v_row;

  return v_row;
end;
$$;

-- Apply timeout rule: any pending second decision defaults to hold.
create or replace function public.apply_hold_timeouts(p_round_no integer)
  returns integer language plpgsql security definer
  set search_path = public as $$
declare
  v_ctrl public.betting_round_control%rowtype;
  v_updated integer := 0;
begin
  select * into v_ctrl
  from public.betting_round_control
  where round_no = p_round_no;

  if not found then
    raise exception 'Round % is not configured', p_round_no;
  end if;

  if v_ctrl.phase <> 'decision' then
    raise exception 'Timeout hold can be applied only during decision phase';
  end if;

  update public.round_bets rb
  set
    second_decision = 'hold',
    final_bet = rb.initial_bet,
    decision_locked = true,
    decision_at = timezone('utc', now())
  where rb.round_no = p_round_no
    and rb.decision_locked = false;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- Settlement uses weighted payout among winners by final bet (option 3).
create or replace function public.settle_betting_round(p_round_no integer)
  returns table (
    round_no integer,
    team_id uuid,
    rank_no integer,
    score numeric,
    final_bet integer,
    is_winner boolean,
    payout integer,
    points_delta integer
  ) language plpgsql security definer
  set search_path = public as $$
declare
  v_ctrl public.betting_round_control%rowtype;
  v_winner_count integer := greatest(1, 6 - p_round_no);
  v_participant_count integer := 0;
  v_pot integer := 0;
  v_winner_bet_sum integer := 0;
  v_allocated integer := 0;
  v_remainder integer := 0;
begin
  if not (public.is_admin() or public.is_judge()) then
    raise exception 'Only admin or judge can settle rounds';
  end if;

  select * into v_ctrl
  from public.betting_round_control brc
  where brc.round_no = p_round_no
  for update;

  if not found then
    raise exception 'Round % is not configured', p_round_no;
  end if;

  if v_ctrl.phase not in ('evaluation', 'settled') then
    raise exception 'Round % must be in evaluation phase before settlement', p_round_no;
  end if;

  -- Ensure timeout default is applied before ranking.
  perform public.apply_hold_timeouts(p_round_no);

  delete from public.round_results rr
  where rr.round_no = p_round_no;

  select count(*) into v_participant_count
  from public.round_evaluations e
  join public.round_bets rb
    on rb.round_no = e.round_no
   and rb.team_id = e.team_id
  where e.round_no = p_round_no;

  if v_participant_count > 1 then
    -- Keep round progression cap, but force at least one loser when multiple teams play.
    v_winner_count := least(v_winner_count, v_participant_count - 1);
  else
    v_winner_count := 1;
  end if;

  with ranked as (
    select
      e.round_no,
      e.team_id,
      e.score,
      coalesce(rb.second_decision, 'hold') as second_decision,
      coalesce(rb.final_bet, rb.initial_bet, 0) as final_bet,
      row_number() over (
        order by e.score desc, coalesce(rb.final_bet, rb.initial_bet, 0) desc, e.created_at asc
      ) as rank_no,
      sum(
        case
          when coalesce(rb.second_decision, 'hold') <> 'withdraw' then 1
          else 0
        end
      ) over (
        order by e.score desc, coalesce(rb.final_bet, rb.initial_bet, 0) desc, e.created_at asc
        rows between unbounded preceding and current row
      ) as eligible_rank_no
    from public.round_evaluations e
    join public.round_bets rb
      on rb.round_no = e.round_no
     and rb.team_id = e.team_id
    where e.round_no = p_round_no
  )
  insert into public.round_results (round_no, team_id, rank_no, score, final_bet, is_winner, payout)
  select
    p_round_no,
    r.team_id,
    r.rank_no,
    r.score,
    r.final_bet,
    (r.second_decision <> 'withdraw' and r.eligible_rank_no <= v_winner_count) as is_winner,
    0
  from ranked r;

  -- Pot is total committed stake. Withdraw still loses the initial stake.
  select coalesce(
    sum(
      case
        when rb.second_decision = 'withdraw' then rb.initial_bet
        else coalesce(rb.final_bet, rb.initial_bet, 0)
      end
    ),
    0
  ) into v_pot
  from public.round_bets rb
  where rb.round_no = p_round_no;

  select coalesce(sum(rr.final_bet), 0) into v_winner_bet_sum
  from public.round_results rr
  where rr.round_no = p_round_no and rr.is_winner;

  if v_winner_bet_sum > 0 then
    update public.round_results rr
    set payout = floor((v_pot::numeric * rr.final_bet::numeric) / v_winner_bet_sum::numeric)::integer
    where rr.round_no = p_round_no
      and rr.is_winner;

    select coalesce(sum(rr.payout), 0) into v_allocated
    from public.round_results rr
    where rr.round_no = p_round_no and rr.is_winner;

    v_remainder := greatest(v_pot - v_allocated, 0);

    if v_remainder > 0 then
      update public.round_results rr
      set payout = rr.payout + v_remainder
      where rr.id = (
        select id
        from public.round_results rrx
        where rrx.round_no = p_round_no and rrx.is_winner
        order by rrx.final_bet desc, rrx.score desc, rrx.rank_no asc
        limit 1
      );
    end if;
  elsif v_pot > 0 then
    -- Defensive fallback: if winner final-bet sum is zero, give full pot to top winner.
    update public.round_results rr
    set payout = v_pot
    where rr.id = (
      select id
      from public.round_results rrx
      where rrx.round_no = p_round_no and rrx.is_winner
      order by rrx.score desc, rrx.rank_no asc
      limit 1
    );
  end if;

  update public.teams t
  set points = t.points
    - (
      case
        when rb.second_decision = 'withdraw' then rb.initial_bet
        else coalesce(rb.final_bet, rb.initial_bet, 0)
      end
    )
    + case when rr.is_winner then rr.payout else 0 end
  from public.round_results rr
  join public.round_bets rb
    on rb.round_no = rr.round_no
   and rb.team_id = rr.team_id
  where rr.round_no = p_round_no
    and rr.team_id = t.id;

  insert into public.betting_transactions (team_id, round_no, delta_points, reason)
  select
    rr.team_id,
    rr.round_no,
    (
      -(
        case
          when rb.second_decision = 'withdraw' then rb.initial_bet
          else coalesce(rb.final_bet, rb.initial_bet, 0)
        end
      )
      + case when rr.is_winner then rr.payout else 0 end
    ) as delta_points,
    case when rr.is_winner
      then 'Round settlement (winner weighted payout)'
      else 'Round settlement (lost bet)'
    end as reason
  from public.round_results rr
  join public.round_bets rb
    on rb.round_no = rr.round_no
   and rb.team_id = rr.team_id
  where rr.round_no = p_round_no;

  update public.betting_round_control
  set
    phase = 'settled',
    updated_by = auth.uid(),
    updated_at = timezone('utc', now())
  where betting_round_control.round_no = p_round_no;

  return query
  select
    rr.round_no,
    rr.team_id,
    rr.rank_no,
    rr.score,
    rr.final_bet,
    rr.is_winner,
    rr.payout,
    (
      -(
        case
          when rb.second_decision = 'withdraw' then rb.initial_bet
          else coalesce(rb.final_bet, rb.initial_bet, 0)
        end
      )
      + case when rr.is_winner then rr.payout else 0 end
    ) as points_delta
  from public.round_results rr
  join public.round_bets rb
    on rb.round_no = rr.round_no
   and rb.team_id = rr.team_id
  where rr.round_no = p_round_no
  order by rr.rank_no asc;
end;
$$;

-- Look up a user's UUID by email (admins use this to add role members)
create or replace function public.get_user_id_by_email(p_email text)
  returns uuid language sql security definer stable
  set search_path = public as $$
    select id from auth.users where email = p_email limit 1;
  $$;

-- STEP 8: Teams policies
create policy "Leader can insert own team"
  on public.teams for insert with check (auth.uid() = leader_id);
create policy "Leader can update own team"
  on public.teams for update using (auth.uid() = leader_id);
create policy "All authenticated can view teams"
  on public.teams for select to authenticated using (true);
create policy "Admin and Judge can update any team"
  on public.teams for update to authenticated
  using (public.is_admin() or public.is_judge());

-- STEP 9: Team members policies
create policy "Leader can manage members"
  on public.team_members for all
  using   (exists (select 1 from public.teams where teams.id = team_members.team_id and teams.leader_id = auth.uid()))
  with check (exists (select 1 from public.teams where teams.id = team_members.team_id and teams.leader_id = auth.uid()));
create policy "Team members can view their team"
  on public.team_members for select using (
    team_id = public.get_my_team_id()
  );

-- Problem statements policies
create policy "Authenticated can view problem statements"
  on public.problem_statements for select to authenticated
  using (true);
create policy "Admin can manage problem statements"
  on public.problem_statements for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Authenticated can view domain constraints"
  on public.domain_constraints for select to authenticated
  using (true);
create policy "Admin can manage domain constraints"
  on public.domain_constraints for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Authenticated can view constraint round settings"
  on public.constraint_round_settings for select to authenticated
  using (true);
create policy "Admin can manage constraint round settings"
  on public.constraint_round_settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can view all team members"
  on public.team_members for select to authenticated
  using (public.is_admin());

-- STEP 10: Core users policies
create policy "Core user verify own access"
  on public.core_users for select to authenticated using (user_id = auth.uid());
create policy "Admin can view all core users"
  on public.core_users for select to authenticated using (public.is_admin());
create policy "Admin can manage core users"
  on public.core_users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- STEP 10.5: Admin users policies
create policy "Admin self-access"
  on public.admin_users for select to authenticated using (user_id = auth.uid());
create policy "Admin can view all admins"
  on public.admin_users for select to authenticated using (public.is_admin());
create policy "Admin can manage admins"
  on public.admin_users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- STEP 10.6: Judge users policies
create policy "Judge self-access"
  on public.judge_users for select to authenticated using (user_id = auth.uid());
create policy "Admin can view all judges"
  on public.judge_users for select to authenticated using (public.is_admin());
create policy "Admin can manage judges"
  on public.judge_users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

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
create policy "Admin can view all attendance"
  on public.attendance for select to authenticated
  using (public.is_admin());

create policy "Admin can insert attendance"
  on public.attendance for insert to authenticated
  with check (public.is_admin());

-- STEP 14: Admin broad access
create policy "Admin can manage registrations"
  on public.registrations for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "Admin can view all sessions"
  on public.sessions for select to authenticated
  using (public.is_admin());

-- STEP 14.5: Hackathon timer config policies
create policy "Authenticated can read hackathon config"
  on public.hackathon_config for select to authenticated
  using (true);

create policy "Admin can manage hackathon config"
  on public.hackathon_config for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- STEP 14.6: Betting game policies
create policy "Authenticated can view betting round control"
  on public.betting_round_control for select to authenticated
  using (true);

create policy "Admin can manage betting round control"
  on public.betting_round_control for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Team actors can view own round bets"
  on public.round_bets for select to authenticated
  using (public.is_team_actor(team_id) or public.is_admin() or public.is_judge());

create policy "Authenticated can view round bets leaderboard"
  on public.round_bets for select to authenticated
  using (true);

create policy "Leader can create own team round bet"
  on public.round_bets for insert to authenticated
  with check (public.is_team_leader(team_id));

create policy "Leader can update own team round bet"
  on public.round_bets for update to authenticated
  using (public.is_team_leader(team_id))
  with check (public.is_team_leader(team_id));

create policy "Admin and Judge can manage round bets"
  on public.round_bets for all to authenticated
  using (public.is_admin() or public.is_judge())
  with check (public.is_admin() or public.is_judge());

create policy "Authenticated can view round evaluations"
  on public.round_evaluations for select to authenticated
  using (true);

create policy "Admin and Judge can manage evaluations"
  on public.round_evaluations for all to authenticated
  using (public.is_admin() or public.is_judge())
  with check (public.is_admin() or public.is_judge());

create policy "Authenticated can view round results"
  on public.round_results for select to authenticated
  using (true);

create policy "Admin and Judge can manage round results"
  on public.round_results for all to authenticated
  using (public.is_admin() or public.is_judge())
  with check (public.is_admin() or public.is_judge());

create policy "Team actors can view own betting transactions"
  on public.betting_transactions for select to authenticated
  using (public.is_team_actor(team_id) or public.is_admin() or public.is_judge());

create policy "Admin and Judge can insert betting transactions"
  on public.betting_transactions for insert to authenticated
  with check (public.is_admin() or public.is_judge());
