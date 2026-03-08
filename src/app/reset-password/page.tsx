"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the reset link is opened
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw !== confirm) { setMsg({ type: "err", text: "Passwords don't match." }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) { setMsg({ type: "err", text: error.message }); return; }
    setMsg({ type: "ok", text: "Password updated! Redirecting to login…" });
    setTimeout(() => router.replace("/core"), 2000);
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #30363d", color: "#f0f6fc" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0d1117" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-white font-bold text-2xl tracking-widest" style={{ fontFamily: "monospace" }}>
            CLOUD-FLUSH
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>Set new password</p>
        </div>

        <div className="rounded-xl border p-6 space-y-4" style={{ background: "#161b22", borderColor: "#30363d" }}>
          {!ready ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-sm animate-pulse" style={{ color: "#8b949e" }}>Verifying reset link…</p>
              <p className="text-xs" style={{ color: "#30363d" }}>
                If nothing happens, the link may have expired.{" "}
                <a href="/core" className="hover:underline" style={{ color: "#58a6ff" }}>Go back</a>
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-white font-semibold text-base">Choose a new password</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                {[
                  { label: "New Password", val: pw, setter: setPw },
                  { label: "Confirm Password", val: confirm, setter: setConfirm },
                ].map(({ label, val, setter }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs uppercase tracking-widest" style={{ color: "#8b949e" }}>{label}</label>
                    <input
                      type="password" required minLength={6} value={val}
                      onChange={(e) => setter(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-md text-sm outline-none transition-colors"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#58a6ff")}
                      onBlur={(e) => (e.target.style.borderColor = "#30363d")}
                    />
                  </div>
                ))}
                {msg && (
                  <p className="text-xs" style={{ color: msg.type === "ok" ? "#238636" : "#f85149" }}>{msg.text}</p>
                )}
                <button
                  type="submit" disabled={loading || !!msg?.type && msg.type === "ok"}
                  className="w-full py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                  style={{ background: "#238636" }}
                >
                  {loading ? "Saving…" : "Set new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
