-- Update: 2026-03-15
-- Purpose: Add admin RPC to reset all betting rounds and restore baseline points.

create or replace function public.reset_all_betting_rounds()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp with time zone := timezone('utc', now());
begin
  if not public.is_admin() then
    raise exception 'Only admins can reset rounds';
  end if;

  -- Clear all betting lifecycle data.
  delete from public.round_results where true;
  delete from public.round_evaluations where true;
  delete from public.round_bets where true;
  delete from public.betting_transactions where true;

  -- Restore baseline team points used at game start.
  update public.teams
  set points = 1000
  where true;

  -- Ensure controls exist for all rounds.
  insert into public.betting_round_control (round_no)
  values (1), (2), (3), (4), (5)
  on conflict (round_no) do nothing;

  -- Reset all rounds to initial setup state.
  update public.betting_round_control
  set
    phase = 'setup',
    betting_starts_at = null,
    betting_ends_at = null,
    decision_starts_at = null,
    decision_ends_at = null,
    min_bet = 50,
    max_bet = 1000,
    show_betting_leaderboard = false,
    updated_by = auth.uid(),
    updated_at = v_now
  where true;
end;
$$;