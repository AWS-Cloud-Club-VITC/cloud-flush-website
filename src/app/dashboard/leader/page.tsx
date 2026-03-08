"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, createEphemeralClient, type Team, type TeamMember } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import QRCode from "react-qr-code";

type NavSection = "overview" | "team" | "attendance" | "play" | "settings";

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconGrid() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>; }
function IconUsers() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconScan() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" /><rect x="8" y="8" width="8" height="8" rx="1" /></svg>; }
function IconPlay() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="5 3 19 12 5 21 5 3" /></svg>; }
function IconSettings() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function IconLogout() { return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }
function IconPlus() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }

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
const HACKATHON_START = new Date("2026-03-23T09:00:00+05:30").getTime();
const HACKATHON_END = HACKATHON_START + 24 * 60 * 60 * 1000;

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
function Overview({ user, team, members }: { user: User; team: Team | null; members: TeamMember[] }) {
  const [roundOpen, setRoundOpen] = useState(false);
  const [timerState, setTimerState] = useState<"before" | "live" | "ended">("before");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; team_name: string; points: number }>>([]);

  useEffect(() => {
    function tick() {
      const now = Date.now();
      if (now < HACKATHON_START) { const d = HACKATHON_START - now; setTimerState("before"); setTimeLeft({ days: Math.floor(d / 86400000), hours: Math.floor((d / 3600000) % 24), minutes: Math.floor((d / 60000) % 60), seconds: Math.floor((d / 1000) % 60) }); }
      else if (now < HACKATHON_END) { const d = HACKATHON_END - now; setTimerState("live"); setTimeLeft({ days: 0, hours: Math.floor(d / 3600000), minutes: Math.floor((d / 60000) % 60), seconds: Math.floor((d / 1000) % 60) }); }
      else { setTimerState("ended"); setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); }
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  useEffect(() => {
    supabase.from("teams").select("id, team_name, points").order("points", { ascending: false })
      .then(({ data, error }) => { if (!error && data) setLeaderboard((data as Array<{ id: string; team_name: string; points?: number | null }>).map(t => ({ id: t.id, team_name: t.team_name, points: t.points ?? 0 }))); });
  }, []);

  const meta = user.user_metadata as Record<string, string>;
  const currentRound = ROUNDS[CURRENT_ROUND_INDEX];
  const boardData = leaderboard.length > 0 ? leaderboard : [{ id: team?.id ?? "own", team_name: team?.team_name ?? "Your Team", points: team?.points ?? 0 }];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Welcome */}
        <div className="rounded-2xl p-5 border border-white/10" style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(255,215,0,0.04) 100%)" }}>
          <p className="text-xs text-yellow-500/70 uppercase tracking-widest mb-1">Welcome back</p>
          <h2 className="text-xl font-bold text-white">{meta?.full_name ?? user.email}</h2>
          {team && <p className="text-sm text-white/50 mt-0.5">Team Leader · <span className="text-yellow-400">{team.team_name}</span></p>}
        </div>
        {/* Timer */}
        <div className="rounded-2xl p-5 border transition-all" style={{ background: timerState === "live" ? "linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(8,8,8,0.8) 100%)" : "rgba(255,255,255,0.03)", borderColor: timerState === "live" ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-2 mb-3">
            {timerState === "live" && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
            <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: timerState === "live" ? "#34d399" : "rgba(255,255,255,0.4)" }}>{timerState === "before" ? "Hackathon starts in" : timerState === "live" ? "Live · time remaining" : "Hackathon ended"}</p>
          </div>
          {timerState === "ended" ? <p className="text-xl font-bold text-white/60">It&apos;s a wrap! 🎉</p>
            : timerState === "before" ? <div className="grid grid-cols-4 gap-2"><TimeUnit label="Days" value={timeLeft.days} accent={false} /><TimeUnit label="Hours" value={timeLeft.hours} accent={false} /><TimeUnit label="Mins" value={timeLeft.minutes} accent={false} /><TimeUnit label="Secs" value={timeLeft.seconds} accent={false} /></div>
            : <div className="grid grid-cols-3 gap-2"><TimeUnit label="Hours" value={timeLeft.hours} accent /><TimeUnit label="Mins" value={timeLeft.minutes} accent /><TimeUnit label="Secs" value={timeLeft.seconds} accent /></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-4">
          {/* Round card */}
          <button onClick={() => setRoundOpen(true)} className="w-full text-left rounded-2xl p-5 border group transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]" style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.22) 0%, rgba(120,80,0,0.12) 60%, rgba(8,8,8,0.5) 100%)", borderColor: "rgba(212,160,23,0.35)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /><span className="text-[10px] text-yellow-400/80 uppercase tracking-widest font-semibold">Current Round</span></div>
              <span className="text-[10px] text-white/30 group-hover:text-yellow-400/70 transition-colors">View task →</span>
            </div>
            <p className="text-4xl font-black text-white tracking-tight leading-none">Round {currentRound.number}</p>
            <p className="text-sm text-white/60 mt-1.5">{currentRound.name}</p>
            <div className="flex gap-2 mt-4">
              <span className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-white/50">⏱ {currentRound.duration}</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold text-black" style={{ background: "#D4A017" }}>{currentRound.points}</span>
            </div>
          </button>
          {/* Team card */}
          <div className="rounded-2xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center justify-between mb-4">
              <div><p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Your Team</p><p className="text-lg font-bold text-white">{team?.team_name ?? "—"}</p></div>
              <div className="text-right"><p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mb-0.5">Points</p><p className="text-2xl font-black text-yellow-400">{(team?.points ?? 0).toLocaleString()}</p></div>
            </div>
            <div className="space-y-1.5">
              {members.length > 0 ? members.map(m => (
                <div key={m.id} className="rounded-xl px-3 py-2.5" style={{ background: m.user_id === team?.leader_id ? "rgba(212,160,23,0.08)" : "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-semibold text-white">{m.name}</p><p className="text-xs text-white/40">{m.reg_no} · {m.email}</p></div>
                    {m.user_id === team?.leader_id ? <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-black" style={{ background: "#D4A017" }}>Leader</span> : <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">Member</span>}
                  </div>
                </div>
              )) : <p className="text-xs text-white/30 px-1 pt-1">No teammates added yet. Go to Team tab to add them.</p>}
            </div>
          </div>
        </div>
        {/* Leaderboard */}
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

      {/* Round modal */}
      {roundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && setRoundOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "#0d0d0d", borderColor: `${currentRound.color}50` }}>
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${currentRound.color}, transparent)` }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div><span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: currentRound.color }}>Round {currentRound.number}</span><h3 className="text-2xl font-black text-white mt-0.5">{currentRound.name}</h3></div>
                <button onClick={() => setRoundOpen(false)} className="text-white/40 hover:text-white transition-colors text-xl leading-none ml-4">✕</button>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-5">{currentRound.description}</p>
              <div className="space-y-2">
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Requirements</p>
                {currentRound.requirements.map((r, i) => <div key={i} className="flex items-start gap-2 text-sm text-white/70"><span style={{ color: currentRound.color }}>✓</span>{r}</div>)}
              </div>
              <div className="flex gap-2 mt-5">
                <span className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50">⏱ {currentRound.duration}</span>
                <span className="text-xs px-3 py-1.5 rounded-full font-bold text-black" style={{ background: currentRound.color }}>{currentRound.points}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team section (leader — full control) ─────────────────────────────────────
function MemberField({ label, type, placeholder, value, onChange, minLength }: { label: string; type: string; placeholder: string; value: string; onChange: (v: string) => void; minLength?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-white/50 uppercase tracking-widest">{label}</label>
      <input required type={type} placeholder={placeholder} value={value} minLength={minLength} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/25 bg-white/5 border border-white/10 outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all" />
    </div>
  );
}

function TeamSection({ team, members, onTeamUpdated, onMemberAdded }: { team: Team | null; members: TeamMember[]; onTeamUpdated: () => void; onMemberAdded: () => void }) {
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState(team?.team_name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSaveTeamName(e: React.FormEvent) {
    e.preventDefault();
    if (!team || !newTeamName.trim()) return;
    setNameError(""); setNameLoading(true);
    try {
      const { error: err } = await supabase.from("teams").update({ team_name: newTeamName.trim() }).eq("id", team.id);
      if (err) throw err;
      setEditingName(false); onTeamUpdated();
    } catch (err: unknown) { setNameError(err instanceof Error ? err.message : "Failed to update."); }
    finally { setNameLoading(false); }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;
    setError(""); setLoading(true);
    try {
      const tempClient = createEphemeralClient();
      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      const newUserId = signUpData.user?.id ?? null;

      const { error: insertError } = await supabase.from("team_members").insert({ team_id: team.id, name, reg_no: regNo, email, user_id: newUserId });
      if (insertError) throw insertError;

      setName(""); setRegNo(""); setEmail(""); setPassword("");
      setAdding(false); onMemberAdded();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to add member."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      {/* Team name card */}
      <div className="rounded-2xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
        {editingName ? (
          <form onSubmit={handleSaveTeamName} className="space-y-3">
            <label className="text-[10px] text-white/40 uppercase tracking-widest block">Team Name</label>
            <input autoFocus required type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg text-lg font-bold text-white bg-white/5 border border-yellow-500/40 outline-none focus:ring-1 focus:ring-yellow-500/60 transition-all" />
            {nameError && <p className="text-red-400 text-xs">{nameError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={nameLoading} className="px-5 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50" style={{ background: "#D4A017" }}>{nameLoading ? "Saving…" : "Save"}</button>
              <button type="button" onClick={() => { setEditingName(false); setNewTeamName(team?.team_name ?? ""); }} className="px-5 py-2 rounded-lg text-sm text-white/50 border border-white/10 hover:text-white transition-colors">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Team Name</p><p className="text-2xl font-black text-white">{team?.team_name ?? "—"}</p></div>
            <button onClick={() => { setEditingName(true); setNewTeamName(team?.team_name ?? ""); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/10 hover:text-yellow-400 hover:border-yellow-500/40 transition-all">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit
            </button>
          </div>
        )}
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
            <MemberField label="Password" type="password" placeholder="Min 6 characters" value={password} onChange={setPassword} minLength={6} />
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
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 1000); return () => clearInterval(t); }, []);
  const now = Date.now(); const slot = Math.floor(now / 30000); const left = Math.ceil(((slot + 1) * 30000 - now) / 1000);
  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const qrData = JSON.stringify({ name: meta.full_name ?? "", reg_no: meta.reg_no ?? "", email: user.email ?? "", team_name: team?.team_name ?? "", t: slot });
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 p-8" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="p-4 rounded-2xl" style={{ background: "#ffffff" }}><QRCode value={qrData} size={220} bgColor="#ffffff" fgColor="#080808" /></div>
      <div className="w-full max-w-sm space-y-1.5">
        <div className="flex justify-between text-xs"><span className="text-white/40">QR refreshes in</span><span className="font-mono font-semibold text-yellow-400">{left}s</span></div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}><div className="h-full rounded-full" style={{ width: `${((30 - left) / 30) * 100}%`, background: "#D4A017", transition: "width 1s linear" }} /></div>
      </div>
      <div className="w-full max-w-sm"><InfoRow label="Name" value={meta.full_name ?? "—"} /><InfoRow label="Reg No" value={meta.reg_no ?? "—"} /><InfoRow label="Email" value={user.email ?? "—"} /><InfoRow label="Team" value={team?.team_name ?? "—"} /></div>
      <p className="text-xs text-white/20 text-center">Show this QR to a core team member to mark your attendance.</p>
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

// ── Play Section ─────────────────────────────────────────────────────────────
function PlaySection({ team }: { team: Team | null }) {
  const currentRound = ROUNDS[CURRENT_ROUND_INDEX];
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-5 border" style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.14) 0%, rgba(8,8,8,0.5) 100%)", borderColor: "rgba(212,160,23,0.3)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-1">Now Playing</p>
            <p className="text-2xl font-black text-white">Round {currentRound.number} <span className="text-yellow-400">·</span> {currentRound.name}</p>
            <p className="text-xs text-white/40 mt-1">⏱ {currentRound.duration} &nbsp;·&nbsp; {currentRound.points}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Team Points</p>
            <p className="text-3xl font-black text-yellow-400">{(team?.points ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Rounds */}
      <div className="space-y-4">
        {ROUNDS.map((round, idx) => {
          const isCurrent = idx === CURRENT_ROUND_INDEX;
          const isDone = idx < CURRENT_ROUND_INDEX;
          const isUpcoming = idx > CURRENT_ROUND_INDEX;
          return (
            <div key={round.number} className="rounded-2xl border overflow-hidden transition-all" style={{ borderColor: isCurrent ? `${round.color}60` : isDone ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.08)", background: isCurrent ? `linear-gradient(135deg, ${round.color}18 0%, rgba(8,8,8,0.6) 100%)` : isDone ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.02)", opacity: isUpcoming ? 0.55 : 1 }}>
              {/* Top bar */}
              <div className="h-0.5" style={{ background: isCurrent ? `linear-gradient(90deg, transparent, ${round.color}, transparent)` : isDone ? "linear-gradient(90deg, transparent, #34d399, transparent)" : "transparent" }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full" style={{ background: isCurrent ? `${round.color}30` : isDone ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)", color: isCurrent ? round.color : isDone ? "#34d399" : "rgba(255,255,255,0.3)" }}>{isDone ? "✓ Completed" : isCurrent ? "● Live" : "Upcoming"}</span>
                      <span className="text-[10px] text-white/30">Round {round.number}</span>
                    </div>
                    <p className="text-lg font-black text-white">{round.name}</p>
                    <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{round.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black" style={{ color: round.color }}>{round.points}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{round.duration}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Requirements</p>
                  <div className="grid sm:grid-cols-2 gap-1">{round.requirements.map((r, i) => (<div key={i} className="flex items-start gap-2 text-xs text-white/50"><span style={{ color: round.color }}>✓</span>{r}</div>))}</div>
                </div>
                {isCurrent && (
                  <div className="mt-5 pt-4 border-t border-white/8">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Submission</p>
                    <p className="text-xs text-white/40 mb-3">Submit your GitHub repo link and live demo URL to the core team when ready.</p>
                    <div className="flex gap-2">
                      <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white border border-white/15 hover:border-white/30 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                        GitHub Repo
                      </a>
                      <a href="#" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-black" style={{ background: round.color }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        Submit
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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

  const fetchTeamData = useCallback(async (userId: string) => {
    const { data: teamData } = await supabase.from("teams").select("*").eq("leader_id", userId).single();
    setTeam(teamData ?? null);
    if (teamData) {
      const { data: memberData } = await supabase.from("team_members").select("*").eq("team_id", teamData.id).order("created_at");
      setMembers(memberData ?? []);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/"); return; }
      setUser(user); fetchTeamData(user.id);
    });
  }, [router, fetchTeamData]);

  async function handleLogout() { await supabase.auth.signOut(); router.replace("/"); }

  if (!user) return <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#080808" }}><div className="text-white/40 text-sm animate-pulse">Loading…</div></div>;

  const meta = user.user_metadata as Record<string, string>;
  const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <IconGrid /> },
    { id: "team", label: "Team", icon: <IconUsers /> },
    { id: "attendance", label: "Attendance", icon: <IconScan /> },
    { id: "play", label: "Play", icon: <IconPlay /> },
    { id: "settings", label: "Settings", icon: <IconSettings /> },
  ];

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
              <p className="text-[10px] text-white/30 hidden sm:block">{section === "overview" ? "Your hackathon at a glance" : section === "team" ? "Manage your team members" : section === "attendance" ? "Your attendance QR code" : section === "play" ? "Rounds, requirements & submission" : "Account & security settings"}</p>
            </div>
          </div>
          <div className="hidden sm:block text-xs text-white/30">Cloud-Flush · March 23, 2026</div>
        </header>
        <div className="flex-1 p-5 sm:p-8">
          <div className={`${section === "overview" ? "max-w-6xl" : section === "play" ? "max-w-4xl" : "max-w-3xl"} mx-auto lg:mx-0 w-full`}>
            {section === "overview" && <Overview user={user} team={team} members={members} />}
            {section === "team" && <TeamSection team={team} members={members} onTeamUpdated={() => fetchTeamData(user.id)} onMemberAdded={() => fetchTeamData(user.id)} />}
            {section === "attendance" && <AttendanceSection user={user} team={team} />}
            {section === "play" && <PlaySection team={team} />}
            {section === "settings" && <SettingsSection user={user} />}
          </div>
        </div>
      </main>
      <style>{`@keyframes twinkle { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.6; } } @media (min-width: 1024px) { main { margin-left: 240px !important; } }`}</style>
    </div>
  );
}
