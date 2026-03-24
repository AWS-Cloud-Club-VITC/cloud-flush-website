"use client";

import { useEffect, useState, useCallback, Fragment, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminSupabase as supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

type AdminNav = "overview" | "teams" | "users" | "access" | "database" | "problems" | "constraints" | "betting" | "updates" | "settings";
type AccessTab = "core" | "admin" | "judge";
type TeamRow = { id: string; team_name: string; leader_id: string; points: number; is_vit_chennai: boolean; created_at: string };
type RoleUser = { id: string; user_id: string; email: string | null; name?: string | null; created_at?: string | null };
type Stats = { teams: number; members: number; attendance: number; registrations: number };
type MemberRow = { id: string; name: string; email: string; reg_no: string; user_id: string | null; team_id: string; teams: { team_name: string; leader_id: string } | null };
type ExportRow = { name: string; team_name: string; email: string; reg_no: string; role: string };
type Registration = { id: string; name: string; reg_no: string; email: string; team_name: string };
type HackathonConfig = { id: number; starts_at: string; duration_minutes: number; is_running: boolean };
type ProblemStatement = { id: string; domain: string; title: string; statement: string; created_at: string };
type DomainConstraint = { id: string; domain: string; round_no: number; title: string; constraint_text: string; created_at: string };
type ConstraintRoundSetting = { round_no: number; is_enabled: boolean };
type BettingRoundControl = {
  round_no: number;
  phase: "setup" | "betting" | "decision" | "evaluation" | "settled";
  min_bet: number;
  max_bet: number;
  show_betting_leaderboard: boolean;
};
type BettingRoundBet = {
  id: string;
  team_id: string;
  initial_bet: number;
  second_decision: "hold" | "match" | "double" | "withdraw" | null;
  final_bet: number | null;
  decision_locked: boolean;
  teams: { team_name: string; points: number } | null;
};
type BettingRoundEvaluation = { team_id: string; score: number; notes: string | null };
type BettingRoundResult = {
  team_id: string;
  rank_no: number;
  score: number;
  final_bet: number;
  is_winner: boolean;
  payout: number;
  teams: { team_name: string } | null;
};
type DashboardUpdate = { id: string; title: string; body: string; created_at: string };

const ROUND_WEIGHTAGE: Record<number, number> = {
  1: 1,
  2: 1.5,
  3: 2,
  4: 2.5,
  5: 3,
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconGrid() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconUsers() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconShield() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconSettings() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconLogout() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function IconTrash() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function IconPlus() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconMenu() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function IconTable() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>; }
function IconDownload() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconDatabase() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>; }
function IconDoc() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>; }
function IconLock() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>; }
function IconUpload() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconRefresh() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>; }
function IconEdit() { return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconPlay() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function IconCoins() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 11v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5"/></svg>; }
function IconBell() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"/><path d="M10 17a2 2 0 0 0 4 0"/></svg>; }

// ── Theme ─────────────────────────────────────────────────────────────────────

// ── Betting Control ──────────────────────────────────────────────────────────
function BettingSection() {
  const [roundNo, setRoundNo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingControl, setSavingControl] = useState(false);
  const [runningAction, setRunningAction] = useState<"settle" | "reset-all" | null>(null);
  const [control, setControl] = useState<BettingRoundControl | null>(null);
  const [bets, setBets] = useState<BettingRoundBet[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, { score: string; notes: string }>>({});
  const [results, setResults] = useState<BettingRoundResult[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const potPoints = bets.reduce((sum, row) => {
    const committed = row.second_decision === "withdraw"
      ? row.initial_bet
      : (row.final_bet ?? row.initial_bet);
    return sum + committed;
  }, 0);

  const evaluationLeaderboard = [...results].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.final_bet !== a.final_bet) return b.final_bet - a.final_bet;
    return a.rank_no - b.rank_no;
  });

  const bettingPointsLeaderboard = [...bets]
    .map((row) => ({
      team_id: row.team_id,
      team_name: row.teams?.team_name ?? row.team_id,
      committed: row.second_decision === "withdraw" ? row.initial_bet : (row.final_bet ?? row.initial_bet),
      initial_bet: row.initial_bet,
      final_bet: row.final_bet ?? row.initial_bet,
      second_decision: row.second_decision,
    }))
    .sort((a, b) => b.committed - a.committed);

  const loadRound = useCallback(async () => {
    setLoading(true);
    setMsg(null);

    const [controlRes, betsRes, evalRes, resultsRes] = await Promise.all([
      supabase
        .from("betting_round_control")
        .select("round_no, phase, min_bet, max_bet, show_betting_leaderboard")
        .eq("round_no", roundNo)
        .maybeSingle(),
      supabase
        .from("round_bets")
        .select("id, team_id, initial_bet, second_decision, final_bet, decision_locked, teams(team_name, points)")
        .eq("round_no", roundNo)
        .order("final_bet", { ascending: false }),
      supabase
        .from("round_evaluations")
        .select("team_id, score, notes")
        .eq("round_no", roundNo),
      supabase
        .from("round_results")
        .select("team_id, rank_no, score, final_bet, is_winner, payout, teams(team_name)")
        .eq("round_no", roundNo)
        .order("rank_no", { ascending: true }),
    ]);

    if (controlRes.error || betsRes.error || evalRes.error || resultsRes.error) {
      setMsg({ type: "err", text: controlRes.error?.message || betsRes.error?.message || evalRes.error?.message || resultsRes.error?.message || "Failed to load betting data." });
      setLoading(false);
      return;
    }

    setControl((controlRes.data ?? null) as BettingRoundControl | null);
    setBets((betsRes.data ?? []) as unknown as BettingRoundBet[]);
    setResults((resultsRes.data ?? []) as unknown as BettingRoundResult[]);

    const evalMap: Record<string, { score: string; notes: string }> = {};
    ((evalRes.data ?? []) as BettingRoundEvaluation[]).forEach((row) => {
      evalMap[row.team_id] = { score: String(row.score), notes: row.notes ?? "" };
    });
    setEvaluations(evalMap);
    setLoading(false);
  }, [roundNo]);

  useEffect(() => {
    loadRound();
  }, [loadRound]);

  async function saveControl() {
    if (!control) return;
    setSavingControl(true);
    setMsg(null);
    const payload = {
      round_no: roundNo,
      phase: control.phase,
      min_bet: control.min_bet,
      max_bet: control.max_bet,
      show_betting_leaderboard: control.show_betting_leaderboard,
    };
    const { error } = await supabase.from("betting_round_control").upsert(payload, { onConflict: "round_no" });
    setSavingControl(false);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Round control saved." });
    await loadRound();
  }

  async function saveEvaluation(teamId: string) {
    const row = evaluations[teamId];
    const score = Number(row?.score);
    if (!Number.isFinite(score)) {
      setMsg({ type: "err", text: "Enter a valid numeric score." });
      return;
    }
    setMsg(null);
    const { error } = await supabase
      .from("round_evaluations")
      .upsert({
        round_no: roundNo,
        team_id: teamId,
        score,
        notes: row?.notes ?? null,
      }, { onConflict: "round_no,team_id" });
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Evaluation saved." });
    await loadRound();
  }

  async function settleRound() {
    const confirmed = confirm(`Settle round ${roundNo}? This applies weighted payout by final bet among winners.`);
    if (!confirmed) return;
    setRunningAction("settle");
    setMsg(null);
    const { error } = await supabase.rpc("settle_betting_round", { p_round_no: roundNo });
    setRunningAction(null);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Round settled successfully." });
    await loadRound();
  }

  async function resetAllRounds() {
    const confirmed = confirm("Reset ALL betting rounds? This will clear all bets, evaluations, results, and reset team points to 1000.");
    if (!confirmed) return;

    setRunningAction("reset-all");
    setMsg(null);
    const { error } = await supabase.rpc("reset_all_betting_rounds");
    setRunningAction(null);

    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }

    setMsg({ type: "ok", text: "All betting rounds reset successfully." });
    await loadRound();
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 mb-3 items-stretch">
          <div className="rounded-md border p-4" style={{ borderColor: T.border, background: T.bg }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: T.text }}>Constraint Betting System</p>
                <p className="text-xs" style={{ color: T.muted }}>Payout mode: winners share pot proportionally by final bet.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={roundNo}
                  onChange={(e) => setRoundNo(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-md text-xs outline-none"
                  style={{ ...inputStyle, width: 120 }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>Round {n}</option>
                  ))}
                </select>
                <button onClick={loadRound} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>
                  <IconRefresh /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => control && setControl({ ...control, show_betting_leaderboard: !control.show_betting_leaderboard })}
                  disabled={!control}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
                  style={control?.show_betting_leaderboard
                    ? { background: `${T.green}22`, color: T.green, border: `1px solid ${T.green}55` }
                    : { background: `${T.yellow}22`, color: T.yellow, border: `1px solid ${T.yellow}55` }}
                >
                  {control?.show_betting_leaderboard ? "Pot/Board: Visible" : "Pot/Board: Hidden"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-md border px-4 py-3 flex flex-col justify-between" style={{ borderColor: `${T.yellow}55`, background: "linear-gradient(90deg, rgba(212,160,23,0.18) 0%, rgba(212,160,23,0.05) 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md flex items-center justify-center" style={{ background: "rgba(0,0,0,0.22)", color: T.yellow, border: `1px solid ${T.yellow}55` }}>
                <IconCoins />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: T.yellow }}>Round Pot</p>
                <p className="text-xl font-extrabold" style={{ color: T.text }}>{potPoints.toLocaleString()} pts</p>
              </div>
            </div>
            <p className="text-[11px] mt-2" style={{ color: T.muted }}>
              Pot = total committed stake this round. If a team selects withdraw, their initial bet is still added to pot.
            </p>
          </div>
        </div>

        {loading || !control ? (
          <p className="text-sm" style={{ color: T.muted }}>Loading round controls…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Phase</label>
              <select
                value={control.phase}
                onChange={(e) => setControl({ ...control, phase: e.target.value as BettingRoundControl["phase"] })}
                className="w-full px-3 py-1.5 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                {(["setup", "betting", "decision", "evaluation", "settled"] as const).map((phase) => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Min Bet</label>
              <input
                type="number"
                value={control.min_bet}
                onChange={(e) => setControl({ ...control, min_bet: Number(e.target.value) || 0 })}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Max Bet</label>
              <input
                type="number"
                value={control.max_bet}
                onChange={(e) => setControl({ ...control, max_bet: Number(e.target.value) || 0 })}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={saveControl}
                disabled={savingControl}
                className="w-full px-3 py-2 rounded-md text-xs font-semibold text-white disabled:opacity-60"
                style={{ background: T.blue }}
              >
                {savingControl ? "Saving…" : "Save Control"}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={settleRound}
            disabled={runningAction !== null}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: T.green }}
          >
            {runningAction === "settle" ? "Settling…" : "Settle Round"}
          </button>
          <button
            onClick={resetAllRounds}
            disabled={runningAction !== null}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: T.red }}
          >
            {runningAction === "reset-all" ? "Resetting…" : "Reset All Rounds"}
          </button>
        </div>

        {msg && <p className="text-xs mt-3" style={{ color: msg.type === "ok" ? T.green : T.red }}>{msg.text}</p>}
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Bets & Evaluation</p>
        {bets.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>No bets submitted for this round.</p>
        ) : (
          <div className="space-y-2">
            {bets.map((row) => (
              <div key={row.id} className="rounded-md border p-3" style={{ borderColor: T.border, background: T.bg }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: T.text }}>{row.teams?.team_name ?? row.team_id}</p>
                    <p className="text-[10px]" style={{ color: T.muted }}>
                      Initial: {row.initial_bet} · Final: {row.final_bet ?? row.initial_bet} · Decision: {row.second_decision === "double" ? "match" : (row.second_decision ?? "pending")}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={row.decision_locked ? { background: `${T.green}20`, color: T.green, border: `1px solid ${T.green}55` } : { background: `${T.yellow}20`, color: T.yellow, border: `1px solid ${T.yellow}55` }}>
                    {row.decision_locked ? "Decision locked" : "Decision pending"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_auto] gap-2 mt-3">
                  <input
                    type="number"
                    value={evaluations[row.team_id]?.score ?? ""}
                    onChange={(e) => setEvaluations((prev) => ({
                      ...prev,
                      [row.team_id]: { score: e.target.value, notes: prev[row.team_id]?.notes ?? "" },
                    }))}
                    placeholder="Score"
                    className={inputCls}
                    style={inputStyle}
                  />
                  <input
                    value={evaluations[row.team_id]?.notes ?? ""}
                    onChange={(e) => setEvaluations((prev) => ({
                      ...prev,
                      [row.team_id]: { score: prev[row.team_id]?.score ?? "", notes: e.target.value },
                    }))}
                    placeholder="Notes (optional)"
                    className={inputCls}
                    style={inputStyle}
                  />
                  <button
                    onClick={() => saveEvaluation(row.team_id)}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold text-white"
                    style={{ background: T.blue }}
                  >
                    Save Score
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Round Results</p>
        {results.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>No settlement results yet.</p>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.team_id} className="rounded-md border p-3 flex items-center justify-between" style={{ borderColor: T.border, background: T.bg }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: T.text }}>#{r.rank_no} · {r.teams?.team_name ?? r.team_id}</p>
                  <p className="text-[10px]" style={{ color: T.muted }}>Score {r.score} · Final Bet {r.final_bet}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: r.is_winner ? T.green : T.red }}>{r.is_winner ? "Winner" : "Eliminated"}</p>
                  <p className="text-sm font-bold" style={{ color: T.yellow }}>Payout {r.payout}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Leaderboards</p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="rounded-md border p-3" style={{ borderColor: T.border, background: T.bg }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: T.muted }}>Evaluation Leaderboard</p>
            {evaluationLeaderboard.length === 0 ? (
              <p className="text-sm" style={{ color: T.muted }}>No evaluation scores yet.</p>
            ) : (
              <div className="space-y-2">
                {evaluationLeaderboard.map((row, idx) => (
                  <div key={`eval-${row.team_id}`} className="rounded-md border px-3 py-2 flex items-center justify-between" style={{ borderColor: T.border, background: "rgba(255,255,255,0.02)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: T.text }}>#{idx + 1} · {row.teams?.team_name ?? row.team_id}</p>
                      <p className="text-[10px]" style={{ color: T.muted }}>Score {row.score} · Rank {row.rank_no}</p>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: row.is_winner ? T.green : T.muted }}>{row.is_winner ? "Winner" : "Eliminated"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border p-3" style={{ borderColor: T.border, background: T.bg }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: T.muted }}>Betting Points Leaderboard</p>
            {bettingPointsLeaderboard.length === 0 ? (
              <p className="text-sm" style={{ color: T.muted }}>No betting activity yet.</p>
            ) : (
              <div className="space-y-2">
                {bettingPointsLeaderboard.map((row, idx) => (
                  <div key={`bet-${row.team_id}`} className="rounded-md border px-3 py-2 flex items-center justify-between" style={{ borderColor: T.border, background: "rgba(255,255,255,0.02)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: T.text }}>#{idx + 1} · {row.team_name}</p>
                      <p className="text-[10px]" style={{ color: T.muted }}>
                        Initial {row.initial_bet} · Final {row.final_bet} · Decision {row.second_decision === "double" ? "match" : (row.second_decision ?? "pending")}
                      </p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: T.yellow }}>{row.committed} pts</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}


const T = {
  bg: "#0d1117", card: "#161b22", border: "#30363d",
  text: "#e6edf3", muted: "#8b949e", blue: "#58a6ff",
  green: "#238636", red: "#da3633", yellow: "#d29922",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border p-4 ${className}`} style={{ background: T.card, borderColor: T.border }}>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: T.muted }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? T.text }}>{value}</p>
    </Card>
  );
}

const inputCls = "w-full px-3 py-1.5 rounded-md text-sm outline-none transition-colors";
const inputStyle = { background: T.bg, border: `1px solid ${T.border}`, color: T.text };

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ stats, teams }: { stats: Stats; teams: TeamRow[] }) {
  const top3 = [...teams].sort((a, b) => b.points - a.points).slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Teams" value={stats.teams} color={T.blue} />
        <Stat label="Members" value={stats.members} />
        <Stat label="Attendance Records" value={stats.attendance} color={T.green} />
        <Stat label="Registrations" value={stats.registrations} color={T.yellow} />
      </div>
      <Card>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: T.muted }}>Top Teams</p>
        {top3.length === 0 && <p className="text-sm" style={{ color: T.muted }}>No teams yet.</p>}
        <div className="space-y-2">
          {top3.map((t, i) => (
            <div key={t.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{medals[i]}</span>
                <span className="text-sm font-medium" style={{ color: T.text }}>{t.team_name}</span>
                {t.is_vit_chennai && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1f6feb20", color: T.blue, border: `1px solid ${T.blue}40` }}>VIT-C</span>}
              </div>
              <span className="text-sm font-bold" style={{ color: T.yellow }}>{t.points.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function HackathonControlCard({
  config,
  user,
  onUpdated,
}: {
  config: HackathonConfig;
  user: User;
  onUpdated: () => Promise<void>;
}) {
  const [durationHours, setDurationHours] = useState(String(Math.max(1, Math.round(config.duration_minutes / 60))));
  const [startsAtLocal, setStartsAtLocal] = useState(toLocalInputValue(config.starts_at));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setDurationHours(String(Math.max(1, Math.round(config.duration_minutes / 60))));
    setStartsAtLocal(toLocalInputValue(config.starts_at));
  }, [config.duration_minutes, config.starts_at]);

  async function saveConfig(next: { startsAt: string; durationMinutes: number; isRunning: boolean }) {
    setSaving(true);
    setMsg(null);

    const payload = {
      starts_at: next.startsAt,
      duration_minutes: next.durationMinutes,
      is_running: next.isRunning,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Update existing config row first to avoid accidental insert-policy failures.
    const { data: updatedRows, error: updateError } = await supabase
      .from("hackathon_config")
      .update(payload)
      .eq("id", 1)
      .select("id");

    let error = updateError;

    if (!error && (!updatedRows || updatedRows.length === 0)) {
      const { error: insertError } = await supabase.from("hackathon_config").insert({ id: 1, ...payload });
      error = insertError;
    }

    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: `${error.message}. Ensure hackathon_config row id=1 exists and admin policy is applied.` });
      return;
    }
    setMsg({ type: "ok", text: "Hackathon timer updated." });
    await onUpdated();
  }

  async function handleSaveDraft() {
    const hours = Math.max(1, parseInt(durationHours || "24", 10));
    const startsAt = startsAtLocal ? new Date(startsAtLocal).toISOString() : config.starts_at;
    await saveConfig({ startsAt, durationMinutes: hours * 60, isRunning: config.is_running });
  }

  async function handleStartNow() {
    const hours = Math.max(1, parseInt(durationHours || "24", 10));
    await saveConfig({ startsAt: new Date().toISOString(), durationMinutes: hours * 60, isRunning: true });
  }

  async function handleReset() {
    const hours = Math.max(1, parseInt(durationHours || "24", 10));
    await saveConfig({ startsAt: new Date().toISOString(), durationMinutes: hours * 60, isRunning: false });
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: T.muted }}>Hackathon Timer Control</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Duration (Hours)</label>
          <input
            type="number"
            min={1}
            value={durationHours}
            onChange={e => setDurationHours(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Planned Start</label>
          <input
            type="datetime-local"
            value={startsAtLocal}
            onChange={e => setStartsAtLocal(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={handleSaveDraft} disabled={saving} className="px-3 py-1.5 rounded-md text-xs font-semibold"
          style={{ background: "#1f6feb20", color: T.blue, border: `1px solid ${T.blue}50` }}>
          Save Config
        </button>
        <button onClick={handleStartNow} disabled={saving} className="px-3 py-1.5 rounded-md text-xs font-semibold text-white"
          style={{ background: T.green }}>
          Start Hackathon
        </button>
        <button onClick={handleReset} disabled={saving} className="px-3 py-1.5 rounded-md text-xs font-semibold"
          style={{ background: "rgba(218,54,51,0.1)", color: T.red, border: `1px solid ${T.red}40` }}>
          Reset
        </button>
      </div>
      <p className="mt-2 text-xs" style={{ color: config.is_running ? T.green : T.muted }}>
        Status: {config.is_running ? "Running" : "Not started"} · Current duration: {Math.max(1, Math.round(config.duration_minutes / 60))}h
      </p>
      {msg && <p className="mt-1 text-xs" style={{ color: msg.type === "ok" ? T.green : T.red }}>{msg.text}</p>}
    </Card>
  );
}

// ── Teams ─────────────────────────────────────────────────────────────────────
function TeamsSection({ teams, onRefresh }: { teams: TeamRow[]; onRefresh: () => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editPts, setEditPts] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function savePoints(id: string) {
    const pts = parseInt(editPts);
    if (isNaN(pts)) return;
    setSaving(true); setMsg("");
    const { error } = await supabase.from("teams").update({ points: pts }).eq("id", id);
    setSaving(false);
    if (error) { setMsg(error.message); return; }
    setEditId(null); onRefresh();
  }

  async function toggleVit(t: TeamRow) {
    await supabase.from("teams").update({ is_vit_chennai: !t.is_vit_chennai }).eq("id", t.id);
    onRefresh();
  }

  const sorted = [...teams].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: T.text }}>All Teams ({teams.length})</p>
        <p className="text-xs" style={{ color: T.muted }}>Click pts to edit · toggle VIT-C flag</p>
      </div>
      {msg && <p className="text-xs" style={{ color: T.red }}>{msg}</p>}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: T.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#161b22", borderBottom: `1px solid ${T.border}` }}>
              {["#", "Team Name", "Points", "VIT-C", "Leader ID", "Created"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-widest font-medium" style={{ color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}20`, background: i % 2 === 0 ? T.bg : "transparent" }}>
                <td className="px-3 py-2" style={{ color: T.muted }}>{i + 1}</td>
                <td className="px-3 py-2 font-medium" style={{ color: T.text }}>{t.team_name}</td>
                <td className="px-3 py-2">
                  {editId === t.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={editPts} onChange={e => setEditPts(e.target.value)}
                        className="w-20 px-2 py-0.5 rounded text-xs outline-none" style={{ ...inputStyle, border: `1px solid ${T.blue}` }} />
                      <button onClick={() => savePoints(t.id)} disabled={saving}
                        className="px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ background: T.green }}>
                        {saving ? "…" : "✓"}
                      </button>
                      <button onClick={() => setEditId(null)} className="px-2 py-0.5 rounded text-xs" style={{ color: T.muted }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditId(t.id); setEditPts(String(t.points)); }}
                      className="font-bold hover:underline" style={{ color: T.yellow }}>{t.points}</button>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => toggleVit(t)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={t.is_vit_chennai ? { background: "#1f6feb20", color: T.blue, border: `1px solid ${T.blue}40` } : { background: "transparent", color: T.muted, border: `1px solid ${T.border}` }}>
                    {t.is_vit_chennai ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-3 py-2 font-mono text-xs" style={{ color: T.muted }}>{t.leader_id.slice(0, 8)}…</td>
                <td className="px-3 py-2 text-xs" style={{ color: T.muted }}>{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p className="px-4 py-8 text-center text-sm" style={{ color: T.muted }}>No teams yet.</p>}
      </div>
    </div>
  );
}

// ── Access Management ─────────────────────────────────────────────────────────
function AccessSection() {
  const [tab, setTab] = useState<AccessTab>("core");
  const [users, setUsers] = useState<Record<AccessTab, RoleUser[]>>({ core: [], admin: [], judge: [] });
  const [addEmail, setAddEmail] = useState(""); const [addName, setAddName] = useState("");
  const [adding, setAdding] = useState(false); const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const tables: Record<AccessTab, string> = { core: "core_users", admin: "admin_users", judge: "judge_users" };
  const labels: Record<AccessTab, string> = { core: "Coordinator", admin: "Admin", judge: "Judge" };

  const load = useCallback(async () => {
    const results = await Promise.all(
      (["core", "admin", "judge"] as AccessTab[]).map(t => supabase.from(tables[t]).select("*").order("id"))
    );

    const firstError = results.find(r => r.error)?.error;
    if (firstError) {
      setMsg({ type: "err", text: `Failed to load access users: ${firstError.message}` });
    }

    setUsers({ core: results[0].data ?? [], admin: results[1].data ?? [], judge: results[2].data ?? [] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setAdding(true);
    try {
      const { data: uid } = await supabase.rpc("get_user_id_by_email", { p_email: addEmail.trim() });
      if (!uid) throw new Error("No user found with that email. They must sign up first.");
      const { error } = await supabase.from(tables[tab]).insert({ user_id: uid, email: addEmail.trim(), name: addName.trim() || null });
      if (error) throw error;
      setAddEmail(""); setAddName(""); setMsg({ type: "ok", text: `Added to ${labels[tab]}.` }); load();
    } catch (err: unknown) { setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed." }); }
    finally { setAdding(false); }
  }

  async function handleRemove(target: RoleUser) {
    setMsg(null);
    const who = target.email ?? target.user_id;
    if (!confirm(`Remove ${who} from ${labels[tab]} access?`)) return;

    if (tab === "admin") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && target.user_id === user.id) {
        setMsg({ type: "err", text: "You cannot remove your own admin access." });
        return;
      }

      if (users.admin.length <= 1) {
        setMsg({ type: "err", text: "At least one admin must remain." });
        return;
      }
    }

    const { error } = await supabase.from(tables[tab]).delete().eq("id", target.id);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }

    setMsg({ type: "ok", text: `${labels[tab]} access removed.` });
    load();
  }

  const tabColors: Record<AccessTab, string> = { core: T.green, admin: T.blue, judge: T.yellow };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["core", "admin", "judge"] as AccessTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={tab === t ? { background: tabColors[t], color: "#0d1117" } : { background: "transparent", color: T.muted, border: `1px solid ${T.border}` }}>
            {labels[t]} ({users[t].length})
          </button>
        ))}
      </div>

      {/* Add form */}
      <Card>
        <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: tabColors[tab] }}>Add {labels[tab]} user</p>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Email (must exist in auth)</label>
            <input required type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="user@example.com"
              className={inputCls} style={{ ...inputStyle, width: 220 }}
              onFocus={e => (e.target.style.borderColor = tabColors[tab])}
              onBlur={e => (e.target.style.borderColor = T.border)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Display Name</label>
            <input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Optional"
              className={inputCls} style={{ ...inputStyle, width: 160 }}
              onFocus={e => (e.target.style.borderColor = tabColors[tab])}
              onBlur={e => (e.target.style.borderColor = T.border)} />
          </div>
          <button type="submit" disabled={adding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: tabColors[tab], color: "#0d1117" }}>
            <IconPlus /> {adding ? "Adding…" : "Add"}
          </button>
        </form>
        {msg && <p className="mt-2 text-xs" style={{ color: msg.type === "ok" ? T.green : T.red }}>{msg.text}</p>}
      </Card>

      {/* Users list */}
      <div className="space-y-2">
        {users[tab].length === 0 && <p className="text-sm py-4 text-center" style={{ color: T.muted }}>No {labels[tab]} users.</p>}
        {users[tab].map(u => (
          <div key={u.id} className="flex items-center justify-between rounded-lg px-3 py-2 border" style={{ background: T.bg, borderColor: T.border }}>
            <div>
              <p className="text-sm font-medium" style={{ color: T.text }}>{u.name ?? <span style={{ color: T.muted }}>—</span>}</p>
              <p className="text-xs" style={{ color: T.muted }}>{u.email ?? u.user_id}</p>
            </div>
            <button onClick={() => handleRemove(u)} className="p-1.5 rounded hover:opacity-80 transition-opacity" style={{ color: T.red }}>
              <IconTrash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users / Export ───────────────────────────────────────────────────────────
function UsersSection() {
  const [rows, setRows] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamsWithoutMembers, setTeamsWithoutMembers] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const [{ data: teamsData }, { data: membersData }] = await Promise.all([
        supabase.from("teams").select("id, team_name, leader_id").order("created_at"),
        supabase
          .from("team_members")
          .select("id, name, email, reg_no, user_id, team_id, teams(team_name, leader_id)")
          .order("created_at"),
      ]);

      const teams = (teamsData ?? []) as Array<{ id: string; team_name: string; leader_id: string }>;
      const members = (membersData ?? []) as unknown as MemberRow[];

      const byTeam = new Map<string, { team_name: string; leader_id: string; members: MemberRow[] }>();
      for (const t of teams) {
        byTeam.set(t.id, { team_name: t.team_name, leader_id: t.leader_id, members: [] });
      }

      for (const m of members) {
        const tname = m.teams?.team_name ?? byTeam.get(m.team_id)?.team_name ?? "Unknown";
        const lid = m.teams?.leader_id ?? byTeam.get(m.team_id)?.leader_id ?? "";
        if (!byTeam.has(m.team_id)) byTeam.set(m.team_id, { team_name: tname, leader_id: lid, members: [] });
        byTeam.get(m.team_id)!.members.push(m);
      }

      const exportRows: ExportRow[] = [];
      const missing: string[] = [];

      for (const { team_name, leader_id, members: tm } of byTeam.values()) {
        if (tm.length === 0) {
          missing.push(team_name);
          exportRows.push({ name: "—", team_name, email: "—", reg_no: "—", role: "No Members" });
          continue;
        }

        const sorted = [...tm].sort((a, b) => {
          if (a.user_id === leader_id) return -1;
          if (b.user_id === leader_id) return 1;
          return 0;
        });
        for (const m of sorted) {
          exportRows.push({ name: m.name, team_name, email: m.email, reg_no: m.reg_no, role: m.user_id === leader_id ? "Leader" : "Member" });
        }
      }

      setTeamsWithoutMembers(missing);
      setRows(exportRows);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? rows.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.team_name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase()) ||
        r.reg_no.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  function exportCSV() {
    const headers = ["Name", "Team Name", "Email", "Reg No", "Role"];
    const lines = [
      headers.join(","),
      ...rows.map(r =>
        [r.name, r.team_name, r.email, r.reg_no, r.role]
          .map(v => `"${(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cloud-flush-participants.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold" style={{ color: T.text }}>All Participants ({rows.length})</p>
        <div className="flex items-center gap-2">
          <input
            type="text" placeholder="Search name / team / email / reg…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm outline-none"
            style={{ ...inputStyle, width: 240 }}
            onFocus={e => (e.target.style.borderColor = T.blue)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white whitespace-nowrap"
            style={{ background: T.green }}>
            <IconDownload /> Export CSV
          </button>
        </div>
      </div>
      <p className="text-xs" style={{ color: T.muted }}>
        Teams sorted by creation order — leader always listed first within each team. Export opens in Excel.
      </p>
      {teamsWithoutMembers.length > 0 && (
        <p className="text-xs" style={{ color: T.yellow }}>
          {teamsWithoutMembers.length} team(s) have no rows in team_members yet: {teamsWithoutMembers.join(", ")}
        </p>
      )}
      {loading ? (
        <p className="text-sm animate-pulse py-8 text-center" style={{ color: T.muted }}>Loading…</p>
      ) : (
        <div className="rounded-lg border overflow-auto" style={{ borderColor: T.border }}>
          <table className="w-full text-sm" style={{ minWidth: 620 }}>
            <thead>
              <tr style={{ background: T.card, borderBottom: `1px solid ${T.border}` }}>
                {["#", "Name", "Team", "Email", "Reg No", "Role"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-widest font-medium" style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}20`, background: i % 2 === 0 ? T.bg : "transparent" }}>
                  <td className="px-3 py-2 text-xs" style={{ color: T.muted }}>{i + 1}</td>
                  <td className="px-3 py-2 font-medium" style={{ color: T.text }}>{r.name}</td>
                  <td className="px-3 py-2 text-sm" style={{ color: T.text }}>{r.team_name}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: T.muted }}>{r.email}</td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: T.text }}>{r.reg_no}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={r.role === "Leader"
                        ? { background: `${T.green}20`, color: T.green, border: `1px solid ${T.green}40` }
                        : { background: `${T.border}30`, color: T.muted }}>
                      {r.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm" style={{ color: T.muted }}>No participants yet.</p>}
        </div>
      )}
    </div>
  );
}

// ── Database / Upload Registrations ──────────────────────────────────────────
function DatabaseSection() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState({ name: "", email: "", reg_no: "" });
  const [addError, setAddError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState({ name: "", email: "", reg_no: "" });
  const [editError, setEditError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRegistrations = useCallback(async () => {
    const { data } = await supabase.from("registrations").select("*").order("name");
    setRegistrations(data ?? []);
  }, []);

  useEffect(() => { loadRegistrations(); }, [loadRegistrations]);

  async function handleAddRow() {
    if (!newRow.name.trim() || !newRow.reg_no.trim()) { setAddError("Name and Reg No are required."); return; }
    setAddError("");
    const { error } = await supabase.from("registrations").insert({
      name: newRow.name.trim(), email: newRow.email.trim(), reg_no: newRow.reg_no.trim(), team_name: "",
    });
    if (error) { setAddError(error.message); return; }
    setNewRow({ name: "", email: "", reg_no: "" }); setAddingRow(false); loadRegistrations();
  }

  function startEdit(r: Registration) {
    setEditId(r.id); setEditRow({ name: r.name, email: r.email, reg_no: r.reg_no }); setEditError("");
  }

  async function handleSaveEdit() {
    if (!editRow.name.trim() || !editRow.reg_no.trim()) { setEditError("Name and Reg No are required."); return; }
    const { error } = await supabase.from("registrations").update({
      name: editRow.name.trim(), email: editRow.email.trim(), reg_no: editRow.reg_no.trim(),
    }).eq("id", editId!);
    if (error) { setEditError(error.message); return; }
    setEditId(null); loadRegistrations();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await supabase.from("registrations").delete().eq("id", id);
    loadRegistrations();
  }

  async function handleClearAll() {
    if (!confirm(`Delete all ${registrations.length} registrations? This cannot be undone.`)) return;
    await supabase.from("registrations").delete().neq("reg_no", "");
    loadRegistrations();
  }

  function exportExcel() {
    const rows = registrations.map((r) => ({
      "Name": r.name,
      "Email ID": r.email ?? "",
      "Reg No": r.reg_no,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, "cloud-flush-registrations.xlsx");
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMsg(null);

    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });

      if (!raw.length) throw new Error("Sheet is empty.");

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const keyMap = new Map<string, string>();
      for (const k of Object.keys(raw[0])) keyMap.set(normalize(k), k);

      const getCol = (candidates: string[]) => {
        for (const c of candidates) {
          const real = keyMap.get(c);
          if (real) return real;
        }
        return null;
      };

      const nameCol = getCol(["name", "fullname", "studentname", "participantname"]);
      const emailCol = getCol(["email", "emailid", "emailaddress", "mail"]);
      const regCol = getCol(["regno", "registrationno", "registrationnumber", "regnumber", "reg"]);

      if (!nameCol || !regCol) {
        throw new Error("Could not find required columns. Required: Name and Reg No. Optional: Email ID.");
      }

      const normReg = (value: string) => value.replace(/\s+/g, "").toUpperCase();
      const prepared = raw.map((r, idx) => ({
        rowNo: idx + 2,
        name: String(r[nameCol] ?? "").trim(),
        email: emailCol ? String(r[emailCol] ?? "").trim() : "",
        reg_no: String(r[regCol] ?? "").trim(),
        team_name: "",
      }));

      let invalid = 0;
      let duplicateInFile = 0;
      const seenInFile = new Set<string>();
      const rows: Array<{ rowNo: number; name: string; email: string; reg_no: string; team_name: string }> = [];

      for (const row of prepared) {
        if (!row.name || !row.reg_no) {
          invalid++;
          continue;
        }

        const regKey = normReg(row.reg_no);
        if (seenInFile.has(regKey)) {
          duplicateInFile++;
          continue;
        }

        seenInFile.add(regKey);
        rows.push(row);
      }

      if (!rows.length) {
        throw new Error("No importable rows found. Check that Name and Reg No are filled and not repeated.");
      }

      const regNos = rows.map((r) => r.reg_no);
      const existingRegs = new Set<string>();
      const chunkSize = 200;

      for (let i = 0; i < regNos.length; i += chunkSize) {
        const chunk = regNos.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("registrations")
          .select("reg_no")
          .in("reg_no", chunk);

        if (error) {
          throw new Error(`Failed to validate existing registrations: ${error.message}`);
        }

        for (const rec of data ?? []) {
          existingRegs.add(normReg(String(rec.reg_no ?? "")));
        }
      }

      let duplicateInDb = 0;
      let inserted = 0;
      let insertErrors = 0;
      const sampleErrors: string[] = [];

      for (const row of rows) {
        if (existingRegs.has(normReg(row.reg_no))) {
          duplicateInDb++;
          continue;
        }

        const { error } = await supabase.from("registrations").insert({
          name: row.name,
          email: row.email,
          reg_no: row.reg_no,
          team_name: row.team_name,
        });

        if (error) {
          insertErrors++;
          if (sampleErrors.length < 3) {
            sampleErrors.push(`Row ${row.rowNo} (${row.reg_no}): ${error.message}`);
          }
          continue;
        }

        inserted++;
      }

      const skipped = invalid + duplicateInFile + duplicateInDb + insertErrors;
      const summary = [
        `Imported ${inserted} row${inserted === 1 ? "" : "s"}`,
        `Skipped ${skipped}`,
        `Invalid ${invalid}`,
        `File duplicates ${duplicateInFile}`,
        `Already in DB ${duplicateInDb}`,
        `Insert errors ${insertErrors}`,
      ].join(" | ");

      const details = sampleErrors.length ? ` First errors: ${sampleErrors.join(" ; ")}` : "";

      setImportMsg({
        type: insertErrors ? "err" : "ok",
        text: `${summary}.${details}`,
      });

      await loadRegistrations();
    } catch (err: unknown) {
      setImportMsg({ type: "err", text: err instanceof Error ? err.message : "Import failed." });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const inCls = "px-2.5 py-1.5 rounded-md text-xs w-full focus:outline-none";
  const inStyle: React.CSSProperties = { background: T.bg, color: T.text, border: `1px solid ${T.border}` };

  return (
    <div className="rounded-lg border" style={{ borderColor: T.border }}>
      <div className="px-4 py-3 flex flex-wrap gap-2 items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div>
          <h2 className="font-semibold text-sm" style={{ color: T.text }}>Registered Students</h2>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>{registrations.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "rgba(88,166,255,0.15)", color: T.blue, border: `1px solid rgba(88,166,255,0.3)` }}
            disabled={importing}
          >
            <IconUpload /> {importing ? "Importing…" : "Import Excel"}
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "rgba(35,134,54,0.15)", color: T.green, border: `1px solid rgba(35,134,54,0.3)` }}
            disabled={!registrations.length}
          >
            <IconDownload /> Export Excel
          </button>
          <button onClick={loadRegistrations} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
            style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>
            <IconRefresh /> Refresh
          </button>
          <button onClick={() => { setAddingRow(true); setNewRow({ name: "", email: "", reg_no: "" }); setAddError(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "rgba(35,134,54,0.15)", color: T.green, border: `1px solid rgba(35,134,54,0.3)` }}>
            <IconPlus /> Add Row
          </button>
          {registrations.length > 0 && (
            <button onClick={handleClearAll} className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "rgba(218,54,51,0.12)", color: "#f85149", border: "1px solid rgba(218,54,51,0.3)" }}>
              Clear All
            </button>
          )}
        </div>
      </div>
      {importMsg && (
        <div className="px-4 py-2 text-xs" style={{ color: importMsg.type === "ok" ? T.green : T.red, borderBottom: `1px solid ${T.border}` }}>
          {importMsg.text}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: "560px" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["S.No", "Name", "Email ID", "Reg No", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {addingRow && (
              <Fragment>
                <tr style={{ background: "rgba(35,134,54,0.05)", borderBottom: `1px solid ${T.border}` }}>
                  <td className="px-4 py-2 text-xs" style={{ color: T.muted }}>—</td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} placeholder="Name *" value={newRow.name} onChange={e => setNewRow(p => ({ ...p, name: e.target.value }))} /></td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} placeholder="Email" value={newRow.email} onChange={e => setNewRow(p => ({ ...p, email: e.target.value }))} /></td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} placeholder="Reg No *" value={newRow.reg_no} onChange={e => setNewRow(p => ({ ...p, reg_no: e.target.value }))} /></td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={handleAddRow} className="px-3 py-1 rounded text-xs font-semibold" style={{ background: T.green, color: "#fff" }}>Save</button>
                      <button onClick={() => { setAddingRow(false); setAddError(""); }} className="px-3 py-1 rounded text-xs" style={{ background: T.card, color: T.muted, border: `1px solid ${T.border}` }}>Cancel</button>
                    </div>
                  </td>
                </tr>
                {addError && (
                  <tr><td colSpan={5} className="px-4 py-1.5 text-xs" style={{ color: "#f85149", background: "rgba(218,54,51,0.05)" }}>{addError}</td></tr>
                )}
              </Fragment>
            )}
            {registrations.map((r, i) => editId === r.id ? (
              <Fragment key={r.id}>
                <tr style={{ background: `rgba(88,166,255,0.05)`, borderBottom: `1px solid ${T.border}` }}>
                  <td className="px-4 py-2 text-xs" style={{ color: T.muted }}>{i + 1}</td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} value={editRow.name} onChange={e => setEditRow(p => ({ ...p, name: e.target.value }))} /></td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} value={editRow.email} onChange={e => setEditRow(p => ({ ...p, email: e.target.value }))} /></td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} value={editRow.reg_no} onChange={e => setEditRow(p => ({ ...p, reg_no: e.target.value }))} /></td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1 rounded text-xs font-semibold" style={{ background: T.green, color: "#fff" }}>Save</button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1 rounded text-xs" style={{ background: T.card, color: T.muted, border: `1px solid ${T.border}` }}>Cancel</button>
                    </div>
                  </td>
                </tr>
                {editError && (
                  <tr><td colSpan={5} className="px-4 py-1.5 text-xs" style={{ color: "#f85149", background: "rgba(218,54,51,0.05)" }}>{editError}</td></tr>
                )}
              </Fragment>
            ) : (
              <tr key={r.id} style={{ borderBottom: i < registrations.length - 1 ? `1px solid ${T.border}30` : "none" }}>
                <td className="px-4 py-2.5 text-xs" style={{ color: T.muted }}>{i + 1}</td>
                <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>{r.name}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: T.muted }}>{r.email || "—"}</td>
                <td className="px-4 py-2.5 font-mono text-xs" style={{ color: T.blue }}>{r.reg_no}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(r)} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                      style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}><IconEdit /> Edit</button>
                    <button onClick={() => handleDelete(r.id, r.name)} className="p-1.5 rounded"
                      style={{ background: "rgba(218,54,51,0.1)", color: "#f85149" }}><IconTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && !addingRow && (
          <div className="py-12 text-center text-sm" style={{ color: T.muted }}>No registrations yet. Click "Add Row" to add manually.</div>
        )}
      </div>
    </div>
  );
}

