"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ACCENT = "#d29922";
const BTN_BG = "#9e6a03";

export default function JudgeLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const { data: check } = await supabase.from("judge_users").select("id").maybeSingle();
      if (!check) {
        await supabase.auth.signOut();
        throw new Error("Access denied. You are not a registered judge.");
      }
      router.push("/judge/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setResetMsg(null);
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) { setResetMsg({ type: "err", text: error.message }); return; }
    setResetSent(true);
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #30363d", color: "#f0f6fc" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0d1117" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-white font-bold text-2xl tracking-widest" style={{ fontFamily: "monospace" }}>
            CLOUD-FLUSH
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>Judge Portal</p>
          <div className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "#d2992218", color: ACCENT, border: "1px solid #d2992240" }}>
            JUDGE
          </div>
        </div>

        <div className="rounded-xl border p-6 space-y-4" style={{ background: "#161b22", borderColor: "#30363d" }}>
          {mode === "login" ? (
            <>
              <h2 className="text-white font-semibold text-base">Sign in</h2>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest" style={{ color: "#8b949e" }}>Email</label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="judge@example.com"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none transition-colors"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                    onBlur={(e) => (e.target.style.borderColor = "#30363d")}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#8b949e" }}>Password</label>
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs hover:underline" style={{ color: ACCENT }}>
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none transition-colors"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                    onBlur={(e) => (e.target.style.borderColor = "#30363d")}
                  />
                </div>
                {error && <p className="text-xs" style={{ color: "#f85149" }}>{error}</p>}
                <button
                  type="submit" disabled={loading}
                  className="w-full py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                  style={{ background: BTN_BG }}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </>
          ) : resetSent ? (
            <div className="text-center space-y-3 py-2">
              <p className="text-sm font-medium text-white">Check your inbox</p>
              <p className="text-xs" style={{ color: "#8b949e" }}>
                A reset link was sent to <span className="text-white">{email}</span>.
              </p>
              <button
                onClick={() => { setMode("login"); setResetSent(false); }}
                className="text-xs hover:underline" style={{ color: ACCENT }}
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold text-base">Reset password</h2>
                <button type="button" onClick={() => setMode("login")} className="text-xs hover:underline" style={{ color: "#8b949e" }}>
                  ← Sign in
                </button>
              </div>
              <form onSubmit={handleForgot} className="space-y-3">
                <p className="text-xs" style={{ color: "#8b949e" }}>Enter your email and we&apos;ll send a reset link.</p>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest" style={{ color: "#8b949e" }}>Email</label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="judge@example.com"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none transition-colors"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                    onBlur={(e) => (e.target.style.borderColor = "#30363d")}
                  />
                </div>
                {resetMsg && <p className="text-xs" style={{ color: resetMsg.type === "ok" ? "#238636" : "#f85149" }}>{resetMsg.text}</p>}
                <button
                  type="submit" disabled={resetLoading}
                  className="w-full py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                  style={{ background: BTN_BG }}
                >
                  {resetLoading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-4 text-xs">
          <a href="/core" className="hover:underline" style={{ color: "#8b949e" }}>Core Login</a>
          {" · "}
          <a href="/admin" className="hover:underline" style={{ color: "#8b949e" }}>Admin Login</a>
        </p>
      </div>
    </div>
  );
}
