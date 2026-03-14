"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, type Team, type TeamMember } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import QRCode from "react-qr-code";

type NavSection = "overview" | "leaderboard" | "problems" | "team" | "attendance" | "settings";
type HackathonConfig = { starts_at: string; duration_minutes: number; is_running: boolean };
type ProblemStatement = { id: string; domain: string; title: string; statement: string; created_at: string };
type DomainConstraint = { id: string; domain: string; round_no: number; title: string; constraint_text: string; created_at: string };
type ConstraintRoundSetting = { round_no: number; is_enabled: boolean };
type BettingRoundControl = { round_no: number; phase: "setup" | "betting" | "decision" | "evaluation" | "settled"; min_bet: number; max_bet: number };
type RoundBet = { round_no: number; team_id: string; initial_bet: number; second_decision: "hold" | "double" | "withdraw" | null; final_bet: number | null; decision_locked: boolean };
type RoundResult = { round_no: number; team_id: string; rank_no: number; score: number; final_bet: number; is_winner: boolean; payout: number };

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
function IconSettings() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function IconLogout() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }

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
const ROUNDS = [
  { number: 1, name: "Cloud Architecture Blitz", duration: "6 hours", points: "300 pts", color: "#D4A017", description: "Design and deploy a scalable cloud architecture on AWS. Your solution must use at least 3 AWS services, handle 1,000 concurrent users, and be secured with proper IAM roles and security groups. Submit a GitHub repo + live demo link.", requirements: ["Minimum 3 AWS services integrated", "IAM roles and security groups configured", "Handles 1,000 concurrent requests", "Architecture diagram (draw.io / Lucidchart)", "GitHub repo with setup README"] },
  { number: 2, name: "Serverless Challenge", duration: "6 hours", points: "400 pts", color: "#7C3AED", description: "Build a fully serverless application using AWS Lambda, API Gateway, and DynamoDB. Include Cognito authentication and deploy the entire stack via IaC (CloudFormation or CDK).", requirements: ["AWS Lambda + API Gateway", "DynamoDB as data store", "Cognito user authentication", "IaC deployment (CloudFormation / CDK)"] },
  { number: 3, name: "Cost Optimization Sprint", duration: "4 hours", points: "300 pts", color: "#059669", description: "Given a pre-built bloated AWS architecture, identify cost inefficiencies and refactor to reduce the monthly bill by ≥40% without sacrificing performance or reliability.", requirements: ["Cost analysis report (AWS Cost Explorer)", "Optimised architecture diagram", "≥40% cost reduction achieved", "No degradation in performance metrics"] },
];
const CURRENT_ROUND_INDEX = 0;
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

