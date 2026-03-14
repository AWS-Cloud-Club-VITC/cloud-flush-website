-- Update: 2026-03-14
-- Purpose: Fix settlement winner eligibility and payout handling.

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
  )
  language plpgsql
  security definer
  set search_path = public
as $$
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

  select *
    into v_ctrl
  from public.betting_round_control brc
  where brc.round_no = p_round_no
  for update;

  if not found then
    raise exception 'Round % is not configured', p_round_no;
  end if;

  if v_ctrl.phase not in ('evaluation', 'settled') then
    raise exception 'Round % must be in evaluation phase before settlement', p_round_no;
  end if;

  perform public.apply_hold_timeouts(p_round_no);

  delete from public.round_results rr
  where rr.round_no = p_round_no;

  select count(*)
    into v_participant_count
  from public.round_evaluations e
  join public.round_bets rb
    on rb.round_no = e.round_no
   and rb.team_id = e.team_id
  where e.round_no = p_round_no;

  if v_participant_count > 1 then
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

  select coalesce(
           sum(
             case
               when rb.second_decision = 'withdraw' then rb.initial_bet
               else coalesce(rb.final_bet, rb.initial_bet, 0)
             end
           ),
           0
         )
    into v_pot
  from public.round_bets rb
  where rb.round_no = p_round_no;

  select coalesce(sum(rr.final_bet), 0)
    into v_winner_bet_sum
  from public.round_results rr
  where rr.round_no = p_round_no
    and rr.is_winner;

  if v_winner_bet_sum > 0 then
    update public.round_results rr
    set payout = floor((v_pot::numeric * rr.final_bet::numeric) / v_winner_bet_sum::numeric)::integer
    where rr.round_no = p_round_no
      and rr.is_winner;

    select coalesce(sum(rr.payout), 0)
      into v_allocated
    from public.round_results rr
    where rr.round_no = p_round_no
      and rr.is_winner;

    v_remainder := greatest(v_pot - v_allocated, 0);

    if v_remainder > 0 then
      update public.round_results rr
      set payout = rr.payout + v_remainder
      where rr.id = (
        select id
        from public.round_results rrx
        where rrx.round_no = p_round_no
          and rrx.is_winner
        order by rrx.final_bet desc, rrx.score desc, rrx.rank_no asc
        limit 1
      );
    end if;

  elsif v_pot > 0 then
    update public.round_results rr
    set payout = v_pot
    where rr.id = (
      select id
      from public.round_results rrx
      where rrx.round_no = p_round_no
        and rrx.is_winner
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
    case
      when rr.is_winner then 'Round settlement (winner weighted payout)'
      else 'Round settlement (lost bet)'
    end as reason
  from public.round_results rr
  join public.round_bets rb
    on rb.round_no = rr.round_no
   and rb.team_id = rr.team_id
  where rr.round_no = p_round_no;

  update public.betting_round_control
  set phase = 'settled',
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
