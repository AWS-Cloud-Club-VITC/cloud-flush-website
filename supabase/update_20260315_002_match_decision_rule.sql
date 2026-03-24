-- Update: 2026-03-15
-- Purpose: Replace second decision "double" with "match" semantics.
-- Rule: MATCH sets final bet to the current top initial bet in that round.

alter table public.round_bets
  drop constraint if exists round_bets_second_decision_check;

alter table public.round_bets
  add constraint round_bets_second_decision_check
  check (second_decision in ('hold', 'match', 'double', 'withdraw'));

create or replace function public.submit_second_decision(p_round_no integer, p_decision text)
  returns public.round_bets
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_team_id uuid;
  v_points integer;
  v_ctrl public.betting_round_control%rowtype;
  v_bet public.round_bets%rowtype;
  v_final integer;
  v_top_initial integer;
  v_decision text := lower(trim(p_decision));
  v_row public.round_bets;
begin
  -- Backward compatibility: treat legacy "double" as "match".
  if v_decision = 'double' then
    v_decision := 'match';
  end if;

  if v_decision not in ('hold', 'match', 'withdraw') then
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

  if v_decision = 'match' then
    select coalesce(max(rb.initial_bet), v_bet.initial_bet)
      into v_top_initial
    from public.round_bets rb
    where rb.round_no = p_round_no;

    v_final := v_top_initial;
  elsif v_decision = 'withdraw' then
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
    second_decision = v_decision,
    final_bet = v_final,
    decision_locked = true,
    decision_at = timezone('utc', now())
  where id = v_bet.id
  returning * into v_row;

  return v_row;
end;
$$;