// ── Problem Statements ───────────────────────────────────────────────────────
function ProblemStatementsSection() {
  const [items, setItems] = useState<ProblemStatement[]>([]);
  const [domain, setDomain] = useState("");
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [filterDomain, setFilterDomain] = useState("all");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from("problem_statements")
      .select("id, domain, title, statement, created_at")
      .order("created_at", { ascending: true });
    setItems((data ?? []) as ProblemStatement[]);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const cleanDomain = domain.trim();
    const cleanTitle = title.trim();
    const cleanStatement = statement.trim();
    if (!cleanDomain || !cleanTitle || !cleanStatement) {
      setMsg({ type: "err", text: "Domain, title and statement are required." });
      return;
    }

    setSaving(true);
    setMsg(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("problem_statements").insert({
      domain: cleanDomain,
      title: cleanTitle,
      statement: cleanStatement,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);

    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }

    setDomain("");
    setTitle("");
    setStatement("");
    setMsg({ type: "ok", text: "Problem statement added." });
    await loadItems();
  }

  async function handleDelete(id: string, itemTitle: string) {
    if (!confirm(`Delete problem statement \"${itemTitle}\"?`)) return;
    const { error } = await supabase.from("problem_statements").delete().eq("id", id);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Problem statement deleted." });
    await loadItems();
  }

  const domainOptions = Array.from(new Set(items.map((it) => it.domain))).sort((a, b) => a.localeCompare(b));
  const visibleItems = filterDomain === "all" ? items : items.filter((it) => it.domain === filterDomain);

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Add Problem Statement</p>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Domain</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. Cloud Architecture"
              onFocus={e => (e.target.style.borderColor = T.blue)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Round / Problem title"
              onFocus={e => (e.target.style.borderColor = T.blue)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Statement</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={6}
              className={`${inputCls} resize-y`}
              style={inputStyle}
              placeholder="Paste full problem statement..."
              onFocus={e => (e.target.style.borderColor = T.blue)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
          </div>
          {msg && <p className="text-xs" style={{ color: msg.type === "ok" ? T.green : T.red }}>{msg.text}</p>}
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: T.green }}
          >
            {saving ? "Saving…" : "Add Statement"}
          </button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: T.text }}>Available Problem Statements</p>
          <div className="flex items-center gap-2">
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="px-2.5 py-1.5 rounded-md text-xs outline-none"
              style={{ ...inputStyle, width: 180 }}
            >
              <option value="all">All domains</option>
              {domainOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button onClick={loadItems} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>
              <IconRefresh /> Refresh
            </button>
          </div>
        </div>
        {visibleItems.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>No problem statements yet.</p>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((it, idx) => (
              <div key={it.id} className="rounded-md border p-3" style={{ borderColor: T.border, background: T.bg }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs" style={{ color: T.muted }}>Problem {idx + 1}</p>
                    <p className="text-sm font-semibold" style={{ color: T.text }}>{it.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: T.blue }}>Domain: {it.domain}</p>
                  </div>
                  <button onClick={() => handleDelete(it.id, it.title)} className="p-1.5 rounded" style={{ background: "rgba(218,54,51,0.1)", color: T.red }}>
                    <IconTrash />
                  </button>
                </div>
                <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: T.muted }}>{it.statement}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ConstraintsSection() {
  const [items, setItems] = useState<DomainConstraint[]>([]);
  const [roundSettings, setRoundSettings] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false, 5: false });
  const [domain, setDomain] = useState("");
  const [roundNo, setRoundNo] = useState(1);
  const [title, setTitle] = useState("");
  const [constraintText, setConstraintText] = useState("");
  const [filterDomain, setFilterDomain] = useState("all");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from("domain_constraints")
      .select("id, domain, round_no, title, constraint_text, created_at")
      .order("round_no", { ascending: true })
      .order("created_at", { ascending: true });
    setItems((data ?? []) as DomainConstraint[]);
  }, []);

  const loadRoundSettings = useCallback(async () => {
    const { data } = await supabase
      .from("constraint_round_settings")
      .select("round_no, is_enabled")
      .order("round_no", { ascending: true });

    const next: Record<number, boolean> = { 1: false, 2: false, 3: false, 4: false, 5: false };
    for (const row of ((data ?? []) as ConstraintRoundSetting[])) {
      next[row.round_no] = row.is_enabled;
    }
    setRoundSettings(next);
  }, []);

  useEffect(() => {
    loadItems();
    loadRoundSettings();
  }, [loadItems, loadRoundSettings]);

  async function handleToggleRound(round: number) {
    const next = !roundSettings[round];
    setRoundSettings((prev) => ({ ...prev, [round]: next }));
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("constraint_round_settings").upsert({
      round_no: round,
      is_enabled: next,
      updated_by: u.user?.id ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      setRoundSettings((prev) => ({ ...prev, [round]: !next }));
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: `Round ${round} ${next ? "enabled" : "disabled"}.` });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const cleanDomain = domain.trim();
    const cleanTitle = title.trim();
    const cleanConstraint = constraintText.trim();

    if (!cleanDomain || !cleanTitle || !cleanConstraint) {
      setMsg({ type: "err", text: "Domain, title and constraint are required." });
      return;
    }

    setSaving(true);
    setMsg(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("domain_constraints").insert({
      domain: cleanDomain,
      round_no: roundNo,
      title: cleanTitle,
      constraint_text: cleanConstraint,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);

    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }

    setDomain("");
    setRoundNo(1);
    setTitle("");
    setConstraintText("");
    setMsg({ type: "ok", text: "Constraint added." });
    await loadItems();
  }

  async function handleDelete(id: string, itemTitle: string) {
    if (!confirm(`Delete constraint \"${itemTitle}\"?`)) return;
    const { error } = await supabase.from("domain_constraints").delete().eq("id", id);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Constraint deleted." });
    await loadItems();
  }

  const domainOptions = Array.from(new Set(items.map((it) => it.domain))).sort((a, b) => a.localeCompare(b));
  const visibleItems = filterDomain === "all" ? items : items.filter((it) => it.domain === filterDomain);

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Enable Rounds For Constraint Visibility</p>
        <p className="text-xs mb-3" style={{ color: T.muted }}>Only enabled rounds will be shown in leader/member overview.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((round) => {
            const enabled = Boolean(roundSettings[round]);
            return (
              <button
                key={round}
                onClick={() => handleToggleRound(round)}
                className="rounded-md border px-3 py-2 text-left transition-colors"
                style={enabled
                  ? { borderColor: `${T.green}88`, background: `${T.green}18`, color: T.text }
                  : { borderColor: `${T.border}`, background: T.bg, color: T.muted }}
              >
                <p className="text-[10px] uppercase tracking-widest">Round {round}</p>
                <p className="text-lg font-bold" style={{ color: T.yellow }}>x{ROUND_WEIGHTAGE[round]}</p>
                <p className="text-[10px] mt-1">{enabled ? "Enabled" : "Disabled"}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Add Constraint</p>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Domain</label>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} className={inputCls} style={inputStyle}
              placeholder="e.g. Cloud Architecture" onFocus={e => (e.target.style.borderColor = T.blue)} onBlur={e => (e.target.style.borderColor = T.border)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Round</label>
            <select
              value={roundNo}
              onChange={(e) => setRoundNo(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-md text-sm outline-none"
              style={inputStyle}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>Round {n} (x{ROUND_WEIGHTAGE[n]})</option>
              ))}
            </select>
            <p className="text-[10px] mt-1" style={{ color: T.muted }}>Weightage for selected round: x{ROUND_WEIGHTAGE[roundNo]}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} style={inputStyle}
              placeholder="Constraint title" onFocus={e => (e.target.style.borderColor = T.blue)} onBlur={e => (e.target.style.borderColor = T.border)} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Constraint</label>
            <textarea value={constraintText} onChange={(e) => setConstraintText(e.target.value)} rows={6}
              className={`${inputCls} resize-y`} style={inputStyle}
              placeholder="Add domain-specific constraints..." onFocus={e => (e.target.style.borderColor = T.blue)} onBlur={e => (e.target.style.borderColor = T.border)} />
          </div>
          {msg && <p className="text-xs" style={{ color: msg.type === "ok" ? T.green : T.red }}>{msg.text}</p>}
          <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-md text-xs font-semibold text-white disabled:opacity-60" style={{ background: T.green }}>
            {saving ? "Saving…" : "Add Constraint"}
          </button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: T.text }}>Domain Constraints</p>
          <div className="flex items-center gap-2">
            <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)} className="px-2.5 py-1.5 rounded-md text-xs outline-none" style={{ ...inputStyle, width: 180 }}>
              <option value="all">All domains</option>
              {domainOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button onClick={loadItems} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>
              <IconRefresh /> Refresh
            </button>
          </div>
        </div>
        {visibleItems.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>No constraints found for this domain.</p>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((it) => (
              <div key={it.id} className="rounded-md border p-3" style={{ borderColor: T.border, background: T.bg }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: T.text }}>{it.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: T.blue }}>Domain: {it.domain}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: T.yellow }}>Round {it.round_no} (x{ROUND_WEIGHTAGE[it.round_no] ?? 1})</p>
                  </div>
                  <button onClick={() => handleDelete(it.id, it.title)} className="p-1.5 rounded" style={{ background: "rgba(218,54,51,0.1)", color: T.red }}>
                    <IconTrash />
                  </button>
                </div>
                <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: T.muted }}>{it.constraint_text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function UpdatesSection() {
  const [items, setItems] = useState<DashboardUpdate[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("dashboard_updates")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setItems((data ?? []) as DashboardUpdate[]);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) {
      setMsg({ type: "err", text: "Title and text are required." });
      return;
    }

    setSaving(true);
    setMsg(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("dashboard_updates").insert({
      title: cleanTitle,
      body: cleanBody,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);

    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }

    setTitle("");
    setBody("");
    setMsg({ type: "ok", text: "Update published." });
    await loadItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this update?")) return;
    const { error } = await supabase.from("dashboard_updates").delete().eq("id", id);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Update deleted." });
    await loadItems();
  }

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Publish Update</p>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Update title"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Text</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`${inputCls} min-h-28 resize-y`}
              style={inputStyle}
              placeholder="Write update details"
            />
          </div>
          <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-md text-xs font-semibold text-white disabled:opacity-60" style={{ background: T.blue }}>
            {saving ? "Publishing..." : "Publish"}
          </button>
        </form>
        {msg && <p className="text-xs mt-3" style={{ color: msg.type === "ok" ? T.green : T.red }}>{msg.text}</p>}
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Published Updates</p>
        {items.length === 0 ? (
          <p className="text-sm" style={{ color: T.muted }}>No updates published yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-md border p-3" style={{ borderColor: T.border, background: T.bg }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{item.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded" style={{ background: "rgba(218,54,51,0.1)", color: T.red }}>
                    <IconTrash />
                  </button>
                </div>
                <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: T.muted }}>{item.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsSection({ user }: { user: User }) {
  const [pw, setPw] = useState(""); const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handlePw(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (pw !== confirm) { setMsg({ type: "err", text: "Passwords don't match." }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) { setMsg({ type: "err", text: error.message }); return; }
    setMsg({ type: "ok", text: "Password updated!" }); setPw(""); setConfirm("");
  }

  return (
    <div className="space-y-4 max-w-sm">
      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Change Password</p>
        <form onSubmit={handlePw} className="space-y-3">
          {[["New Password", pw, setPw], ["Confirm Password", confirm, setConfirm]].map(([label, val, setter]) => (
            <div key={label as string} className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>{label as string}</label>
              <input required type="password" value={val as string} minLength={6}
                onChange={e => (setter as (v: string) => void)(e.target.value)}
                className={inputCls} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = T.blue)}
                onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
          ))}
          {msg && <p className="text-xs" style={{ color: msg.type === "ok" ? T.green : T.red }}>{msg.text}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60" style={{ background: T.blue }}>
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Card>
      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Account Info</p>
        {[["Email", user.email ?? "—"], ["User ID", user.id]].map(([l, v]) => (
          <div key={l} className="flex justify-between py-1.5 border-b text-xs" style={{ borderColor: T.border + "40" }}>
            <span style={{ color: T.muted }}>{l}</span>
            <span className="font-mono" style={{ color: T.text }}>{v}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [nav, setNav] = useState<AdminNav>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [stats, setStats] = useState<Stats>({ teams: 0, members: 0, attendance: 0, registrations: 0 });
  const [hackathon, setHackathon] = useState<HackathonConfig>({ id: 1, starts_at: new Date().toISOString(), duration_minutes: 24 * 60, is_running: false });

  const loadData = useCallback(async () => {
    const [teamsRes, membersRes, attendanceRes, regRes] = await Promise.all([
      supabase.from("teams").select("id, team_name, leader_id, points, is_vit_chennai, created_at"),
      supabase.from("team_members").select("id", { count: "exact", head: true }),
      supabase.from("attendance").select("id", { count: "exact", head: true }),
      supabase.from("registrations").select("id", { count: "exact", head: true }),
    ]);
    setTeams((teamsRes.data ?? []) as TeamRow[]);
    setStats({
      teams: teamsRes.data?.length ?? 0,
      members: membersRes.count ?? 0,
      attendance: attendanceRes.count ?? 0,
      registrations: regRes.count ?? 0,
    });
  }, []);

  const loadHackathon = useCallback(async () => {
    const { data } = await supabase
      .from("hackathon_config")
      .select("id, starts_at, duration_minutes, is_running")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      setHackathon(data as HackathonConfig);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/admin"); return; }
      const { data: check } = await supabase.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();
      if (!check) { await supabase.auth.signOut(); router.replace("/admin"); return; }
      setUser(user);
      loadData();
      loadHackathon();
    });
  }, [router, loadData, loadHackathon]);

  async function handleLogout() { await supabase.auth.signOut(); router.replace("/admin"); }
  function handleTopRefresh() { window.location.reload(); }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
      <p className="text-sm animate-pulse" style={{ color: T.muted }}>Loading…</p>
    </div>
  );

  const navItems = [
    { id: "overview" as AdminNav, label: "Overview", icon: <IconGrid /> },
    { id: "teams" as AdminNav, label: "Teams", icon: <IconUsers /> },
    { id: "users" as AdminNav, label: "Users", icon: <IconTable /> },
    { id: "access" as AdminNav, label: "Access", icon: <IconShield /> },
    { id: "database" as AdminNav, label: "Database", icon: <IconDatabase /> },
    { id: "problems" as AdminNav, label: "Problem Statements", icon: <IconDoc /> },
    { id: "constraints" as AdminNav, label: "Constraints", icon: <IconLock /> },
    { id: "betting" as AdminNav, label: "Betting", icon: <IconPlay /> },
    { id: "updates" as AdminNav, label: "Updates", icon: <IconBell /> },
    { id: "settings" as AdminNav, label: "Settings", icon: <IconSettings /> },
  ];

  const subtitles: Record<AdminNav, string> = {
    overview: "Stats & top teams",
    teams: "View and edit all teams",
    users: "All participants — export to CSV / Excel",
    access: "Manage coordinator / admin / judge users",
    database: "Upload and manage participant registrations",
    problems: "Create and manage selectable problem statements",
    constraints: "Create and manage domain-specific constraints",
    betting: "Run round phases, scores and weighted settlement",
    updates: "Publish updates for leader and member dashboards",
    settings: "Account & password",
  };

  return (
    <div className="min-h-screen flex" style={{ background: T.bg, color: T.text }}>
      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ width: 220, background: T.card, borderColor: T.border }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: T.border }}>
          <p className="font-bold text-sm tracking-widest" style={{ fontFamily: "monospace" }}>CLOUD-FLUSH</p>
          <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Admin Portal</p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setNav(item.id); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all text-left"
              style={nav === item.id ? { background: "#1f6feb20", color: T.blue } : { color: T.muted }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="px-2 pb-4 border-t pt-3" style={{ borderColor: T.border }}>
          <div className="px-3 py-2 rounded-md mb-2" style={{ background: T.bg }}>
            <p className="text-xs font-medium truncate" style={{ color: T.text }}>{user.email}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: "#1f6feb20", color: T.blue, border: `1px solid ${T.blue}30` }}>ADMIN</span>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left"
            style={{ color: T.muted }} onMouseEnter={e => (e.currentTarget.style.color = T.red)} onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
            <IconLogout /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: 0 }}>
        <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b"
          style={{ background: T.card + "ee", borderColor: T.border, backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1 rounded" style={{ color: T.muted }} onClick={() => setSidebarOpen(true)}><IconMenu /></button>
            <div>
              <p className="text-sm font-semibold capitalize" style={{ color: T.text }}>{nav}</p>
              <p className="text-[10px]" style={{ color: T.muted }}>{subtitles[nav]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTopRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}
            >
              <IconRefresh /> Refresh
            </button>
            <span className="text-[10px] font-mono hidden sm:block" style={{ color: T.muted }}>Cloud-Flush Admin</span>
          </div>
        </header>

        <div className="flex-1 p-5 sm:p-7 max-w-5xl w-full">
          {nav === "overview" && (
            <div className="space-y-5">
              <HackathonControlCard config={hackathon} user={user} onUpdated={loadHackathon} />
              <Overview stats={stats} teams={teams} />
            </div>
          )}
          {nav === "teams" && <TeamsSection teams={teams} onRefresh={loadData} />}
          {nav === "users" && <UsersSection />}
          {nav === "access" && <AccessSection />}
          {nav === "database" && <DatabaseSection />}
          {nav === "problems" && <ProblemStatementsSection />}
          {nav === "constraints" && <ConstraintsSection />}
          {nav === "betting" && <BettingSection />}
          {nav === "updates" && <UpdatesSection />}
          {nav === "settings" && <SettingsSection user={user} />}
        </div>
      </main>

      <style>{`@media (min-width: 1024px) { main { margin-left: 220px !important; } }`}</style>
    </div>
  );
}
