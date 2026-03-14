"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot";

interface AuthModalProps {
  initialMode: Mode;
  onClose: () => void;
}

export default function AuthModal({ initialMode, onClose }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Register fields
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [email, setEmail] = useState("");
  const [isVitChennai, setIsVitChennai] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      if (resetError) throw resetError;
      setForgotSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isVitChennai === null) {
      setError("Please answer whether you are from VIT Chennai.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: leaderName,
            reg_no: regNo,
            team_name: teamName,
            role: "leader",
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Sign up failed. Please try again.");

      // 2. Establish session immediately (requires email confirmation OFF in Supabase dashboard)
      let userId = data.user.id;
      if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw new Error(
            "Account created but could not sign in automatically. " +
            "Please disable 'Confirm email' in Supabase Auth settings, then try again."
          );
        }
        userId = signInData.user!.id;
      }

      // 3. Insert team record (now auth.uid() is set)
      const { data: teamData, error: teamError } = await supabase.from("teams").insert({
        team_name: teamName,
        leader_id: userId,
        is_vit_chennai: isVitChennai,
        points: 1000,
      }).select("id").single();

      if (teamError) throw teamError;

      // 4. Insert the leader as a team_member so their name/reg_no is visible to teammates
      await supabase.from("team_members").insert({
        team_id: teamData.id,
        name: leaderName,
        reg_no: regNo,
        email,
        user_id: userId,
      });

      router.push("/dashboard");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (loginError) throw loginError;
      router.push("/dashboard");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: "#0c0c0c" }}
      >
        {/* Gold top border accent */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #D4A017, transparent)" }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-8">
          {/* Tab switcher — only show for register/login */}
          {mode !== "forgot" && (
            <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1">
              {(["register", "login"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                    mode === m
                      ? "bg-gold text-black shadow"
                      : "text-white/50 hover:text-white/80"
                  }`}
                  style={mode === m ? { background: "#D4A017" } : {}}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <p className="text-center text-xs text-white/40 -mt-4 mb-4">
                Only the team leader needs to register.
              </p>

              <Field label="Team Name">
                <input
                  required
                  type="text"
                  placeholder="e.g. CloudBusters"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Team Leader Name">
                <input
                  required
                  type="text"
                  placeholder="Your full name"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Registration Number">
                <input
                  required
                  type="text"
                  placeholder="e.g. 23BCE1234"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Email Address">
                <input
                  required
                  type="email"
                  placeholder="leader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Are you from VIT Chennai?">
                <div className="flex gap-4 mt-1">
                  {[true, false].map((v) => (
                    <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vitChennai"
                        checked={isVitChennai === v}
                        onChange={() => setIsVitChennai(v)}
                        className="accent-yellow-400 w-4 h-4"
                      />
                      <span className="text-sm text-white/80">{v ? "Yes" : "No"}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Set Password">
                <input
                  required
                  type="password"
                  placeholder="Min 6 characters"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                />
              </Field>

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

              <button type="submit" disabled={loading} className={submitCls} style={{ background: "#D4A017" }}>
                {loading ? "Registering…" : "Register Team"}
              </button>
            </form>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email Address">
                <input
                  required
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Password">
                <input
                  required
                  type="password"
                  placeholder="Your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={inputCls}
                />
              </Field>

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

              <button type="submit" disabled={loading} className={submitCls} style={{ background: "#D4A017" }}>
                {loading ? "Logging in…" : "Login"}
              </button>

              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); setForgotSent(false); }}
                className="w-full text-center text-xs text-white/40 hover:text-yellow-400 transition-colors pt-1"
              >
                Forgot password?
              </button>
            </form>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 -mt-2 mb-6">
                <button
                  onClick={() => { setMode("login"); setError(""); setForgotSent(false); }}
                  className="text-white/40 hover:text-white transition-colors"
                  aria-label="Back"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                </button>
                <h3 className="text-sm font-semibold text-white">Reset Password</h3>
              </div>

              {forgotSent ? (
                <div className="text-center py-6 space-y-2">
                  <div className="text-3xl">📧</div>
                  <p className="text-sm font-semibold text-white">Check your inbox</p>
                  <p className="text-xs text-white/40">A password reset link has been sent to <span className="text-yellow-400">{forgotEmail}</span>.</p>
                  <button
                    onClick={() => { setMode("login"); setForgotSent(false); }}
                    className="mt-4 text-xs text-white/40 hover:text-white transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-white/40">Enter your email and we&apos;ll send a reset link.</p>
                  <Field label="Email Address">
                    <input
                      required
                      type="email"
                      placeholder="your@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                  <button type="submit" disabled={loading} className={submitCls} style={{ background: "#D4A017" }}>
                    {loading ? "Sending…" : "Send Reset Link"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Gold bottom accent */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #D4A017, transparent)" }} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-white/60 tracking-wide uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:ring-1 focus:ring-yellow-500/60 border border-white/10 focus:border-yellow-500/40 bg-white/5";

const submitCls =
  "w-full py-3 rounded-xl text-sm font-bold tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-black hover:opacity-90 active:scale-[0.98]";