// ── Overview (read-only for member) ──────────────────────────────────────────
function Overview({
  myInfo,
  team,
  members,
  selectedProblem,
  constraints,
  enabledRounds,
  activeRound,
  roundPhase,
  roundBet,
  roundResult,
  onOpenProblems,
}: {
  myInfo: TeamMember | null;
  team: Team | null;
  members: TeamMember[];
  selectedProblem: ProblemStatement | null;
  constraints: DomainConstraint[];
  enabledRounds: number[];
  activeRound: number;
  roundPhase: BettingRoundControl["phase"];
  roundBet: RoundBet | null;
  roundResult: RoundResult | null;
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
              <span className="text-[10px] text-white/35 group-hover:text-yellow-300/80 transition-colors">View list →</span>
            </div>
            {selectedProblem ? (
              <>
                <p className="text-xl font-black text-white leading-tight">{selectedProblem.title}</p>
                <p className="text-sm text-white/60 mt-2 line-clamp-4 whitespace-pre-wrap">{selectedProblem.statement}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-white leading-tight">Problem not chosen yet</p>
                <p className="text-sm text-white/60 mt-2">Your team leader has not selected a problem statement yet.</p>
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
              <p className="text-sm text-white/60">Your leader has not selected a problem yet.</p>
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
            )) : <p className="text-xs text-white/35">No team members found.</p>}
          </div>

          <div className="mt-4 rounded-xl border p-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.1)" }}>
            <p className="text-[10px] text-white/45 uppercase tracking-widest">Betting Status</p>
            <p className="text-sm text-white mt-1">Round {activeRound} · <span className="text-yellow-400 capitalize">{roundPhase}</span></p>
            {!roundBet ? (
              <p className="text-xs text-white/50 mt-1">No bet submitted yet for this round.</p>
            ) : (
              <p className="text-xs text-white/60 mt-1">Initial {roundBet.initial_bet} · Final {roundBet.final_bet ?? roundBet.initial_bet} · Decision {roundBet.second_decision ?? "pending"}</p>
            )}
            {roundResult && (
              <p className="text-xs mt-1" style={{ color: roundResult.is_winner ? "#34d399" : "#f87171" }}>
                Rank #{roundResult.rank_no} · {roundResult.is_winner ? "Winner" : "Not selected"} · Payout {roundResult.payout}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemsSection({ selectedProblem, statements }: { selectedProblem: ProblemStatement | null; statements: ProblemStatement[] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5 border" style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.14) 0%, rgba(8,8,8,0.5) 100%)", borderColor: "rgba(212,160,23,0.3)" }}>
        <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-1">Problem Statements</p>
        <p className="text-2xl font-black text-white">Your Team Selection</p>
        <p className="text-xs text-white/45 mt-1">Members can view all problems. Only team leader can choose one.</p>
      </div>

      {statements.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center text-white/40">No problem statements available yet.</div>
      ) : (
        <div className="space-y-4">
          {statements.map((ps, idx) => {
            const isSelected = selectedProblem?.id === ps.id;
            return (
              <div key={ps.id} className="rounded-2xl border overflow-hidden transition-all" style={{ borderColor: isSelected ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.1)", background: isSelected ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)" }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">Problem {idx + 1}</p>
                      <p className="text-lg font-black text-white mt-1">{ps.title}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(52,211,153,0.18)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" }}>
                        Selected by leader
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/65 mt-3 whitespace-pre-wrap">{ps.statement}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeaderboardSection({ team, hackathon, now }: { team: Team | null; hackathon: HackathonConfig; now: number }) {
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; team_name: string; points: number }>>([]);

  useEffect(() => {
    supabase
      .from("teams")
      .select("id, team_name, points")
      .order("points", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setLeaderboard(
            (data as Array<{ id: string; team_name: string; points?: number | null }>).map((t) => ({
              id: t.id,
              team_name: t.team_name,
              points: t.points ?? 0,
            }))
          );
        }
      });
  }, []);

  const boardData = leaderboard.length > 0
    ? leaderboard
    : [{ id: team?.id ?? "own", team_name: team?.team_name ?? "Your Team", points: TEAM_POINTS }];
  const snapshot = getHackathonSnapshot(hackathon, now);
  const totalSecs = Math.floor(snapshot.ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const timerMode = snapshot.mode;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 border transition-all" style={{ background: timerMode === "live" ? "linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(8,8,8,0.8) 100%)" : "rgba(255,255,255,0.03)", borderColor: timerMode === "live" ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-2 mb-3">
          {timerMode === "live" && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
          <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: timerMode === "live" ? "#34d399" : "rgba(255,255,255,0.4)" }}>{timerMode === "paused" ? "Configured duration" : timerMode === "live" ? "Live · time remaining" : "Hackathon ended"}</p>
        </div>
        {timerMode === "ended" ? <p className="text-xl font-bold text-white/60">It&apos;s a wrap! 🎉</p>
          : timerMode === "paused" ? <div className="grid grid-cols-4 gap-2"><TimeUnit label="Days" value={days} accent={false} /><TimeUnit label="Hours" value={hours} accent={false} /><TimeUnit label="Mins" value={minutes} accent={false} /><TimeUnit label="Secs" value={seconds} accent={false} /></div>
          : <div className="grid grid-cols-3 gap-2"><TimeUnit label="Hours" value={Math.floor(totalSecs / 3600)} accent /><TimeUnit label="Mins" value={minutes} accent /><TimeUnit label="Secs" value={seconds} accent /></div>}
      </div>

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

// ── Team (read-only) ──────────────────────────────────────────────────────────
function TeamSection({ team, members }: { team: Team | null; members: TeamMember[] }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Team Name</p><p className="text-2xl font-black text-white">{team?.team_name ?? "—"}</p></div>
      </div>
      <h3 className="text-base font-bold text-white">Team Members <span className="text-white/30 font-normal text-sm">({members.length})</span></h3>
      {members.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No team members found.</div>
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
function AttendanceSection({ user, myInfo, team }: { user: User; myInfo: TeamMember | null; team: Team | null }) {
  const qrData = JSON.stringify({ name: myInfo?.name ?? "", reg_no: myInfo?.reg_no ?? "", email: user.email ?? "", team_name: team?.team_name ?? "" });
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 p-8" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="p-4 rounded-2xl" style={{ background: "#ffffff" }}><QRCode value={qrData} size={220} bgColor="#ffffff" fgColor="#080808" /></div>
      <div className="w-full max-w-sm"><InfoRow label="Name" value={myInfo?.name ?? "—"} /><InfoRow label="Reg No" value={myInfo?.reg_no ?? "—"} /><InfoRow label="Email" value={user.email ?? "—"} /><InfoRow label="Team" value={team?.team_name ?? "—"} /></div>
      <p className="text-xs text-white/20 text-center">Show this QR to a coordinator to mark your attendance.</p>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsSection({ user, myInfo }: { user: User; myInfo: TeamMember | null }) {
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
          {[["Email", user.email ?? "—"], ["Name", myInfo?.name ?? "—"], ["Reg No.", myInfo?.reg_no ?? "—"]].map(([l, v]) => (
            <div key={l} className="flex items-center gap-3"><span className="text-[10px] text-white/40 uppercase tracking-widest w-20">{l}</span><span className="text-sm text-white">{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Member Dashboard ──────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myInfo, setMyInfo] = useState<TeamMember | null>(null);
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
  const [enabledRounds, setEnabledRounds] = useState<number[]>([1, 2, 3, 4, 5]);
  const [activeRound, setActiveRound] = useState(1);
  const [roundPhase, setRoundPhase] = useState<BettingRoundControl["phase"]>("setup");
  const [roundBet, setRoundBet] = useState<RoundBet | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const lastFiveShownRef = useRef(false);

  const fetchTeamData = useCallback(async (userId: string) => {
    // Get this member's own row first
    const { data: myRow } = await supabase.from("team_members").select("*").eq("user_id", userId).single();
    setMyInfo(myRow ?? null);
    if (!myRow) return;

    // Load the team
    const { data: teamData } = await supabase.from("teams").select("*").eq("id", myRow.team_id).single();
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
        setEnabledRounds([1, 2, 3, 4, 5]);
      }
    } else {
      setSelectedProblem(null);
      setConstraints([]);
      setEnabledRounds([1, 2, 3, 4, 5]);
    }

    // Load all members of the team
    const { data: memberData } = await supabase.from("team_members").select("*").eq("team_id", myRow.team_id).order("created_at");
    setMembers(memberData ?? []);
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
      .select("round_no, phase, min_bet, max_bet")
      .order("round_no", { ascending: true });

    const typedControls = (controls ?? []) as BettingRoundControl[];
    const current = typedControls.find((c) => ["betting", "decision", "evaluation"].includes(c.phase))
      ?? typedControls.find((c) => c.phase === "setup")
      ?? typedControls[typedControls.length - 1]
      ?? { round_no: 1, phase: "setup", min_bet: 0, max_bet: 0 };

    setActiveRound(current.round_no);
    setRoundPhase(current.phase);

    const [{ data: betData }, { data: resultData }] = await Promise.all([
      supabase
        .from("round_bets")
        .select("round_no, team_id, initial_bet, second_decision, final_bet, decision_locked")
        .eq("round_no", current.round_no)
        .eq("team_id", localTeamId)
        .maybeSingle(),
      supabase
        .from("round_results")
        .select("round_no, team_id, rank_no, score, final_bet, is_winner, payout")
        .eq("round_no", current.round_no)
        .eq("team_id", localTeamId)
        .maybeSingle(),
    ]);

    setRoundBet((betData ?? null) as RoundBet | null);
    setRoundResult((resultData ?? null) as RoundResult | null);
  }, [team?.id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/"); return; }
      setUser(user); fetchTeamData(user.id);
      loadProblemStatements();
    });
  }, [router, fetchTeamData, loadProblemStatements]);

  useEffect(() => {
    if (team?.id) {
      loadBettingData(team.id);
    }
  }, [team?.id, loadBettingData]);

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
    const tickId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(pollId);
      clearInterval(bettingPollId);
      clearInterval(tickId);
    };
  }, [loadHackathon, loadBettingData]);

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

  if (!user) return <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#080808" }}><div className="text-white/40 text-sm animate-pulse">Loading…</div></div>;

  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <IconGrid /> },
    { id: "leaderboard", label: "Leaderboard", icon: <IconTrophy /> },
    { id: "team", label: "Team", icon: <IconUsers /> },
    { id: "attendance", label: "Attendance", icon: <IconScan /> },
    { id: "settings", label: "Settings", icon: <IconSettings /> },
  ];

  const snapshot = getHackathonSnapshot(hackathon, now);
  const headerTimer = snapshot.mode === "live"
    ? `Time Left · ${Math.floor(snapshot.ms / 3600000)}h ${Math.floor((snapshot.ms % 3600000) / 60000)}m ${Math.floor((snapshot.ms % 60000) / 1000)}s`
    : snapshot.mode === "paused"
      ? `Duration · ${Math.max(1, Math.round(hackathon.duration_minutes / 60))}h`
      : "Hackathon Ended";

  return (
    <div className="min-h-screen flex" style={{ background: "#080808" }}>
      <Stars />
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r border-white/8 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`} style={{ width: 240, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(20px)" }}>
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-yellow-500/40 shrink-0" style={{ boxShadow: "0 0 10px rgba(212,160,23,0.3)" }}><Image src="/awscc_logo.webp" alt="logo" fill className="object-cover brightness-110" /></div>
            <div><span className="text-sm font-bold text-white tracking-wider">CLOUD-FLUSH</span><p className="text-[10px] text-white/30">AWS Cloud Club VIT</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${section === item.id ? "text-black" : "text-white/50 hover:text-white hover:bg-white/5"}`} style={section === item.id ? { background: "#D4A017" } : {}}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-5 border-t border-white/8 pt-4 space-y-3">
          <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-xs font-semibold text-white truncate">{myInfo?.name ?? user.email?.split("@")[0]}</p>
            <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-medium">Member</span>
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
              <p className="text-[10px] text-white/30 hidden sm:block">{section === "overview" ? "Your hackathon at a glance" : section === "leaderboard" ? "Countdown and team rankings" : section === "problems" ? "Problem statements selected by your leader" : section === "team" ? "Your team members" : section === "attendance" ? "Your attendance QR code" : "Account & security settings"}</p>
            </div>
          </div>
          <div className="hidden sm:block text-xs text-white/30">{headerTimer}</div>
        </header>
        <div className="flex-1 p-5 sm:p-8">
          <div className={`${section === "overview" ? "max-w-6xl" : section === "leaderboard" || section === "problems" ? "max-w-4xl" : "max-w-3xl"} mx-auto lg:mx-0 w-full`}>
            {section === "overview" && <Overview myInfo={myInfo} team={team} members={members} selectedProblem={selectedProblem} constraints={constraints} enabledRounds={enabledRounds} activeRound={activeRound} roundPhase={roundPhase} roundBet={roundBet} roundResult={roundResult} onOpenProblems={() => setSection("problems")} />}
            {section === "leaderboard" && <LeaderboardSection team={team} hackathon={hackathon} now={now} />}
            {section === "problems" && <ProblemsSection selectedProblem={selectedProblem} statements={statements} />}
            {section === "team" && <TeamSection team={team} members={members} />}
            {section === "attendance" && <AttendanceSection user={user} myInfo={myInfo} team={team} />}
            {section === "settings" && <SettingsSection user={user} myInfo={myInfo} />}
          </div>
        </div>

        {showLastFivePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}>
            <div className="w-full max-w-md rounded-2xl border p-5" style={{ background: "#0d0d0d", borderColor: "rgba(212,160,23,0.4)" }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: "#D4A017" }}>Notification</p>
              <h3 className="text-xl font-black text-white mt-1">Last 5 Minutes Remaining</h3>
              <p className="text-sm text-white/60 mt-2">Submit everything now. Timer is in the final 5 minutes.</p>
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
