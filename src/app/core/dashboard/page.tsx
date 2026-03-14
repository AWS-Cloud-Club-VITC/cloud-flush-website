"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { coordinatorSupabase as supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const QRScannerWidget = dynamic(() => import("@/components/QRScannerWidget"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-xl flex items-center justify-center text-sm"
      style={{ minHeight: "340px", background: "#0d1117", color: "#8b949e" }}>
      Initializing camera...
    </div>
  ),
});

// --- Types ---
type CoreNav = "attendance" | "database" | "settings";
type Session = { id: number; name: string; is_enabled: boolean; slot_order: number };
type AttendanceRow = { id: string; student_name: string; reg_no: string; email: string; team_name: string; session_id: number; scanned_at: string };
type Registration = { id: string; name: string; reg_no: string; email: string; team_name: string };
type ScanResult =
  | { type: "success"; name: string }
  | { type: "duplicate"; name: string }
  | { type: "expired" }
  | { type: "error"; message: string };

// --- Utilities ---
function parseQR(raw: string): { name: string; reg_no: string; email: string; team_name: string } | null {
  try {
    const d = JSON.parse(raw);
    const t = Math.floor(Date.now() / 30000);
    if (Math.abs(d.t - t) <= 1 && d.name && d.reg_no) return d;
    return null;
  } catch { return null; }
}
function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

