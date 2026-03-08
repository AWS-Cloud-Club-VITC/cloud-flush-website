"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type AdminNav = "overview" | "teams" | "users" | "access" | "scanner" | "database" | "settings";
type AccessTab = "core" | "admin" | "judge";
type TeamRow = { id: string; team_name: string; leader_id: string; points: number; is_vit_chennai: boolean; created_at: string };
type RoleUser = { id: string; user_id: string; email: string | null; name: string | null; created_at: string };
type Stats = { teams: number; members: number; attendance: number; registrations: number };
type MemberRow = { id: string; name: string; email: string; reg_no: string; user_id: string | null; team_id: string; teams: { team_name: string; leader_id: string } | null };
type ExportRow = { name: string; team_name: string; email: string; reg_no: string; role: string };
type ScanEntry = { name: string; reg_no: string; team_name: string; time: string; status: "ok" | "dup" | "err" };
type DbTab = "teams" | "members" | "attendance" | "registrations";
const DB_TABS: DbTab[] = ["teams", "members", "attendance", "registrations"];
const PAGE_SIZE = 50;

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
function IconQR() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h.01M14 17h3M17 14v3M20 20h-3v-3"/></svg>; }
function IconDatabase() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>; }

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

// ── QR Scanner ────────────────────────────────────────────────────────────────
function ScannerSection({ user }: { user: User }) {
  const [sessions, setSessions] = useState<{ id: number; name: string; is_enabled: boolean }[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);
  const [feedback, setFeedback] = useState<{ type: ScanEntry["status"]; text: string } | null>(null);
  const selectedSessionRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const processingRef = useRef(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { selectedSessionRef.current = selectedSession; }, [selectedSession]);

  useEffect(() => {
    supabase.from("sessions").select("id, name, is_enabled").order("slot_order").then(({ data }) => {
      setSessions(data ?? []);
    });
  }, []);

  async function handleScanResult(decodedText: string) {
    if (processingRef.current) return;
    processingRef.current = true;
    setTimeout(() => { processingRef.current = false; }, 2500);
    let parsed: { name?: string; reg_no?: string; email?: string; team_name?: string };
    try { parsed = JSON.parse(decodedText); } catch { processingRef.current = false; return; }
    if (!parsed.reg_no) { processingRef.current = false; return; }
    const { error } = await supabase.from("attendance").insert({
      student_name: parsed.name ?? "",
      reg_no: parsed.reg_no,
      email: parsed.email ?? "",
      team_name: parsed.team_name ?? "",
      session_id: selectedSessionRef.current ?? null,
      scanned_by: user.id,
    });
    const statusVal: ScanEntry["status"] = error ? (error.code === "23505" ? "dup" : "err") : "ok";
    const entry: ScanEntry = {
      name: parsed.name ?? "Unknown",
      reg_no: parsed.reg_no,
      team_name: parsed.team_name ?? "—",
      time: new Date().toLocaleTimeString(),
      status: statusVal,
    };
    const fbText = statusVal === "ok"
      ? `✓ ${entry.name} (${entry.reg_no}) marked present`
      : statusVal === "dup"
      ? `⚠ Already scanned: ${entry.name} (${entry.reg_no})`
      : `✕ ${error!.message}`;
    setFeedback({ type: statusVal, text: fbText });
    setRecentScans(prev => [entry, ...prev].slice(0, 30));
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 4000);
    processingRef.current = false;
  }

  useEffect(() => {
    if (!scanning) {
      if (scannerRef.current) { scannerRef.current.clear().catch(() => {}); scannerRef.current = null; }
      return;
    }
    let mounted = true;
    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (!mounted || scannerRef.current) return;
      const scanner = new Html5QrcodeScanner(
        "qr-reader-admin",
        { fps: 10, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true },
        false
      );
      scanner.render(handleScanResult, () => {});
      scannerRef.current = scanner;
    });
    return () => {
      mounted = false;
      if (scannerRef.current) { scannerRef.current.clear().catch(() => {}); scannerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const statusColor = (s: ScanEntry["status"]) => s === "ok" ? T.green : s === "dup" ? T.yellow : T.red;

  return (
    <div className="space-y-5 max-w-2xl">
      <Card>
        <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: T.muted }}>Session (optional)</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedSession(null)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={selectedSession === null
              ? { background: T.blue, color: "#0d1117" }
              : { background: "transparent", color: T.muted, border: `1px solid ${T.border}` }}>
            No Session
          </button>
          {sessions.map(s => (
            <button key={s.id} onClick={() => setSelectedSession(s.id)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={selectedSession === s.id
                ? { background: T.blue, color: "#0d1117" }
                : { background: "transparent", color: s.is_enabled ? T.text : T.muted, border: `1px solid ${T.border}` }}>
              {s.name}{!s.is_enabled ? " (off)" : ""}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ color: T.text }}>Camera Scanner</p>
          <button onClick={() => setScanning(v => !v)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: scanning ? T.red : T.green, color: "#fff" }}>
            {scanning ? "Stop Scanning" : "Start Scanning"}
          </button>
        </div>
        {feedback && (
          <div className="mb-4 px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{
              background: `${statusColor(feedback.type)}18`,
              color: statusColor(feedback.type),
              border: `1px solid ${statusColor(feedback.type)}40`,
            }}>
            {feedback.text}
          </div>
        )}
        <div id="qr-reader-admin" style={{ display: scanning ? "block" : "none" }} />
        {!scanning && (
          <div className="flex flex-col items-center justify-center py-14 rounded-lg gap-3"
            style={{ background: T.bg, border: `2px dashed ${T.border}` }}>
            <div style={{ color: T.muted }}><IconQR /></div>
            <p className="text-sm" style={{ color: T.muted }}>Click "Start Scanning" to open camera</p>
            {selectedSession !== null && (
              <p className="text-xs" style={{ color: T.blue }}>
                Session: {sessions.find(s => s.id === selectedSession)?.name}
              </p>
            )}
          </div>
        )}
      </Card>

      {recentScans.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: T.muted }}>
              Recent Scans ({recentScans.length})
            </p>
            <button onClick={() => setRecentScans([])} className="text-xs hover:opacity-70" style={{ color: T.muted }}>Clear</button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {recentScans.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: T.bg, border: `1px solid ${T.border}30` }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ background: `${statusColor(s.status)}18`, color: statusColor(s.status), border: `1px solid ${statusColor(s.status)}40` }}>
                    {s.status}
                  </span>
                  <div>
                    <span className="text-sm font-medium" style={{ color: T.text }}>{s.name}</span>
                    <span className="ml-2 text-xs font-mono" style={{ color: T.muted }}>{s.reg_no}</span>
                  </div>
                </div>
                <div className="text-right text-xs" style={{ color: T.muted }}>
                  <div>{s.team_name}</div>
                  <div>{s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Database Browser ──────────────────────────────────────────────────────────
function DatabaseSection() {
  const [tab, setTab] = useState<DbTab>("teams");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (t: DbTab, p: number) => {
    setLoading(true);
    const from = p * PAGE_SIZE; const to = from + PAGE_SIZE - 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = []; let count = 0;
    if (t === "teams") {
      const r = await supabase.from("teams").select("id,team_name,points,is_vit_chennai,created_at", { count: "exact" }).order("points", { ascending: false }).range(from, to);
      data = r.data ?? []; count = r.count ?? 0;
    } else if (t === "members") {
      const r = await supabase.from("team_members").select("id,name,email,reg_no,team_id,created_at", { count: "exact" }).order("created_at").range(from, to);
      data = r.data ?? []; count = r.count ?? 0;
    } else if (t === "attendance") {
      const r = await supabase.from("attendance").select("id,student_name,reg_no,email,team_name,session_id,scanned_at", { count: "exact" }).order("scanned_at", { ascending: false }).range(from, to);
      data = r.data ?? []; count = r.count ?? 0;
    } else {
      const r = await supabase.from("registrations").select("id,name,reg_no,email,team_name,uploaded_at", { count: "exact" }).order("name").range(from, to);
      data = r.data ?? []; count = r.count ?? 0;
    }
    setRows(data); setTotal(count); setLoading(false);
  }, []);

  useEffect(() => { setPage(0); load(tab, 0); }, [tab, load]);

  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function fmtCell(val: unknown): React.ReactNode {
    if (val === null || val === undefined) return <span style={{ color: T.muted }}>—</span>;
    if (typeof val === "boolean") return <span style={{ color: val ? T.green : T.muted }}>{val ? "Yes" : "No"}</span>;
    const s = String(val);
    if (s.length === 36 && s.includes("-")) return <span style={{ color: T.muted }}>{s.slice(0, 8)}…</span>;
    if (s.length > 44) return s.slice(0, 44) + "…";
    return s;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {DB_TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
              style={tab === t ? { background: T.blue, color: "#0d1117" } : { background: "transparent", color: T.muted, border: `1px solid ${T.border}` }}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: T.muted }}>{total} rows</span>
          <button onClick={() => load(tab, page)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ background: T.card, color: T.text, border: `1px solid ${T.border}` }}>
            ↻ Refresh
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-sm animate-pulse py-8 text-center" style={{ color: T.muted }}>Loading…</p>
      ) : (
        <>
          <div className="rounded-lg border overflow-auto" style={{ borderColor: T.border, maxHeight: 520 }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: T.card }}>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {cols.map(c => (
                    <th key={c} className="px-3 py-2 text-left uppercase tracking-widest font-medium whitespace-nowrap"
                      style={{ color: T.muted }}>{c.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}20`, background: i % 2 === 0 ? T.bg : "transparent" }}>
                    {cols.map(c => (
                      <td key={c} className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: T.text }}>
                        {fmtCell(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="px-4 py-8 text-center text-sm" style={{ color: T.muted }}>No data.</p>}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-3 justify-end">
              <button disabled={page === 0} onClick={() => { const p = page - 1; setPage(p); load(tab, p); }}
                className="px-3 py-1 rounded text-xs disabled:opacity-40 transition-opacity"
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}` }}>
                ← Prev
              </button>
              <span className="text-xs" style={{ color: T.muted }}>Page {page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => { const p = page + 1; setPage(p); load(tab, p); }}
                className="px-3 py-1 rounded text-xs disabled:opacity-40 transition-opacity"
                style={{ background: T.card, color: T.text, border: `1px solid ${T.border}` }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
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
    { id: "scanner" as AdminNav, label: "Scanner", icon: <IconQR /> },
    { id: "database" as AdminNav, label: "Database", icon: <IconDatabase /> },
    { id: "settings" as AdminNav, label: "Settings", icon: <IconSettings /> },
  ];

  const subtitles: Record<AdminNav, string> = {
    overview: "Stats & top teams",
    teams: "View and edit all teams",
    users: "All participants — export to CSV / Excel",
    access: "Manage core / admin / judge users",
    scanner: "Scan participant QR codes for attendance",
    database: "Browse raw table data",
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
          {nav === "scanner" && <ScannerSection user={user} />}
          {nav === "database" && <DatabaseSection />}
          {nav === "settings" && <SettingsSection user={user} />}
        </div>
      </main>

      <style>{`@media (min-width: 1024px) { main { margin-left: 220px !important; } }`}</style>
    </div>
  );
}
