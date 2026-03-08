"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CoreLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Verify core access
      const { data: coreCheck } = await supabase.from("core_users").select("id").maybeSingle();
      if (!coreCheck) {
        await supabase.auth.signOut();
        throw new Error("Access denied. You are not a core team member.");
      }

      router.push("/core/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0d1117" }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-white font-bold text-2xl tracking-widest"
            style={{ fontFamily: "monospace" }}
          >
            CLOUD-FLUSH
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            Core Team Portal
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl border p-6 space-y-4"
          style={{ background: "#161b22", borderColor: "#30363d" }}
        >
          <h2 className="text-white font-semibold text-base">Sign in</h2>
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <label
                className="text-xs uppercase tracking-widest"
                style={{ color: "#8b949e" }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="core@example.com"
                className="w-full px-3 py-2 rounded-md text-sm text-white outline-none transition-colors"
                style={{
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  color: "#f0f6fc",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#58a6ff")}
                onBlur={(e) => (e.target.style.borderColor = "#30363d")}
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs uppercase tracking-widest"
                style={{ color: "#8b949e" }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-md text-sm text-white outline-none transition-colors"
                style={{
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  color: "#f0f6fc",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#58a6ff")}
                onBlur={(e) => (e.target.style.borderColor = "#30363d")}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "#f85149" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ background: "#238636" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
