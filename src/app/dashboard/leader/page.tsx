"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, createEphemeralClient, type Team, type TeamMember } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import QRCode from "react-qr-code";

type NavSection = "overview" | "leaderboard" | "problems" | "play" | "updates" | "team" | "attendance" | "settings";
type HackathonConfig = { starts_at: string; duration_minutes: number; is_running: boolean };
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
type RoundBet = {
  id: string;
  round_no: number;
  team_id: string;
  initial_bet: number;
  second_decision: "hold" | "match" | "double" | "withdraw" | null;
  final_bet: number | null;
  decision_locked: boolean;
};
type RoundBetLeaderboardRow = {
  id: string;
  round_no: number;
  team_id: string;
  initial_bet: number;
  second_decision: "hold" | "match" | "double" | "withdraw" | null;
  final_bet: number | null;
  decision_locked: boolean;
  teams: { team_name: string } | null;
};
type RoundResult = {
  round_no: number;
  team_id: string;
  rank_no: number;
  score: number;
  final_bet: number;
  is_winner: boolean;
  payout: number;
};
type LeaderDashboardUpdate = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

const ROUND_WEIGHTAGE: Record<number, number> = {
  1: 1,
  2: 1.5,
  3: 2,
  4: 2.5,
  5: 3,
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconGrid() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>; }
function IconTrophy() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v3a5 5 0 0 1-10 0V4z"/><path d="M17 5h2a2 2 0 0 1 0 4h-2"/><path d="M7 5H5a2 2 0 0 0 0 4h2"/></svg>; }
function IconUsers() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconScan() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" /><rect x="8" y="8" width="8" height="8" rx="1" /></svg>; }
function IconPlay() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="5 3 19 12 5 21 5 3" /></svg>; }
function IconDoc() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>; }
function IconSettings() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function IconLogout() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }
function IconPlus() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function IconCoins() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 11v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5"/></svg>; }
function IconBell() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"/><path d="M10 17a2 2 0 0 0 4 0"/></svg>; }
function IconRefresh() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>; }

