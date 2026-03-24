-- Update: 2026-03-14
-- Purpose: Add per-round admin toggle to control betting leaderboard visibility on leader Play page.

alter table public.betting_round_control
  add column if not exists show_betting_leaderboard boolean not null default false;

-- Keep existing rounds hidden by default until admin enables visibility.
update public.betting_round_control
set show_betting_leaderboard = false
where show_betting_leaderboard is distinct from false;
