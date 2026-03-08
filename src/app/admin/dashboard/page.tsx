"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type AdminNav = "overview" | "teams" | "users" | "access" | "database" | "settings";
type AccessTab = "core" | "admin" | "judge";
type TeamRow = { id: string; team_name: string; leader_id: string; points: number; is_vit_chennai: boolean; created_at: string };
type RoleUser = { id: string; user_id: string; email: string | null; name: string | null; created_at: string };
type Stats = { teams: number; members: number; attendance: number; registrations: number };
type MemberRow = { id: string; name: string; email: string; reg_no: string; user_id: string | null; team_id: string; teams: { team_name: string; leader_id: string } | null };
type ExportRow = { name: string; team_name: string; email: string; reg_no: string; role: string };
type Registration = { id: string; name: string; reg_no: string; email: string; team_name: string };

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
function IconUpload() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconRefresh() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>; }

// ── Theme ─────────────────────────────────────────────────────────────────────
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

  const load = useCallback(async () => {
    const results = await Promise.all(
      (["core", "admin", "judge"] as AccessTab[]).map(t => supabase.from(tables[t]).select("id, user_id, email, name, created_at").order("created_at"))
    );
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
      setAddEmail(""); setAddName(""); setMsg({ type: "ok", text: `Added to ${tab}.` }); load();
    } catch (err: unknown) { setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed." }); }
    finally { setAdding(false); }
  }

  async function handleRemove(id: string) {
    await supabase.from(tables[tab]).delete().eq("id", id);
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
            {t} ({users[t].length})
          </button>
        ))}
      </div>

      {/* Add form */}
      <Card>
        <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: tabColors[tab] }}>Add {tab} user</p>
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
        {users[tab].length === 0 && <p className="text-sm py-4 text-center" style={{ color: T.muted }}>No {tab} users.</p>}
        {users[tab].map(u => (
          <div key={u.id} className="flex items-center justify-between rounded-lg px-3 py-2 border" style={{ background: T.bg, borderColor: T.border }}>
            <div>
              <p className="text-sm font-medium" style={{ color: T.text }}>{u.name ?? <span style={{ color: T.muted }}>—</span>}</p>
              <p className="text-xs" style={{ color: T.muted }}>{u.email ?? u.user_id}</p>
            </div>
            <button onClick={() => handleRemove(u.id)} className="p-1.5 rounded hover:opacity-80 transition-opacity" style={{ color: T.red }}>
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

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("team_members")
        .select("id, name, email, reg_no, user_id, team_id, teams(team_name, leader_id)")
        .order("team_id");
      if (!data) { setLoading(false); return; }
      const members = data as unknown as MemberRow[];
      const byTeam = new Map<string, { team_name: string; leader_id: string; members: MemberRow[] }>();
      for (const m of members) {
        const tname = m.teams?.team_name ?? "Unknown";
        const lid = m.teams?.leader_id ?? "";
        if (!byTeam.has(m.team_id)) byTeam.set(m.team_id, { team_name: tname, leader_id: lid, members: [] });
        byTeam.get(m.team_id)!.members.push(m);
      }
      const exportRows: ExportRow[] = [];
      for (const { team_name, leader_id, members: tm } of byTeam.values()) {
        const sorted = [...tm].sort((a, b) => {
          if (a.user_id === leader_id) return -1;
          if (b.user_id === leader_id) return 1;
          return 0;
        });
        for (const m of sorted) {
          exportRows.push({ name: m.name, team_name, email: m.email, reg_no: m.reg_no, role: m.user_id === leader_id ? "Leader" : "Member" });
        }
      }
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
  const [preview, setPreview] = useState<Omit<Registration, "id">[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parseError, setParseError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadOk, setUploadOk] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadRegistrations = useCallback(async () => {
    const { data } = await supabase.from("registrations").select("*").order("name");
    setRegistrations(data ?? []);
  }, []);

  useEffect(() => { loadRegistrations(); }, [loadRegistrations]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(""); setUploadError(""); setUploadOk("");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer());
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      if (rows.length === 0) { setParseError("File is empty or couldn't be read."); return; }
      const get = (row: Record<string, unknown>, ...matches: string[]) => {
        const key = Object.keys(row).find(k => matches.some(m => k.toLowerCase().includes(m)));
        return key ? String(row[key]).trim() : "";
      };
      const parsed = rows
        .map(row => ({
          name: get(row, "name"),
          reg_no: get(row, "reg", "roll", "id"),
          email: get(row, "email", "mail"),
          team_name: get(row, "team"),
        }))
        .filter(r => r.name && r.reg_no);
      if (parsed.length === 0) {
        setParseError(`No valid rows. Detected columns: ${Object.keys(rows[0]).join(", ")}. Need "name" and "reg" (or "roll").`);
        return;
      }
      setPreview(parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to read file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!preview.length) return;
    setUploading(true); setUploadError(""); setUploadOk("");
    const { error } = await supabase.from("registrations").upsert(preview, { onConflict: "reg_no" });
    if (error) { setUploadError(error.message); }
    else { setUploadOk(`${preview.length} registrations saved.`); setPreview([]); loadRegistrations(); }
    setUploading(false);
  }

  async function handleClearAll() {
    if (!confirm(`Delete all ${registrations.length} registrations? This cannot be undone.`)) return;
    await supabase.from("registrations").delete().neq("reg_no", "");
    loadRegistrations();
  }

  return (
    <div className="space-y-4">
      {/* Upload card */}
      <div className="rounded-lg border" style={{ borderColor: T.border, background: T.card }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          <h2 className="font-semibold text-sm" style={{ color: T.text }}>Upload Registrations</h2>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>
            Excel or CSV with columns: <code style={{ color: T.text }}>Name</code>, <code style={{ color: T.text }}>Reg No</code>, <code style={{ color: T.text }}>Email</code>, <code style={{ color: T.text }}>Team</code>
          </p>
        </div>
        <div className="p-4 space-y-3">
          <label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-dashed py-8 transition-colors"
            style={{ borderColor: T.border }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = T.blue)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
            <div style={{ color: T.muted }}><IconUpload /></div>
            <span className="text-sm font-medium" style={{ color: T.muted }}>Click to choose file</span>
            <span className="text-xs" style={{ color: "#484f58" }}>.xlsx · .xls · .csv</span>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          </label>

          {parseError && (
            <div className="px-4 py-2.5 rounded-lg text-sm border" style={{ background: "rgba(218,54,51,0.1)", borderColor: T.red, color: "#f85149" }}>
              ⚠ {parseError}
            </div>
          )}
          {uploadOk && (
            <div className="px-4 py-2.5 rounded-lg text-sm border" style={{ background: "rgba(35,134,54,0.1)", borderColor: T.green, color: "#56d364" }}>
              ✓ {uploadOk}
            </div>
          )}
          {uploadError && (
            <div className="px-4 py-2.5 rounded-lg text-sm border" style={{ background: "rgba(218,54,51,0.1)", borderColor: T.red, color: "#f85149" }}>
              ✗ Upload failed: {uploadError}
            </div>
          )}

          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm" style={{ color: T.muted }}>{preview.length} rows parsed — review before uploading</p>
                <div className="flex gap-2">
                  <button onClick={() => setPreview([])} className="px-3 py-1.5 rounded-md text-xs"
                    style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>Cancel</button>
                  <button onClick={handleUpload} disabled={uploading}
                    className="px-4 py-1.5 rounded-md text-xs font-semibold text-white disabled:opacity-60"
                    style={{ background: T.green }}>
                    {uploading ? "Uploading…" : `Upload ${preview.length} rows`}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border" style={{ maxHeight: "220px", borderColor: T.border }}>
                <table className="w-full text-xs" style={{ minWidth: "400px" }}>
                  <thead className="sticky top-0" style={{ background: T.card }}>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {["Name", "Reg No", "Email", "Team"].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-semibold uppercase tracking-wider" style={{ color: T.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 15).map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}30` }}>
                        <td className="px-3 py-2" style={{ color: T.text }}>{r.name}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: T.blue }}>{r.reg_no}</td>
                        <td className="px-3 py-2" style={{ color: T.muted }}>{r.email}</td>
                        <td className="px-3 py-2" style={{ color: T.muted }}>{r.team_name}</td>
                      </tr>
                    ))}
                    {preview.length > 15 && (
                      <tr><td colSpan={4} className="px-3 py-2 text-center" style={{ color: T.muted }}>+{preview.length - 15} more rows</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registrations list */}
      <div className="rounded-lg border" style={{ borderColor: T.border }}>
        <div className="px-4 py-3 flex flex-wrap gap-2 items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: T.text }}>Registered Students</h2>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>{registrations.length} total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadRegistrations} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
              style={{ background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>
              <IconRefresh /> Refresh
            </button>
            {registrations.length > 0 && (
              <button onClick={handleClearAll} className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: "rgba(218,54,51,0.12)", color: "#f85149", border: "1px solid rgba(218,54,51,0.3)" }}>
                Clear All
              </button>
            )}
          </div>
        </div>
        {registrations.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: T.muted }}>No registrations yet. Upload above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: "450px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["#", "Name", "Reg No", "Email", "Team"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: T.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < registrations.length - 1 ? `1px solid ${T.border}30` : "none" }}>
                    <td className="px-4 py-2.5 text-xs" style={{ color: T.muted }}>{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>{r.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: T.blue }}>{r.reg_no}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: T.muted }}>{r.email || "—"}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: T.muted }}>{r.team_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/admin"); return; }
      const { data: check } = await supabase.from("admin_users").select("id").maybeSingle();
      if (!check) { await supabase.auth.signOut(); router.replace("/admin"); return; }
      setUser(user); loadData();
    });
  }, [router, loadData]);

  async function handleLogout() { await supabase.auth.signOut(); router.replace("/admin"); }

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
    { id: "settings" as AdminNav, label: "Settings", icon: <IconSettings /> },
  ];

  const subtitles: Record<AdminNav, string> = {
    overview: "Stats & top teams",
    teams: "View and edit all teams",
    users: "All participants — export to CSV / Excel",
    access: "Manage core / admin / judge users",
    database: "Upload and manage participant registrations",
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
          <span className="text-[10px] font-mono hidden sm:block" style={{ color: T.muted }}>Cloud-Flush Admin</span>
        </header>

        <div className="flex-1 p-5 sm:p-7 max-w-5xl w-full">
          {nav === "overview" && <Overview stats={stats} teams={teams} />}
          {nav === "teams" && <TeamsSection teams={teams} onRefresh={loadData} />}
          {nav === "users" && <UsersSection />}
          {nav === "access" && <AccessSection />}
          {nav === "database" && <DatabaseSection />}
          {nav === "settings" && <SettingsSection user={user} />}
        </div>
      </main>

      <style>{`@media (min-width: 1024px) { main { margin-left: 220px !important; } }`}</style>
    </div>
  );
}
