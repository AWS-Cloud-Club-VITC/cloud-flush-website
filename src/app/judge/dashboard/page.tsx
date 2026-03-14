"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { judgeSupabase as supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type JudgeNav = "scoring" | "leaderboard" | "settings";
type TeamRow = { id: string; team_name: string; points: number; is_vit_chennai: boolean };

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconStar() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconList() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function IconSettings() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconLogout() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function IconMenu() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0d1117", card: "#161b22", border: "#30363d",
  text: "#e6edf3", muted: "#8b949e", yellow: "#d29922",
  green: "#238636", red: "#da3633", blue: "#58a6ff",
};

// ── Scoring ───────────────────────────────────────────────────────────────────
function ScoringSection({ teams, onRefresh }: { teams: TeamRow[]; onRefresh: () => void }) {
  const [saving, setSaving] = useState<string | null>(null);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [msgs, setMsgs] = useState<Record<string, { type: "ok" | "err"; text: string }>>({});

  async function applyDelta(team: TeamRow, delta: number) {
    setSaving(team.id);
    const newPts = Math.max(0, team.points + delta);
    const { error } = await supabase.from("teams").update({ points: newPts }).eq("id", team.id);
    setSaving(null);
    setMsgs(m => ({ ...m, [team.id]: error ? { type: "err", text: error.message } : { type: "ok", text: `${delta > 0 ? "+" : ""}${delta} → ${newPts} pts` } }));
    onRefresh();
    setTimeout(() => setMsgs(m => { const n = { ...m }; delete n[team.id]; return n; }), 2500);
  }

  async function applyCustom(team: TeamRow) {
    const val = parseInt(custom[team.id] ?? "");
    if (isNaN(val)) return;
    setSaving(team.id);
    const newPts = Math.max(0, team.points + val);
    const { error } = await supabase.from("teams").update({ points: newPts }).eq("id", team.id);
    setSaving(null);
    setCustom(c => { const n = { ...c }; delete n[team.id]; return n; });
    setMsgs(m => ({ ...m, [team.id]: error ? { type: "err", text: error.message } : { type: "ok", text: `${val > 0 ? "+" : ""}${val} → ${newPts} pts` } }));
    onRefresh();
    setTimeout(() => setMsgs(m => { const n = { ...m }; delete n[team.id]; return n; }), 2500);
  }

  const sorted = [...teams].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest" style={{ color: T.muted }}>
        Click quick buttons or enter a custom ± value and press Enter to adjust points
      </p>
      {sorted.map(team => (
        <div key={team.id} className="rounded-lg border p-4" style={{ background: T.card, borderColor: T.border }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: T.text }}>{team.team_name}</p>
                {team.is_vit_chennai && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1f6feb20", color: T.blue, border: `1px solid ${T.blue}30` }}>VIT-C</span>}
              </div>
              <p className="text-lg font-black mt-0.5" style={{ color: T.yellow }}>{team.points.toLocaleString()} pts</p>
              {msgs[team.id] && (
                <p className="text-xs mt-0.5" style={{ color: msgs[team.id].type === "ok" ? T.green : T.red }}>
                  {msgs[team.id].text}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Quick deltas */}
              {[+100, +50, +25, -25, -50].map(d => (
                <button key={d} onClick={() => applyDelta(team, d)}
                  disabled={saving === team.id}
                  className="px-2.5 py-1 rounded text-xs font-mono font-semibold disabled:opacity-50 transition-opacity"
                  style={d > 0
                    ? { background: "#23863620", color: T.green, border: `1px solid ${T.green}40` }
                    : { background: "#da363320", color: T.red, border: `1px solid ${T.red}40` }}>
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
              {/* Custom */}
              <input
                type="number"
                placeholder="±custom"
                value={custom[team.id] ?? ""}
                onChange={e => setCustom(c => ({ ...c, [team.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && applyCustom(team)}
                className="w-24 px-2 py-1 rounded text-xs font-mono outline-none"
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
                onFocus={e => (e.target.style.borderColor = T.yellow)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              />
              <button onClick={() => applyCustom(team)} disabled={saving === team.id || !custom[team.id]}
                className="px-2.5 py-1 rounded text-xs font-semibold text-black disabled:opacity-40"
                style={{ background: T.yellow }}>
                {saving === team.id ? "…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      ))}
      {sorted.length === 0 && <p className="text-sm py-8 text-center" style={{ color: T.muted }}>No teams yet.</p>}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardSection({ teams }: { teams: TeamRow[] }) {
  const sorted = [...teams].sort((a, b) => b.points - a.points);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: T.muted }}>Teams ranked by total points</p>
      {sorted.map((t, i) => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border" style={{ background: i < 3 ? `${T.yellow}08` : T.card, borderColor: i < 3 ? `${T.yellow}30` : T.border }}>
          <div className="w-8 text-sm font-bold shrink-0 text-center">
            {medals[i] ?? <span style={{ color: T.muted }}>#{i + 1}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate" style={{ color: T.text }}>{t.team_name}</p>
              {t.is_vit_chennai && <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: "#1f6feb20", color: T.blue, border: `1px solid ${T.blue}30` }}>VIT-C</span>}
            </div>
          </div>
          <p className="text-base font-black shrink-0" style={{ color: T.yellow }}>{t.points.toLocaleString()}</p>
        </div>
      ))}
      {sorted.length === 0 && <p className="text-sm py-8 text-center" style={{ color: T.muted }}>No teams yet.</p>}
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

  const inputCls = "w-full px-3 py-1.5 rounded-md text-sm outline-none transition-colors";
  const inputStyle = { background: T.bg, border: `1px solid ${T.border}`, color: T.text };

  return (
    <div className="space-y-4 max-w-sm">
      <div className="rounded-lg border p-4" style={{ background: T.card, borderColor: T.border }}>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Change Password</p>
        <form onSubmit={handlePw} className="space-y-3">
          {[["New Password", pw, setPw], ["Confirm Password", confirm, setConfirm]].map(([label, val, setter]) => (
            <div key={label as string} className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>{label as string}</label>
              <input required type="password" value={val as string} minLength={6}
                onChange={e => (setter as (v: string) => void)(e.target.value)}
                className={inputCls} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = T.yellow)}
                onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
          ))}
          {msg && <p className="text-xs" style={{ color: msg.type === "ok" ? T.green : T.red }}>{msg.text}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2 rounded-md text-sm font-semibold disabled:opacity-60"
            style={{ background: T.yellow, color: "#0d1117" }}>
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
      <div className="rounded-lg border p-4" style={{ background: T.card, borderColor: T.border }}>
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Account Info</p>
        {[["Email", user.email ?? "—"], ["Role", "Judge"]].map(([l, v]) => (
          <div key={l} className="flex justify-between py-1.5 border-b text-xs" style={{ borderColor: T.border + "40" }}>
            <span style={{ color: T.muted }}>{l}</span>
            <span style={{ color: T.text }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Judge Dashboard ───────────────────────────────────────────────────────────
export default function JudgeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [nav, setNav] = useState<JudgeNav>("scoring");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState<TeamRow[]>([]);

  const loadTeams = useCallback(async () => {
    const { data } = await supabase.from("teams").select("id, team_name, points, is_vit_chennai").order("points", { ascending: false });
    setTeams((data ?? []) as TeamRow[]);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/judge"); return; }
      const { data: check } = await supabase.from("judge_users").select("id").eq("user_id", user.id).maybeSingle();
      if (!check) { await supabase.auth.signOut(); router.replace("/judge"); return; }
      setUser(user); loadTeams();
    });
  }, [router, loadTeams]);

  async function handleLogout() { await supabase.auth.signOut(); router.replace("/judge"); }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
      <p className="text-sm animate-pulse" style={{ color: T.muted }}>Loading…</p>
    </div>
  );

  const navItems = [
    { id: "scoring" as JudgeNav, label: "Scoring", icon: <IconStar /> },
    { id: "leaderboard" as JudgeNav, label: "Leaderboard", icon: <IconList /> },
    { id: "settings" as JudgeNav, label: "Settings", icon: <IconSettings /> },
  ];

  const subtitles: Record<JudgeNav, string> = {
    scoring: "Adjust team points",
    leaderboard: "Rankings by total points",
    settings: "Account & password",
  };

  return (
    <div className="min-h-screen flex" style={{ background: T.bg, color: T.text }}>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ width: 220, background: T.card, borderColor: T.border }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: T.border }}>
          <p className="font-bold text-sm tracking-widest" style={{ fontFamily: "monospace" }}>CLOUD-FLUSH</p>
          <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Judge Portal</p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setNav(item.id); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all text-left"
              style={nav === item.id ? { background: "#d2992220", color: T.yellow } : { color: T.muted }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="px-2 pb-4 border-t pt-3" style={{ borderColor: T.border }}>
          <div className="px-3 py-2 rounded-md mb-2" style={{ background: T.bg }}>
            <p className="text-xs font-medium truncate" style={{ color: T.text }}>{user.email}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: "#d2992220", color: T.yellow, border: `1px solid ${T.yellow}30` }}>JUDGE</span>
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
          <span className="text-[10px] font-mono hidden sm:block" style={{ color: T.muted }}>Cloud-Flush Judge</span>
        </header>

        <div className="flex-1 p-5 sm:p-7 max-w-3xl w-full">
          {nav === "scoring" && <ScoringSection teams={teams} onRefresh={loadTeams} />}
          {nav === "leaderboard" && <LeaderboardSection teams={teams} />}
          {nav === "settings" && <SettingsSection user={user} />}
        </div>
      </main>

      <style>{`@media (min-width: 1024px) { main { margin-left: 220px !important; } }`}</style>
    </div>
  );
}