function UpdatesSection({ updates }: { updates: LeaderDashboardUpdate[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)" }}>
        <p className="text-[10px] uppercase tracking-widest text-yellow-400/70 mb-1">Announcements</p>
        <p className="text-2xl font-black text-white">Updates</p>
        <p className="text-xs text-white/45 mt-1">Latest messages from admins.</p>
      </div>

      {updates.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center text-white/40">No updates yet.</div>
      ) : (
        <div className="space-y-3">
          {updates.map((item) => (
            <div key={item.id} className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-[10px] text-white/45 mt-1">{new Date(item.created_at).toLocaleString()}</p>
              <p className="text-sm text-white/70 mt-3 whitespace-pre-wrap">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({ id: i, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, size: Math.random() * 1.5 + 0.5, delay: `${Math.random() * 4}s`, duration: `${2 + Math.random() * 3}s` }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {stars.map((s) => <div key={s.id} className="absolute rounded-full bg-white" style={{ top: s.top, left: s.left, width: s.size, height: s.size, opacity: 0.4, animation: `twinkle ${s.duration} ${s.delay} ease-in-out infinite` }} />)}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_HACKATHON_CONFIG: HackathonConfig = {
  starts_at: "2026-03-23T09:00:00+05:30",
  duration_minutes: 24 * 60,
  is_running: false,
};
const TEAM_POINTS = 1000;

function getHackathonSnapshot(config: HackathonConfig, now: number) {
  const end = new Date(config.starts_at).getTime() + config.duration_minutes * 60 * 1000;
  if (!config.is_running) {
    const ms = config.duration_minutes * 60 * 1000;
    return { mode: "paused" as const, ms };
  }
  if (now >= end) {
    return { mode: "ended" as const, ms: 0 };
  }
  return { mode: "live" as const, ms: end - now };
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function TimeUnit({ label, value, accent }: { label: string; value: number; accent: boolean }) {
  return (
    <div className="rounded-xl p-3 text-center border" style={{ background: accent ? "rgba(5,150,105,0.1)" : "rgba(212,160,23,0.06)", borderColor: accent ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.1)" }}>
      <div className="text-xl font-bold font-mono" style={{ color: accent ? "#34d399" : "#facc15" }}>{String(value).padStart(2, "0")}</div>
      <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}
function LeaderboardRow({ rank, teamName, points, isOwn }: { rank: number; teamName: string; points: number; isOwn: boolean }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <div className="flex items-center gap-3 px-5 py-3" style={isOwn ? { background: "rgba(212,160,23,0.08)" } : {}}>
      <div className="w-7 text-sm font-bold shrink-0">{medal ?? <span className="text-white/30 text-xs">#{rank}</span>}</div>
      <div className="flex-1 text-sm font-medium text-white min-w-0 truncate">{teamName}{isOwn && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full text-black font-bold" style={{ background: "#D4A017" }}>YOU</span>}</div>
      <div className="text-sm font-bold text-yellow-400 shrink-0">{points.toLocaleString()}</div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({
  team,
  members,
  selectedProblem,
  constraints,
  enabledRounds,
  onOpenProblems,
}: {
  team: Team | null;
  members: TeamMember[];
  selectedProblem: ProblemStatement | null;
  constraints: DomainConstraint[];
  enabledRounds: number[];
  onOpenProblems: () => void;
}) {
  const [openRound, setOpenRound] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-4">
          <button onClick={onOpenProblems} className="w-full text-left rounded-2xl p-5 border group transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]" style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(120,80,0,0.1) 60%, rgba(8,8,8,0.5) 100%)", borderColor: "rgba(212,160,23,0.35)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#D4A017" }}>Problem Statement</p>
              <span className="text-[10px] text-white/35 group-hover:text-yellow-300/80 transition-colors">Open list →</span>
            </div>
            {selectedProblem ? (
              <>
                <p className="text-xl font-black text-white leading-tight">{selectedProblem.title}</p>
                <p className="text-sm text-white/60 mt-2 line-clamp-4 whitespace-pre-wrap">{selectedProblem.statement}</p>
                <div className="mt-3 inline-flex text-[10px] px-2.5 py-1 rounded-full font-semibold text-black" style={{ background: "#D4A017" }}>
                  Locked for your team
                </div>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-white leading-tight">No problem selected yet</p>
                <p className="text-sm text-white/60 mt-2">Open this page and choose one problem statement. After selection, it cannot be changed.</p>
              </>
            )}
          </button>

          <div className="rounded-2xl p-5 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>Constraints</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(52,211,153,0.18)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" }}>
                Visible
              </span>
            </div>
            {selectedProblem ? (
              <>
                <p className="text-xs text-white/50">Domain: <span className="text-yellow-400">{selectedProblem.domain}</span></p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((roundNo) => {
                    const isEnabled = enabledRounds.includes(roundNo);
                    const cardStyle = isEnabled
                      ? { background: "rgba(255,255,255,0.03)", borderColor: "rgba(52,211,153,0.35)" }
                      : { background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.08)" };

                    return (
                      <button
                        key={roundNo}
                        onClick={() => isEnabled && setOpenRound(roundNo)}
                        disabled={!isEnabled}
                        className="rounded-lg px-3 py-3 border text-left disabled:cursor-not-allowed"
                        style={cardStyle}
                      >
                        <p className="text-[10px] uppercase tracking-widest text-white/45">Round {roundNo}</p>
                        <p className="text-xl font-black text-yellow-400 mt-1">x{ROUND_WEIGHTAGE[roundNo]}</p>
                        <span className="mt-2 inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={isEnabled
                            ? { background: "rgba(52,211,153,0.2)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" }
                            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}>
                          {isEnabled ? "Active" : "🔒 Locked"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-white/60">Choose a problem statement first to see domain constraints.</p>
            )}
          </div>

          {openRound !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && setOpenRound(null)}>
              <div className="w-full max-w-xl rounded-2xl border overflow-hidden" style={{ background: "#0d0d0d", borderColor: "rgba(212,160,23,0.35)" }}>
                <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <p className="text-[10px] uppercase tracking-widest text-yellow-400">Constraint Details</p>
                  <p className="text-xl font-black text-white mt-1">Round {openRound} · x{ROUND_WEIGHTAGE[openRound]}</p>
                  <p className="text-xs text-white/45 mt-1">Domain: {selectedProblem?.domain ?? "—"}</p>
                </div>
                <div className="p-5 space-y-3 max-h-[60vh] overflow-auto">
                  {constraints.filter((c) => c.round_no === openRound).length === 0 ? (
                    <p className="text-sm text-white/60">No constraint assigned for this round yet.</p>
                  ) : (
                    constraints.filter((c) => c.round_no === openRound).map((c) => (
                      <div key={c.id} className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <p className="text-sm font-semibold text-white">{c.title}</p>
                        <p className="text-xs text-white/60 mt-1 whitespace-pre-wrap">{c.constraint_text}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <button onClick={() => setOpenRound(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: "#D4A017" }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-white/45 uppercase tracking-widest mb-0.5">Team Details</p>
              <p className="text-lg font-bold text-white">{team?.team_name ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mb-0.5">Points</p>
              <p className="text-2xl font-black text-yellow-400">{(team?.points ?? TEAM_POINTS).toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-2">
            {members.length > 0 ? members.map(m => (
              <div key={m.id} className="rounded-xl px-3 py-2.5" style={{ background: m.user_id === team?.leader_id ? "rgba(212,160,23,0.08)" : "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                    <p className="text-xs text-white/40 truncate">{m.reg_no} · {m.email}</p>
                  </div>
                  {m.user_id === team?.leader_id ? <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-black" style={{ background: "#D4A017" }}>Leader</span> : <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">Member</span>}
                </div>
              </div>
            )) : <p className="text-xs text-white/35">No teammates added yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardSection({ team, hackathon, now }: { team: Team | null; hackathon: HackathonConfig; now: number }) {
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; team_name: string; points: number }>>([]);

  const loadLeaderboard = useCallback(async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("id, team_name, points")
      .order("points", { ascending: false });

    if (!error && data) {
      setLeaderboard(
        (data as Array<{ id: string; team_name: string; points?: number | null }>).map((t) => ({
          id: t.id,
          team_name: t.team_name,
          points: t.points ?? TEAM_POINTS,
        }))
      );
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    const id = setInterval(loadLeaderboard, 5000);
    return () => clearInterval(id);
  }, [loadLeaderboard]);

  const boardData = leaderboard.length > 0
    ? leaderboard
    : [{ id: team?.id ?? "own", team_name: team?.team_name ?? "Your Team", points: team?.points ?? TEAM_POINTS }];
  const snapshot = getHackathonSnapshot(hackathon, now);
  const totalSecs = Math.floor(snapshot.ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const timerMode = snapshot.mode;
  const timerLabel = timerMode === "live" ? "Time Left" : timerMode === "paused" ? "Configured Duration" : "Hackathon Ended";
  const timerText = timerMode === "ended"
    ? "00:00:00"
    : timerMode === "live"
      ? `${Math.floor(totalSecs / 3600).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${Math.floor(totalSecs / 3600).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 flex flex-col overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="px-5 py-4 border-b border-white/8" style={{ background: "linear-gradient(90deg, rgba(212,160,23,0.08) 0%, transparent 100%)" }}>
          <p className="text-sm font-bold text-white">🏆 Leaderboard</p>
          <p className="text-[10px] text-white/30 mt-0.5">Teams ranked by points</p>
        </div>
        <div className="divide-y divide-white/5">
          {boardData.map((entry, idx) => <LeaderboardRow key={entry.id} rank={idx + 1} teamName={entry.team_name} points={entry.points} isOwn={leaderboard.length > 0 ? team?.id === entry.id : idx === 0} />)}
        </div>
      </div>
    </div>
  );
}

// ── Team section (leader — full control) ─────────────────────────────────────
function MemberField({ label, type, placeholder, value, onChange, minLength, required = true }: { label: string; type: string; placeholder: string; value: string; onChange: (v: string) => void; minLength?: number; required?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-white/50 uppercase tracking-widest">{label}</label>
      <input required={required} type={type} placeholder={placeholder} value={value} minLength={minLength} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/25 bg-white/5 border border-white/10 outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all" />
    </div>
  );
}

function TeamSection({ team, members, onMemberAdded }: { team: Team | null; members: TeamMember[]; onMemberAdded: () => void }) {
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;
    setError(""); setLoading(true);
    const { data: leaderSessionData } = await supabase.auth.getSession();
    const leaderSession = leaderSessionData.session;
    try {
      const cleanName = name.trim();
      const cleanRegNo = regNo.trim();
      const cleanEmail = email.trim().toLowerCase();

      const { data: existingInTeam } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", team.id)
        .or(`email.eq.${cleanEmail},reg_no.eq.${cleanRegNo}`)
        .maybeSingle();

      if (existingInTeam) {
        throw new Error("This member already exists in your team.");
      }

      let memberUserId: string | null = null;

      const { data: existingUserId } = await supabase.rpc("get_user_id_by_email", { p_email: cleanEmail });
      if (existingUserId) {
        memberUserId = existingUserId;
      } else {
        if (password.trim().length < 6) {
          throw new Error("Password must be at least 6 characters for new users.");
        }

        const tempClient = createEphemeralClient();
        const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({ email: cleanEmail, password: password.trim() });

        if (signUpError) {
          if (/already registered/i.test(signUpError.message)) {
            const { data: retryUserId } = await supabase.rpc("get_user_id_by_email", { p_email: cleanEmail });
            memberUserId = retryUserId ?? null;
          } else {
            throw signUpError;
          }
        } else {
          memberUserId = signUpData.user?.id ?? null;
        }
      }

      const { error: insertError } = await supabase.from("team_members").insert({
        team_id: team.id,
        name: cleanName,
        reg_no: cleanRegNo,
        email: cleanEmail,
        user_id: memberUserId,
      });
      if (insertError) throw insertError;

      setName(""); setRegNo(""); setEmail(""); setPassword("");
      setAdding(false); onMemberAdded();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add member.";
      if (/already registered/i.test(message)) {
        setError("Email exists in Auth. Try again, or use a different email if this user belongs to another account.");
      } else {
        setError(message);
      }
    }
    finally {
      // Defensive restore in case temporary auth flow changed the active browser session.
      if (leaderSession?.access_token && leaderSession?.refresh_token) {
        await supabase.auth.setSession({
          access_token: leaderSession.access_token,
          refresh_token: leaderSession.refresh_token,
        });
      }
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Team details card */}
      <div className="rounded-2xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Team Details</p>
        <p className="text-2xl font-black text-white">{team?.team_name ?? "—"}</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Members</p>
            <p className="text-sm font-semibold text-white">{members.length}</p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Leader Email</p>
            <p className="text-sm font-semibold text-white truncate">{members.find((m) => m.user_id === team?.leader_id)?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Team Members <span className="text-white/30 font-normal text-sm">({members.length})</span></h3>
        {!adding && (
          <button onClick={() => { setAdding(true); setError(""); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black" style={{ background: "#D4A017" }}>
            <IconPlus /> Add Member
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAddMember} className="rounded-2xl p-5 border border-yellow-500/20 space-y-3" style={{ background: "rgba(212,160,23,0.06)" }}>
          <p className="text-sm font-semibold text-yellow-400">New Team Member</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MemberField label="Full Name" type="text" placeholder="Member name" value={name} onChange={setName} />
            <MemberField label="Reg. Number" type="text" placeholder="e.g. 23BCE5678" value={regNo} onChange={setRegNo} />
            <MemberField label="Email" type="email" placeholder="member@example.com" value={email} onChange={setEmail} />
            <MemberField label="Password (for new user only)" type="password" placeholder="Min 6 characters if email is new" value={password} onChange={setPassword} minLength={password ? 6 : undefined} required={false} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50" style={{ background: "#D4A017" }}>{loading ? "Adding…" : "Add"}</button>
            <button type="button" onClick={() => { setAdding(false); setError(""); }} className="px-5 py-2 rounded-lg text-sm text-white/60 border border-white/10 hover:text-white transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No team members yet. Add your teammates above.</div>
      ) : (
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-xl px-4 py-3 border" style={{ background: m.user_id === team?.leader_id ? "rgba(212,160,23,0.06)" : "rgba(255,255,255,0.03)", borderColor: m.user_id === team?.leader_id ? "rgba(212,160,23,0.2)" : "rgba(255,255,255,0.1)" }}>
              <div><p className="text-sm font-semibold text-white">{m.name}</p><p className="text-xs text-white/40">{m.reg_no} · {m.email}</p></div>
              {m.user_id === team?.leader_id ? <span className="text-xs px-2 py-0.5 rounded-full font-bold text-black" style={{ background: "#D4A017" }}>Leader</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">Member</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Attendance ────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between py-2 border-b border-white/5"><span className="text-[10px] text-white/40 uppercase tracking-widest">{label}</span><span className="text-sm text-white font-medium">{value}</span></div>;
}
function AttendanceSection({ user, team }: { user: User; team: Team | null }) {
  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const qrData = JSON.stringify({ name: meta.full_name ?? "", reg_no: meta.reg_no ?? "", email: user.email ?? "", team_name: team?.team_name ?? "" });
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 p-8" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="p-4 rounded-2xl" style={{ background: "#ffffff" }}><QRCode value={qrData} size={220} bgColor="#ffffff" fgColor="#080808" /></div>
      <div className="w-full max-w-sm"><InfoRow label="Name" value={meta.full_name ?? "—"} /><InfoRow label="Reg No" value={meta.reg_no ?? "—"} /><InfoRow label="Email" value={user.email ?? "—"} /><InfoRow label="Team" value={team?.team_name ?? "—"} /></div>
      <p className="text-xs text-white/20 text-center">Show this QR to a coordinator to mark your attendance.</p>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsSection({ user }: { user: User }) {
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault(); setMessage(null);
    if (newPassword !== confirmPassword) { setMessage({ type: "error", text: "New passwords do not match." }); return; }
    if (newPassword.length < 6) { setMessage({ type: "error", text: "Password must be at least 6 characters." }); return; }
    setLoading(true);
    try {
      const { error: reAuthError } = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPassword });
      if (reAuthError) throw new Error("Current password is incorrect.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) { setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update password." }); }
    finally { setLoading(false); }
  }
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
        <h3 className="text-base font-bold text-white mb-1">Change Password</h3>
        <p className="text-xs text-white/40 mb-5">Update your account password below.</p>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          {[["Current Password", "password", "Your current password", currentPassword, setCurrentPassword, undefined], ["New Password", "password", "Min 6 characters", newPassword, setNewPassword, 6], ["Confirm New Password", "password", "Repeat new password", confirmPassword, setConfirmPassword, undefined]].map(([label, type, placeholder, val, setter, min]) => (
            <div key={label as string} className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-widest">{label as string}</label>
              <input required type={type as string} placeholder={placeholder as string} value={val as string} minLength={min as number | undefined} onChange={(e) => (setter as (v: string) => void)(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/25 bg-white/5 border border-white/10 outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all" />
            </div>
          ))}
          {message && <p className={`text-xs ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>{message.text}</p>}
          <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50" style={{ background: "#D4A017" }}>{loading ? "Updating…" : "Update Password"}</button>
        </form>
      </div>
      <div className="rounded-2xl p-6 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
        <h3 className="text-base font-bold text-white mb-1">Account Info</h3>
        <p className="text-xs text-white/40 mb-4">Your registered details.</p>
        <div className="space-y-2">
          {[["Email", user.email ?? "—"], ["Name", meta.full_name ?? "—"], ["Reg No.", meta.reg_no ?? "—"]].map(([l, v]) => (
            <div key={l} className="flex items-center gap-3"><span className="text-[10px] text-white/40 uppercase tracking-widest w-20">{l}</span><span className="text-sm text-white">{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Problems Section ─────────────────────────────────────────────────────────
function ProblemsSection({
  team,
  selectedProblem,
  statements,
  onPicked,
}: {
  team: Team | null;
  selectedProblem: ProblemStatement | null;
  statements: ProblemStatement[];
  onPicked: (id: string) => Promise<void>;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function chooseProblem(problemId: string) {
    if (!team) return;
    if (team.selected_problem_id) {
      setMsg({ type: "err", text: "Problem already selected for your team." });
      return;
    }
    const confirmed = confirm("Confirm problem selection?\n\nOnce selected, this cannot be changed later.");
    if (!confirmed) return;
    setSavingId(problemId);
    setMsg(null);
    const { error } = await supabase
      .from("teams")
      .update({ selected_problem_id: problemId })
      .eq("id", team.id)
      .is("selected_problem_id", null);

    if (error) {
      setMsg({ type: "err", text: error.message });
      setSavingId(null);
      return;
    }

    await onPicked(problemId);
    setSavingId(null);
    setMsg({ type: "ok", text: "Problem statement selected and locked." });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5 border" style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.14) 0%, rgba(8,8,8,0.5) 100%)", borderColor: "rgba(212,160,23,0.3)" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-1">Problem Statements</p>
            <p className="text-2xl font-black text-white">Choose Your Team Problem</p>
            <p className="text-xs text-white/45 mt-1">Leaders can choose only once. After lock, selection list is hidden.</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-semibold" style={selectedProblem ? { background: "rgba(52,211,153,0.18)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
            {selectedProblem ? "Selected & locked" : "Not selected"}
          </span>
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.type === "ok" ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>}

      {selectedProblem ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(52,211,153,0.45)", background: "rgba(52,211,153,0.08)" }}>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Locked Selection</p>
                <p className="text-lg font-black text-white mt-1">{selectedProblem.title}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(52,211,153,0.18)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" }}>
                Selected
              </span>
            </div>
            <p className="text-sm text-white/65 mt-3 whitespace-pre-wrap">{selectedProblem.statement}</p>
            <p className="text-xs text-white/45 mt-3">Problem list is hidden because your team has locked selection.</p>
          </div>
        </div>
      ) : statements.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center text-white/40">No problem statements available yet. Ask admin to add them.</div>
      ) : (
        <div className="space-y-4">
          {statements.map((ps, idx) => (
            <div key={ps.id} className="rounded-2xl border overflow-hidden transition-all" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Problem {idx + 1}</p>
                    <p className="text-lg font-black text-white mt-1">{ps.title}</p>
                  </div>
                  <button
                    onClick={() => chooseProblem(ps.id)}
                    disabled={savingId === ps.id}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                    style={{ background: "#D4A017", color: "#080808" }}
                  >
                    {savingId === ps.id ? "Selecting…" : "Choose"}
                  </button>
                </div>
                <p className="text-sm text-white/65 mt-3 whitespace-pre-wrap">{ps.statement}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Play Section ─────────────────────────────────────────────────────────────
function PlaySection({
  selectedProblem,
  constraints,
  enabledRounds,
  roundControls,
  activeRound,
  myRoundBet,
  myRoundResult,
  roundLeaderboardBets,
  teamId,
  teamPoints,
  onRoundAction,
}: {
  selectedProblem: ProblemStatement | null;
  constraints: DomainConstraint[];
  enabledRounds: number[];
  roundControls: BettingRoundControl[];
  activeRound: number;
  myRoundBet: RoundBet | null;
  myRoundResult: RoundResult | null;
  roundLeaderboardBets: RoundBetLeaderboardRow[];
  teamId: string | null;
  teamPoints: number | null;
  onRoundAction: () => Promise<void>;
}) {
  const [placingBet, setPlacingBet] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<"hold" | "match" | "withdraw" | null>(null);
  const [betInput, setBetInput] = useState("100");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showConstraintPopup, setShowConstraintPopup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeControl = roundControls.find((r) => r.round_no === activeRound) ?? null;
  const activeConstraint = enabledRounds.includes(activeRound)
    ? constraints.find((c) => c.round_no === activeRound) ?? null
    : null;
  const showRoundLeaderboard = Boolean(activeControl?.show_betting_leaderboard);
  const potPoints = roundLeaderboardBets.reduce((sum, row) => {
    const committed = row.second_decision === "withdraw"
      ? row.initial_bet
      : (row.final_bet ?? row.initial_bet);
    return sum + committed;
  }, 0);

  async function submitInitialBet() {
    if (!activeControl) return;
    const numericBet = Number(betInput);
    if (!Number.isFinite(numericBet)) {
      setMsg({ type: "err", text: "Enter a valid bet amount." });
      return;
    }
    if (numericBet < activeControl.min_bet || numericBet > activeControl.max_bet) {
      setMsg({ type: "err", text: `Bet must be between ${activeControl.min_bet} and ${activeControl.max_bet}.` });
      return;
    }

    setPlacingBet(true);
    setMsg(null);
    const { error } = await supabase.rpc("submit_initial_bet", {
      p_round_no: activeRound,
      p_initial_bet: numericBet,
    });
    setPlacingBet(false);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Initial bet submitted." });
    await onRoundAction();
  }

  async function submitDecision(decision: "hold" | "match" | "withdraw") {
    setDecisionLoading(decision);
    setMsg(null);
    const { error } = await supabase.rpc("submit_second_decision", {
      p_round_no: activeRound,
      p_decision: decision,
    });
    setDecisionLoading(null);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Second decision submitted and locked." });
    await onRoundAction();
  }

  async function refreshPlayData() {
    setRefreshing(true);
    await onRoundAction();
    setRefreshing(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-stretch">
        <button
          type="button"
          onClick={() => activeConstraint && setShowConstraintPopup(true)}
          disabled={!activeConstraint}
          className="w-full text-left rounded-2xl p-5 border"
          style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.14) 0%, rgba(8,8,8,0.5) 100%)", borderColor: "rgba(212,160,23,0.3)", cursor: activeConstraint ? "pointer" : "default" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-1">Constraint</p>
              <p className="text-2xl font-black text-white">{activeConstraint ? activeConstraint.title : `Round ${activeRound}`}</p>
              {selectedProblem && (
                <p className="text-xs text-white/60 mt-1">
                  {activeConstraint ? activeConstraint.constraint_text : "No enabled constraint for this round yet."}
                </p>
              )}
              {activeConstraint && <p className="text-[10px] text-white/35 mt-2">Click to view full constraint</p>}
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={activeConstraint ? { background: "rgba(52,211,153,0.18)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
              {activeConstraint ? "Constraint active" : selectedProblem ? "Constraint pending" : "Problem not selected"}
            </span>
          </div>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
          {showRoundLeaderboard ? (
            <div className="rounded-2xl border p-4 flex flex-col justify-between h-full" style={{ borderColor: "rgba(212,160,23,0.35)", background: "linear-gradient(135deg, rgba(212,160,23,0.14) 0%, rgba(8,8,8,0.52) 100%)" }}>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-yellow-400/70">Prize Pot</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: "rgba(212,160,23,0.35)", background: "rgba(0,0,0,0.22)" }}>
                    <Image src="/student/prize.png" alt="Prize pot" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/60">Current Pot</p>
                    <p className="text-3xl font-black text-yellow-400">{potPoints.toLocaleString()} pts</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/55 mt-3">
                Pot = total committed stake this round.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border p-4 flex flex-col justify-center h-full" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
              <p className="text-sm text-white/70">Pot value is hidden by admin for this round.</p>
            </div>
          )}

          <div className="rounded-2xl border p-4 flex flex-col justify-between h-full" style={{ borderColor: "rgba(88,166,255,0.32)", background: "linear-gradient(135deg, rgba(88,166,255,0.16) 0%, rgba(8,8,8,0.52) 100%)" }}>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-blue-300/80">My Points</p>
              <p className="text-[11px] text-white/60 mt-2">Current Team Points</p>
              <p className="text-3xl font-black text-white mt-1">{(teamPoints ?? 0).toLocaleString()} pts</p>
            </div>
            <p className="text-xs text-white/55 mt-3">
              Updated after each round settlement.
            </p>
          </div>
        </div>
      </div>

      {showConstraintPopup && activeConstraint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowConstraintPopup(false)}
        >
          <div className="w-full max-w-xl rounded-2xl border overflow-hidden" style={{ background: "#0d0d0d", borderColor: "rgba(212,160,23,0.35)" }}>
            <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-[10px] uppercase tracking-widest text-yellow-400">Constraint Details</p>
              <p className="text-xl font-black text-white mt-1">Round {activeRound} · {activeConstraint.title}</p>
              <p className="text-xs text-white/45 mt-1">Domain: {selectedProblem?.domain ?? "—"}</p>
            </div>
            <div className="p-5 max-h-[60vh] overflow-auto">
              <p className="text-sm text-white/70 whitespace-pre-wrap">{activeConstraint.constraint_text}</p>
            </div>
            <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <button onClick={() => setShowConstraintPopup(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: "#D4A017" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {msg && (
        <p className={`text-sm ${msg.type === "ok" ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-stretch">
        <div className="rounded-2xl border p-5 h-full" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-yellow-400/80">Betting Round</p>
              <p className="text-xl font-black text-white">Round {activeRound}</p>
              <p className="text-xs text-white/45 mt-1">Weighted payout mode: winners share pot proportional to their final bet.</p>
            </div>
            <button
              onClick={refreshPlayData}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black disabled:opacity-60"
              style={{ background: "#D4A017" }}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {!selectedProblem && (
            <p className="text-sm text-white/60 mt-4">Select a problem first. Betting opens after problem lock.</p>
          )}

        {selectedProblem && activeControl && (
          <div className="mt-4 space-y-3">
            {activeControl.phase === "betting" && !myRoundBet && (
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(212,160,23,0.35)", background: "rgba(212,160,23,0.08)" }}>
                <p className="text-sm text-white">Place initial bet ({activeControl.min_bet} - {activeControl.max_bet})</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={betInput}
                    onChange={(e) => setBetInput(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm text-white bg-black/35 border border-white/15 outline-none"
                  />
                  <button
                    onClick={submitInitialBet}
                    disabled={placingBet}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-60"
                    style={{ background: "#D4A017" }}
                  >
                    {placingBet ? "Submitting…" : "Submit Bet"}
                  </button>
                </div>
              </div>
            )}

            {myRoundBet && (
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}>
                <p className="text-sm text-white">Initial: <span className="text-yellow-400 font-bold">{myRoundBet.initial_bet}</span> · Final: <span className="text-green-400 font-bold">{myRoundBet.final_bet ?? myRoundBet.initial_bet}</span></p>
                <p className="text-xs text-white/45 mt-1">Decision: {myRoundBet.second_decision === "double" ? "match" : (myRoundBet.second_decision ?? "pending")}</p>

                {activeControl.phase === "decision" && !myRoundBet.decision_locked && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["hold", "match", "withdraw"] as const).map((decision) => (
                      <button
                        key={decision}
                        onClick={() => submitDecision(decision)}
                        disabled={decisionLoading !== null}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 capitalize"
                        style={decision === "withdraw" ? { background: "rgba(218,54,51,0.8)" } : decision === "match" ? { background: "rgba(88,166,255,0.8)" } : { background: "rgba(52,211,153,0.8)" }}
                      >
                        {decisionLoading === decision ? "Submitting…" : decision}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeControl.phase === "evaluation" && (
              <div className="rounded-xl border p-4" style={{ borderColor: "rgba(88,166,255,0.35)", background: "rgba(88,166,255,0.08)" }}>
                <p className="text-sm text-white">Judges/Admin are evaluating this round. Results will appear once settled.</p>
              </div>
            )}

            {myRoundResult && (
              <div className="rounded-xl border p-4" style={{ borderColor: myRoundResult.is_winner ? "rgba(52,211,153,0.35)" : "rgba(218,54,51,0.35)", background: myRoundResult.is_winner ? "rgba(52,211,153,0.1)" : "rgba(218,54,51,0.1)" }}>
                <p className="text-sm font-semibold text-white">Result: Rank #{myRoundResult.rank_no} · Score {myRoundResult.score}</p>
                <p className="text-sm mt-1" style={{ color: myRoundResult.is_winner ? "#34d399" : "#f87171" }}>
                  {myRoundResult.is_winner ? "Winner" : "Not selected"} · Payout {myRoundResult.payout}
                </p>
              </div>
            )}

          </div>
        )}

        </div>

        <div className="rounded-2xl border p-5 h-full" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
          <p className="text-sm font-semibold text-white">Round Betting Leaderboard</p>
          <p className="text-xs text-white/45 mt-1">Visible only when admin enables it for this round.</p>

          {!showRoundLeaderboard ? (
            <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="text-sm text-white/70">Leaderboard is hidden by admin for now.</p>
            </div>
          ) : roundLeaderboardBets.length === 0 ? (
            <p className="text-sm text-white/55 mt-4">No bets submitted by teams yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {roundLeaderboardBets.map((row, idx) => (
                <div
                  key={row.id}
                  className="rounded-lg px-3 py-2 border"
                  style={row.team_id === teamId
                    ? { background: "rgba(212,160,23,0.08)", borderColor: "rgba(212,160,23,0.35)" }
                    : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white font-semibold truncate">#{idx + 1} {row.teams?.team_name ?? "Team"}{row.team_id === teamId ? " (You)" : ""}</p>
                    <p className="text-xs text-white/55">{row.second_decision === "double" ? "match" : (row.second_decision ?? "pending")}</p>
                  </div>
                  <p className="text-xs text-white/65 mt-1">Initial: {row.initial_bet} · Final: {row.final_bet ?? row.initial_bet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Leader Dashboard ──────────────────────────────────────────────────────────
export default function LeaderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [section, setSection] = useState<NavSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hackathon, setHackathon] = useState<HackathonConfig>(DEFAULT_HACKATHON_CONFIG);
  const [now, setNow] = useState(Date.now());
  const [showLastFivePopup, setShowLastFivePopup] = useState(false);
  const [statements, setStatements] = useState<ProblemStatement[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<ProblemStatement | null>(null);
  const [constraints, setConstraints] = useState<DomainConstraint[]>([]);
  const [enabledRounds, setEnabledRounds] = useState<number[]>([]);
  const [roundControls, setRoundControls] = useState<BettingRoundControl[]>([]);
  const [activeRound, setActiveRound] = useState<number>(1);
  const [myRoundBet, setMyRoundBet] = useState<RoundBet | null>(null);
  const [myRoundResult, setMyRoundResult] = useState<RoundResult | null>(null);
  const [roundLeaderboardBets, setRoundLeaderboardBets] = useState<RoundBetLeaderboardRow[]>([]);
  const [updates, setUpdates] = useState<LeaderDashboardUpdate[]>([]);
  const [showUpdatesPreview, setShowUpdatesPreview] = useState(false);
  const [updatesSeenAt, setUpdatesSeenAt] = useState<string | null>(null);
  const lastFiveShownRef = useRef(false);

  const fetchTeamData = useCallback(async (userId: string) => {
    const { data: teamData } = await supabase.from("teams").select("*").eq("leader_id", userId).single();
    setTeam(teamData ?? null);
    if (teamData?.selected_problem_id) {
      const { data: selected } = await supabase
        .from("problem_statements")
        .select("id, domain, title, statement, created_at")
        .eq("id", teamData.selected_problem_id)
        .maybeSingle();
      setSelectedProblem((selected ?? null) as ProblemStatement | null);
      if (selected?.domain) {
        const { data: roundRows } = await supabase
          .from("constraint_round_settings")
          .select("round_no, is_enabled")
          .eq("is_enabled", true)
          .order("round_no", { ascending: true });
        const enabled = ((roundRows ?? []) as ConstraintRoundSetting[]).map((r) => r.round_no);
        setEnabledRounds(enabled);

        const { data: list } = await supabase
          .from("domain_constraints")
          .select("id, domain, round_no, title, constraint_text, created_at")
          .eq("domain", selected.domain)
          .in("round_no", enabled.length ? enabled : [-1])
          .order("round_no", { ascending: true })
          .order("created_at", { ascending: true });
        setConstraints((list ?? []) as DomainConstraint[]);
      } else {
        setConstraints([]);
        setEnabledRounds([]);
      }
    } else {
      setSelectedProblem(null);
      setConstraints([]);
      setEnabledRounds([]);
    }
    if (teamData) {
      const { data: memberData } = await supabase.from("team_members").select("*").eq("team_id", teamData.id).order("created_at");
      setMembers(memberData ?? []);
    }
  }, []);

  const loadProblemStatements = useCallback(async () => {
    const { data } = await supabase
      .from("problem_statements")
      .select("id, domain, title, statement, created_at")
      .order("created_at", { ascending: true });
    setStatements((data ?? []) as ProblemStatement[]);
  }, []);

  const loadBettingData = useCallback(async (teamId?: string) => {
    const localTeamId = teamId ?? team?.id;
    if (!localTeamId) return;

    const { data: controls } = await supabase
      .from("betting_round_control")
      .select("round_no, phase, min_bet, max_bet, show_betting_leaderboard")
      .order("round_no", { ascending: true });

    const typedControls = (controls ?? []) as BettingRoundControl[];
    setRoundControls(typedControls);

    const current = typedControls.find((c) => ["betting", "decision", "evaluation"].includes(c.phase))
      ?? typedControls.find((c) => c.phase === "setup")
      ?? typedControls[typedControls.length - 1]
      ?? { round_no: 1, phase: "setup", min_bet: 0, max_bet: 0, show_betting_leaderboard: false };

    const currentRound = current.round_no;
    setActiveRound(currentRound);

    const [{ data: betData }, { data: resultData }, { data: allBets }] = await Promise.all([
      supabase
        .from("round_bets")
        .select("id, round_no, team_id, initial_bet, second_decision, final_bet, decision_locked")
        .eq("round_no", currentRound)
        .eq("team_id", localTeamId)
        .maybeSingle(),
      supabase
        .from("round_results")
        .select("round_no, team_id, rank_no, score, final_bet, is_winner, payout")
        .eq("round_no", currentRound)
        .eq("team_id", localTeamId)
        .maybeSingle(),
      supabase
        .from("round_bets")
        .select("id, round_no, team_id, initial_bet, second_decision, final_bet, decision_locked, teams(team_name)")
        .eq("round_no", currentRound)
        .order("final_bet", { ascending: false })
        .order("initial_bet", { ascending: false }),
    ]);

    setMyRoundBet((betData ?? null) as RoundBet | null);
    setMyRoundResult((resultData ?? null) as RoundResult | null);
    setRoundLeaderboardBets((allBets ?? []) as unknown as RoundBetLeaderboardRow[]);
  }, [team?.id]);

  const loadUpdates = useCallback(async () => {
    const { data } = await supabase
      .from("dashboard_updates")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    setUpdates((data ?? []) as LeaderDashboardUpdate[]);
  }, []);

  const markUpdatesViewed = useCallback(() => {
    if (!updates[0]?.created_at) return;
    const seen = updates[0].created_at;
    setUpdatesSeenAt(seen);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("leader_updates_seen_at", seen);
    }
  }, [updates]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/"); return; }
      const { data: leaderTeam } = await supabase.from("teams").select("id").eq("leader_id", user.id).maybeSingle();
      if (!leaderTeam) { router.replace("/dashboard/member"); return; }
      setUser(user); fetchTeamData(user.id);
      loadProblemStatements();
      loadBettingData(leaderTeam.id);
      loadUpdates();
    });
  }, [router, fetchTeamData, loadProblemStatements, loadBettingData, loadUpdates]);

  const loadHackathon = useCallback(async () => {
    const { data } = await supabase
      .from("hackathon_config")
      .select("starts_at, duration_minutes, is_running")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      setHackathon(data as HackathonConfig);
    }
  }, []);

  useEffect(() => {
    loadHackathon();
    const pollId = setInterval(loadHackathon, 15000);
    const bettingPollId = setInterval(() => loadBettingData(), 10000);
    const updatesPollId = setInterval(loadUpdates, 20000);
    const tickId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(pollId);
      clearInterval(bettingPollId);
      clearInterval(updatesPollId);
      clearInterval(tickId);
    };
  }, [loadHackathon, loadBettingData, loadUpdates]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUpdatesSeenAt(window.localStorage.getItem("leader_updates_seen_at"));
    }
  }, []);

  useEffect(() => {
    const snapshot = getHackathonSnapshot(hackathon, now);
    if (!hackathon.is_running) {
      lastFiveShownRef.current = false;
      return;
    }
    if (snapshot.mode === "live" && snapshot.ms <= 5 * 60 * 1000 && !lastFiveShownRef.current) {
      setShowLastFivePopup(true);
      lastFiveShownRef.current = true;
    }
  }, [hackathon, now]);

  async function handleLogout() { await supabase.auth.signOut(); router.replace("/"); }
  function handleTopRefresh() { window.location.reload(); }

  if (!user) return <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#080808" }}><div className="text-white/40 text-sm animate-pulse">Loading…</div></div>;

  const meta = user.user_metadata as Record<string, string>;
  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <IconGrid /> },
    { id: "leaderboard", label: "Leaderboard", icon: <IconTrophy /> },
    { id: "problems", label: "Problems", icon: <IconDoc /> },
    { id: "play", label: "Play", icon: <IconPlay /> },
    { id: "updates", label: "Updates", icon: <IconBell /> },
    { id: "team", label: "Team", icon: <IconUsers /> },
    { id: "attendance", label: "Attendance", icon: <IconScan /> },
    { id: "settings", label: "Settings", icon: <IconSettings /> },
  ];

  const snapshot = getHackathonSnapshot(hackathon, now);
  const hasUnreadUpdates = Boolean(
    updates[0]?.created_at && (!updatesSeenAt || new Date(updates[0].created_at).getTime() > new Date(updatesSeenAt).getTime())
  );
  const headerTimer = snapshot.mode === "live"
    ? `${Math.floor(snapshot.ms / 3600000).toString().padStart(2, "0")}:${Math.floor((snapshot.ms % 3600000) / 60000).toString().padStart(2, "0")}:${Math.floor((snapshot.ms % 60000) / 1000).toString().padStart(2, "0")}`
    : snapshot.mode === "paused"
      ? `${Math.max(1, Math.round(hackathon.duration_minutes / 60))}h configured`
      : "Hackathon Ended";

  return (
    <div className="min-h-screen flex" style={{ background: "#080808" }}>
      <Stars />
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r border-white/8 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`} style={{ width: 240, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(20px)" }}>
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-yellow-500/40 shrink-0" style={{ boxShadow: "0 0 10px rgba(212,160,23,0.3)" }}><Image src="/aws-logo.png" alt="logo" fill className="object-cover brightness-110" /></div>
            <div><span className="text-sm font-bold text-white tracking-wider">CLOUD-FLUSH</span><p className="text-[10px] text-white/30">AWS Cloud Club VIT</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => {
              setSection(item.id);
              if (item.id === "updates") markUpdatesViewed();
              setSidebarOpen(false);
            }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${section === item.id ? "text-black" : "text-white/50 hover:text-white hover:bg-white/5"}`} style={section === item.id ? { background: "#D4A017" } : {}}>
              {item.icon}{item.label}
              {item.id === "updates" && hasUnreadUpdates && <span className="ml-auto h-2 w-2 rounded-full" style={{ background: "#f85149" }} />}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-5 border-t border-white/8 pt-4 space-y-3">
          <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-xs font-semibold text-white truncate">{meta?.full_name ?? user.email?.split("@")[0]}</p>
            <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full text-black font-bold" style={{ background: "#D4A017" }}>Team Leader</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"><IconLogout /> Logout</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen relative z-10" style={{ marginLeft: 0 }}>
        <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b border-white/8" style={{ background: "rgba(8,8,8,0.9)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg></button>
            <div>
              <h1 className="text-base font-bold text-white capitalize">{section}</h1>
              <p className="text-[10px] text-white/30 hidden sm:block">{section === "overview" ? "Your hackathon at a glance" : section === "leaderboard" ? "Countdown and team rankings" : section === "problems" ? "Choose and lock your team problem" : section === "play" ? "Betting and decisions by active round" : section === "updates" ? "Latest admin announcements" : section === "team" ? "Manage your team members" : section === "attendance" ? "Your attendance QR code" : "Account & security settings"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTopRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}
            >
              <IconRefresh /> Refresh
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUpdatesPreview((prev) => !prev)}
                className="relative p-2 rounded-lg border transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: hasUnreadUpdates ? "rgba(248,81,73,0.65)" : "rgba(255,255,255,0.12)",
                  color: hasUnreadUpdates ? "#f87171" : "rgba(255,255,255,0.75)",
                }}
              >
                <IconBell />
                {hasUnreadUpdates && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full" style={{ background: "#f85149" }} />
                )}
              </button>

              {showUpdatesPreview && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border p-3 z-30" style={{ background: "#0f1118", borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 12px 36px rgba(0,0,0,0.35)" }}>
                  <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Latest Updates</p>
                  {updates.length === 0 ? (
                    <p className="text-sm text-white/60">No updates yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {updates.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { setShowUpdatesPreview(false); setSection("updates"); markUpdatesViewed(); }}
                          className="w-full text-left rounded-lg p-2 border hover:bg-white/5 transition-colors"
                          style={{ borderColor: "rgba(255,255,255,0.1)" }}
                        >
                          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                          <p className="text-xs text-white/55 line-clamp-2 mt-0.5">{item.body}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => { setShowUpdatesPreview(false); setSection("updates"); markUpdatesViewed(); }}
                    className="mt-3 text-xs font-semibold hover:underline"
                    style={{ color: "#58a6ff" }}
                  >
                    View all updates
                  </button>
                </div>
              )}
            </div>

            {section !== "leaderboard" && (
              <div className="hidden sm:block">
                <div className="px-3 py-1.5 rounded-lg border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)" }}>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>Timer</p>
                  <p className="text-sm font-bold font-mono" style={{ color: snapshot.mode === "live" ? "#34d399" : "rgba(255,255,255,0.75)" }}>{headerTimer}</p>
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 p-5 sm:p-8">
          <div className={`${section === "play" ? "max-w-none" : section === "overview" ? "max-w-6xl" : section === "leaderboard" || section === "problems" ? "max-w-4xl" : "max-w-3xl"} mx-auto lg:mx-0 w-full`}>
            {section === "overview" && <Overview team={team} members={members} selectedProblem={selectedProblem} constraints={constraints} enabledRounds={enabledRounds} onOpenProblems={() => setSection("problems")} />}
            {section === "leaderboard" && <LeaderboardSection team={team} hackathon={hackathon} now={now} />}
            {section === "problems" && <ProblemsSection team={team} selectedProblem={selectedProblem} statements={statements} onPicked={async () => {
              await loadProblemStatements();
              await fetchTeamData(user.id);
              await loadBettingData();
            }} />}
            {section === "play" && <PlaySection selectedProblem={selectedProblem} constraints={constraints} enabledRounds={enabledRounds} roundControls={roundControls} activeRound={activeRound} myRoundBet={myRoundBet} myRoundResult={myRoundResult} roundLeaderboardBets={roundLeaderboardBets} teamId={team?.id ?? null} teamPoints={team?.points ?? 0} onRoundAction={async () => { await loadBettingData(); }} />}
            {section === "updates" && <UpdatesSection updates={updates} />}
            {section === "team" && <TeamSection team={team} members={members} onMemberAdded={() => fetchTeamData(user.id)} />}
            {section === "attendance" && <AttendanceSection user={user} team={team} />}
            {section === "settings" && <SettingsSection user={user} />}
          </div>
        </div>

        {showLastFivePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}>
            <div className="w-full max-w-md rounded-2xl border p-5" style={{ background: "#0d0d0d", borderColor: "rgba(212,160,23,0.4)" }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: "#D4A017" }}>Notification</p>
              <h3 className="text-xl font-black text-white mt-1">Last 5 Minutes Remaining</h3>
              <p className="text-sm text-white/60 mt-2">Only 5 minutes left in the hackathon. Wrap up and submit now.</p>
              <button onClick={() => setShowLastFivePopup(false)} className="mt-4 px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: "#D4A017" }}>
                Okay
              </button>
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes twinkle { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.6; } } @media (min-width: 1024px) { main { margin-left: 240px !important; } }`}</style>
    </div>
  );
}