// --- Icons ---
function IconScan() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>;
}
function IconDatabase() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
}
function IconSettings() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}
function IconLogout() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function IconDownload() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconUpload() {
  return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
function IconRefresh() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
}
function IconMenu() {
  return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function IconPlus() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconTrash() { return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function IconEdit() { return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }

// --- ScanResult Badge ---
function ScanBadge({ result }: { result: ScanResult }) {
  const cfg = {
    success: { bg: "rgba(35,134,54,0.15)", border: "#238636", color: "#56d364", msg: `Marked present: ${(result as {name:string}).name}` },
    duplicate: { bg: "rgba(158,106,3,0.15)", border: "#9e6a03", color: "#d29922", msg: `Already marked: ${(result as {name:string}).name}` },
    expired: { bg: "rgba(218,54,51,0.15)", border: "#da3633", color: "#f85149", msg: "QR expired — ask student to refresh their code." },
    error: { bg: "rgba(218,54,51,0.15)", border: "#da3633", color: "#f85149", msg: `Error: ${(result as {message:string}).message}` },
  }[result.type];
  return (
    <div className="px-4 py-2.5 rounded-lg text-sm border" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
      {cfg.msg}
    </div>
  );
}

// ============================================================
// ATTENDANCE SECTION
// ============================================================
function AttendanceSection({ user, sessions, onOpenSettings }: { user: User; sessions: Session[]; onOpenSettings: () => void }) {
  const enabledSessions = useMemo(
    () => sessions.filter(s => s.is_enabled).sort((a, b) => a.slot_order - b.slot_order),
    [sessions]
  );
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const lastScanRef = useRef<{ text: string; time: number } | null>(null);

  const loadData = useCallback(async () => {
    const [{ data: regs }, { data: att }] = await Promise.all([
      supabase.from("registrations").select("*").order("name"),
      supabase.from("attendance").select("*"),
    ]);
    setRegistrations(regs ?? []);
    setAttendance(att ?? []);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-select session
  useEffect(() => {
    setActiveSessionId(prev => {
      if (prev !== null && enabledSessions.some(s => s.id === prev)) return prev;
      return enabledSessions[0]?.id ?? null;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledSessions.map(s => s.id).join(",")]);

  async function handleScan(text: string) {
    if (processing || !activeSessionId) return;
    const now = Date.now();
    if (lastScanRef.current?.text === text && now - lastScanRef.current.time < 5000) return;
    lastScanRef.current = { text, time: now };
    setProcessing(true);
    const qr = parseQR(text);
    if (!qr) { setScanResult({ type: "expired" }); setProcessing(false); return; }
    const { error } = await supabase.from("attendance").insert({
      student_name: qr.name, reg_no: qr.reg_no, email: qr.email,
      team_name: qr.team_name, session_id: activeSessionId, scanned_by: user.id,
    });
    if (error) {
      setScanResult(error.code === "23505" ? { type: "duplicate", name: qr.name } : { type: "error", message: error.message });
    } else {
      setScanResult({ type: "success", name: qr.name });
      loadData();
    }
    setProcessing(false);
  }

  async function handleExport(format: "xlsx" | "csv") {
    const XLSX = await import("xlsx");
    const headers = ["Name", "Reg No", "Email ID", ...enabledSessions.map(s => s.name)];
    const rows = registrations.map(r => [
      r.name, r.reg_no, r.email,
      ...enabledSessions.map(s => attendance.some(a => a.reg_no === r.reg_no && a.session_id === s.id) ? "Present" : "Absent"),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    // Column widths
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance.${format}`, format === "csv" ? { bookType: "csv" } : {});
  }

  const activeSession = enabledSessions.find(s => s.id === activeSessionId);

  return (
    <div className="space-y-4">
      {/* Session tabs */}
      {enabledSessions.length === 0 ? (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "#21262d", color: "#8b949e" }}>
          No sessions enabled. Go to {" "}
          <button
            type="button"
            onClick={onOpenSettings}
            className="font-semibold text-white underline underline-offset-2"
          >
            Settings
          </button>{" "}
          to enable sessions first.
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs mr-1" style={{ color: "#8b949e" }}>Scan for:</span>
          {enabledSessions.map(s => (
            <button key={s.id} onClick={() => setActiveSessionId(s.id)}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-white transition-all"
              style={{ background: activeSessionId === s.id ? "#1f6feb" : "#21262d" }}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Scanner card */}
      <div className="rounded-lg border" style={{ borderColor: "#30363d", background: "#161b22" }}>
        <div className="px-4 py-3 flex flex-wrap gap-2 items-center justify-between" style={{ borderBottom: "1px solid #30363d" }}>
          <h2 className="font-semibold text-sm text-white">
            QR Scanner {activeSession ? `— ${activeSession.name}` : ""}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleExport("xlsx")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
              style={{ background: "#21262d" }}>
              <IconDownload /> Excel
            </button>
            <button onClick={() => handleExport("csv")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
              style={{ background: "#21262d" }}>
              <IconDownload /> CSV
            </button>
            <button
              onClick={() => {
                if (scannerActive) { setScannerActive(false); }
                else { setScanKey(k => k + 1); setScanResult(null); setScannerActive(true); }
              }}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-white"
              style={{ background: scannerActive ? "#da3633" : "#238636" }}>
              {scannerActive ? "Stop Scanner" : "Start Scanner"}
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {scannerActive
            ? <QRScannerWidget key={scanKey} onScan={handleScan} />
            : <div className="w-full rounded-xl flex items-center justify-center text-sm"
                style={{ minHeight: "100px", background: "#0d1117", color: "#484f58" }}>
                Click "Start Scanner" to activate the camera
              </div>
          }
          {scanResult && <ScanBadge result={scanResult} />}
        </div>
      </div>

      {/* Attendance table */}
      <div className="rounded-lg border" style={{ borderColor: "#30363d" }}>
        <div className="px-4 py-3 flex flex-wrap gap-2 items-center justify-between" style={{ borderBottom: "1px solid #30363d" }}>
          <div>
            <h2 className="font-semibold text-sm text-white">Attendance</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>
              {registrations.length === 0 ? "Upload registrations in Database tab" : `${registrations.length} registered`}
            </p>
          </div>
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
            style={{ background: "#21262d", color: "#8b949e" }}>
            <IconRefresh /> Refresh
          </button>
        </div>
        {registrations.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "#484f58" }}>
            No registrations yet. Upload from the Database section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${400 + enabledSessions.length * 110}px` }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #30363d" }}>
                  {["#", "Name", "Reg No", "Email ID", ...enabledSessions.map(s => s.name)].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "#8b949e" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < registrations.length - 1 ? "1px solid #21262d" : "none" }}>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#484f58" }}>{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-white whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: "#58a6ff" }}>{r.reg_no}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "#8b949e" }}>{r.email || "—"}</td>
                    {enabledSessions.map(s => {
                      const present = attendance.some(a => a.reg_no === r.reg_no && a.session_id === s.id);
                      return (
                        <td key={s.id} className="px-4 py-2.5 text-center">
                          {present
                            ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: "rgba(35,134,54,0.2)", color: "#56d364" }}>✓</span>
                            : <span style={{ color: "#484f58" }}>—</span>
                          }
                        </td>
                      );
                    })}
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

// ============================================================
// DATABASE SECTION
// ============================================================
function DatabaseSection() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState({ name: "", email: "", reg_no: "" });
  const [addError, setAddError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState({ name: "", email: "", reg_no: "" });
  const [editError, setEditError] = useState("");

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

  const inCls = "px-2.5 py-1.5 rounded-md text-xs w-full focus:outline-none";
  const inStyle: React.CSSProperties = { background: "#0d1117", color: "#e6edf3", border: "1px solid #30363d" };

  return (
    <div className="rounded-lg border" style={{ borderColor: "#30363d" }}>
      <div className="px-4 py-3 flex flex-wrap gap-2 items-center justify-between" style={{ borderBottom: "1px solid #30363d" }}>
        <div>
          <h2 className="font-semibold text-sm text-white">Registered Students</h2>
          <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>{registrations.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadRegistrations} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
            style={{ background: "#21262d", color: "#8b949e" }}>
            <IconRefresh /> Refresh
          </button>
          <button onClick={() => { setAddingRow(true); setNewRow({ name: "", email: "", reg_no: "" }); setAddError(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "rgba(35,134,54,0.15)", color: "#56d364", border: "1px solid rgba(35,134,54,0.3)" }}>
            <IconPlus /> Add Row
          </button>
          {registrations.length > 0 && (
            <button onClick={handleClearAll} className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: "rgba(218,54,51,0.12)", color: "#f85149" }}>
              Clear All
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: "560px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #30363d" }}>
              {["S.No", "Name", "Email ID", "Reg No", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#8b949e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {addingRow && (
              <Fragment>
                <tr style={{ background: "rgba(35,134,54,0.05)", borderBottom: "1px solid #30363d" }}>
                  <td className="px-4 py-2 text-xs" style={{ color: "#484f58" }}>—</td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} placeholder="Name *" value={newRow.name} onChange={e => setNewRow(p => ({ ...p, name: e.target.value }))} /></td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} placeholder="Email" value={newRow.email} onChange={e => setNewRow(p => ({ ...p, email: e.target.value }))} /></td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} placeholder="Reg No *" value={newRow.reg_no} onChange={e => setNewRow(p => ({ ...p, reg_no: e.target.value }))} /></td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={handleAddRow} className="px-3 py-1 rounded text-xs font-semibold" style={{ background: "#238636", color: "#fff" }}>Save</button>
                      <button onClick={() => { setAddingRow(false); setAddError(""); }} className="px-3 py-1 rounded text-xs" style={{ background: "#21262d", color: "#8b949e" }}>Cancel</button>
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
                <tr style={{ background: "rgba(88,166,255,0.05)", borderBottom: "1px solid #30363d" }}>
                  <td className="px-4 py-2 text-xs" style={{ color: "#484f58" }}>{i + 1}</td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} value={editRow.name} onChange={e => setEditRow(p => ({ ...p, name: e.target.value }))} /></td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} value={editRow.email} onChange={e => setEditRow(p => ({ ...p, email: e.target.value }))} /></td>
                  <td className="px-2 py-2"><input className={inCls} style={inStyle} value={editRow.reg_no} onChange={e => setEditRow(p => ({ ...p, reg_no: e.target.value }))} /></td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1 rounded text-xs font-semibold" style={{ background: "#238636", color: "#fff" }}>Save</button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1 rounded text-xs" style={{ background: "#21262d", color: "#8b949e" }}>Cancel</button>
                    </div>
                  </td>
                </tr>
                {editError && (
                  <tr><td colSpan={5} className="px-4 py-1.5 text-xs" style={{ color: "#f85149", background: "rgba(218,54,51,0.05)" }}>{editError}</td></tr>
                )}
              </Fragment>
            ) : (
              <tr key={r.id} style={{ borderBottom: i < registrations.length - 1 ? "1px solid #21262d" : "none" }}>
                <td className="px-4 py-2.5 text-xs" style={{ color: "#484f58" }}>{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-white">{r.name}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "#8b949e" }}>{r.email || "—"}</td>
                <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "#58a6ff" }}>{r.reg_no}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(r)} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                      style={{ background: "#21262d", color: "#8b949e" }}><IconEdit /> Edit</button>
                    <button onClick={() => handleDelete(r.id, r.name)} className="p-1.5 rounded"
                      style={{ background: "rgba(218,54,51,0.1)", color: "#f85149" }}><IconTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && !addingRow && (
          <div className="py-12 text-center text-sm" style={{ color: "#484f58" }}>No registrations yet. Click "Add Row" to add manually.</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS SECTION
// ============================================================
function SettingsSection({ sessions, onSessionsUpdated }: { sessions: Session[]; onSessionsUpdated: () => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleToggle(s: Session) {
    setSaving(true);
    await supabase.from("sessions").update({ is_enabled: !s.is_enabled }).eq("id", s.id);
    onSessionsUpdated();
    setSaving(false);
  }

  async function handleRename(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    await supabase.from("sessions").update({ name: editName.trim() }).eq("id", id);
    setEditingId(null);
    onSessionsUpdated();
    setSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPw) { setPwMsg({ type: "error", text: "Passwords don't match." }); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPwMsg(error ? { type: "error", text: error.message } : { type: "success", text: "Password updated!" });
    if (!error) { setPassword(""); setConfirmPw(""); }
    setPwLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Sessions */}
      <div className="rounded-lg border" style={{ borderColor: "#30363d", background: "#161b22" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #30363d" }}>
          <h2 className="font-semibold text-sm text-white">Sessions</h2>
          <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>
            Enable sessions to make them available as scan targets in Attendance.
          </p>
        </div>
        <div>
          {sessions.map((s, i) => (
            <div key={s.id} className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: i < sessions.length - 1 ? "1px solid #21262d" : "none" }}>
              {/* Toggle switch */}
              <button onClick={() => handleToggle(s)} disabled={saving}
                className="relative shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
                style={{ width: "40px", height: "22px", background: s.is_enabled ? "#238636" : "#30363d" }}>
                <span className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
                  style={{ width: "18px", height: "18px", left: s.is_enabled ? "20px" : "2px" }} />
              </button>

              {editingId === s.id ? (
                <form onSubmit={e => { e.preventDefault(); handleRename(s.id); }} className="flex-1 flex gap-2">
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded text-sm text-white outline-none bg-transparent"
                    style={{ border: "1px solid #58a6ff" }} />
                  <button type="submit" className="px-3 py-1 rounded text-xs text-white" style={{ background: "#238636" }}>Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1 rounded text-xs"
                    style={{ background: "#21262d", color: "#8b949e" }}>Cancel</button>
                </form>
              ) : (
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-white">{s.name}</span>
                  <button onClick={() => { setEditingId(s.id); setEditName(s.name); }}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{ color: "#8b949e" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#f0f6fc")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#8b949e")}>
                    Rename
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Password */}
      <div className="rounded-lg border" style={{ borderColor: "#30363d", background: "#161b22" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #30363d" }}>
          <h2 className="font-semibold text-sm text-white">Change Password</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handlePasswordChange} className="space-y-3 max-w-sm">
            {[
              { label: "New Password", val: password, set: setPassword },
              { label: "Confirm Password", val: confirmPw, set: setConfirmPw },
            ].map(({ label, val, set }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs uppercase tracking-widest" style={{ color: "#8b949e" }}>{label}</label>
                <input required type="password" value={val} onChange={e => set(e.target.value)} minLength={6}
                  className="w-full px-3 py-2 rounded-md text-sm text-white outline-none"
                  style={{ background: "#0d1117", border: "1px solid #30363d" }}
                  onFocus={e => (e.target.style.borderColor = "#58a6ff")}
                  onBlur={e => (e.target.style.borderColor = "#30363d")} />
              </div>
            ))}
            {pwMsg && <p className="text-xs" style={{ color: pwMsg.type === "success" ? "#56d364" : "#f85149" }}>{pwMsg.text}</p>}
            <button type="submit" disabled={pwLoading} className="px-5 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#238636" }}>
              {pwLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COORDINATOR DASHBOARD
// ============================================================
export default function CoreDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState<CoreNav>("attendance");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadSessions = useCallback(async () => {
    const { data } = await supabase.from("sessions").select("*").order("slot_order");
    setSessions(data ?? []);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/coordinator"); return; }
      const { data: core } = await supabase.from("core_users").select("id").eq("user_id", user.id).maybeSingle();
      if (!core) { await supabase.auth.signOut(); router.replace("/coordinator"); return; }
      setUser(user);
      await loadSessions();
      setLoading(false);
    });
  }, [router, loadSessions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm"
        style={{ background: "#0d1117", color: "#8b949e" }}>
        Loading…
      </div>
    );
  }

  const navItems: { id: CoreNav; label: string; icon: React.ReactNode }[] = [
    { id: "attendance", label: "Attendance", icon: <IconScan /> },
    { id: "database", label: "Database", icon: <IconDatabase /> },
    { id: "settings", label: "Settings", icon: <IconSettings /> },
  ];
  const desc: Record<CoreNav, string> = {
    attendance: "Scan QR codes & track attendance",
    database: "Manage student registrations",
    settings: "Sessions & account settings",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0d1117", color: "#f0f6fc" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ width: 220, background: "#161b22", borderRight: "1px solid #30363d" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #30363d" }}>
          <span className="font-bold tracking-widest text-white text-sm" style={{ fontFamily: "monospace" }}>CLOUD-FLUSH</span>
          <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>Coordinator</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setNav(item.id); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors"
              style={nav === item.id ? { background: "#21262d", color: "#f0f6fc" } : { color: "#8b949e" }}
              onMouseEnter={e => { if (nav !== item.id) e.currentTarget.style.color = "#f0f6fc"; }}
              onMouseLeave={e => { if (nav !== item.id) e.currentTarget.style.color = "#8b949e"; }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 space-y-2" style={{ borderTop: "1px solid #30363d" }}>
          <div className="px-3 py-2 rounded-lg" style={{ background: "#21262d" }}>
            <p className="text-sm text-white truncate">{user?.email}</p>
            <span className="text-xs" style={{ color: "#8b949e" }}>Coordinator</span>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.replace("/coordinator"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "#8b949e" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f85149")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8b949e")}>
            <IconLogout /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: 0 }}>
        <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
          style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
          <button className="lg:hidden p-1.5 rounded-lg" onClick={() => setSidebarOpen(true)}
            style={{ color: "#8b949e" }}>
            <IconMenu />
          </button>
          <div>
            <h1 className="font-semibold text-white capitalize">{nav}</h1>
            <p className="text-xs hidden sm:block" style={{ color: "#8b949e" }}>{desc[nav]}</p>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">
          {nav === "attendance" && user && <AttendanceSection user={user} sessions={sessions} onOpenSettings={() => setNav("settings")} />}
          {nav === "database" && <DatabaseSection />}
          {nav === "settings" && <SettingsSection sessions={sessions} onSessionsUpdated={loadSessions} />}
        </div>
      </main>

      <style>{`@media (min-width: 1024px) { main { margin-left: 220px !important; } }`}</style>
    </div>
  );
}
