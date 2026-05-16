/**
 * Login.jsx
 * Split-screen auth page.
 * Left  → glass-card login form with staggered entrance animation
 * Right → live canvas: floating connected-node constellation (zero deps)
 *
 * API: POST /api/auth/login  body: { email, password }
 *      → { success, token, user }
 *      Token stored in localStorage("token") via AuthContext.login()
 *
 * Font: Syne (Google Fonts) — injected once on mount via <link>
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import useParticleCanvas from "../../../hooks/useParticleCanvas";
import { useSyneFont } from "../hooks";

/* ══════════════════════════════════════════════
   Main component
══════════════════════════════════════════════ */
export default function Login() {
  useSyneFont();

  const { login }  = useAuth();
  const navigate    = useNavigate();
  const canvasRef   = useRef(null);
  useParticleCanvas(canvasRef);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [ready,    setReady]    = useState(false);

  /* Stagger entrance */
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);



  /* Validate */
  const validate = () => {
    if (!email.includes("@"))  return "Enter a valid email address.";
    if (!password)             return "Password is required.";
    return null;
  };

  /* Submit → AuthContext.login() */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page-scoped keyframes */}
      <style>{`
        @keyframes cc-slide-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cc-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cc-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        .cc-field { transition: border-color 0.2s, box-shadow 0.2s; }
        .cc-field:focus {
          outline: none;
          border-color: rgba(99,102,241,0.7);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .cc-btn-shine::after {
          content:'';position:absolute;inset:0;border-radius:inherit;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.12) 50%,transparent 60%);
          transform:translateX(-100%);transition:transform 0.5s;
        }
        .cc-btn-shine:hover::after { transform:translateX(100%); }
      `}</style>

      <div className="min-h-screen flex bg-[#0a0a12] text-white overflow-hidden">

        {/* ── LEFT: Form panel ── */}
        <div className="relative flex-1 flex items-center justify-center px-8 py-12 z-10">

          {/* Ambient glow behind form */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div
            className="relative w-full max-w-sm"
            style={{
              opacity: ready ? 1 : 0,
              animation: ready ? "cc-fade-in 0.5s ease both" : "none",
            }}
          >
            {/* Logo mark */}
            <div
              className="flex items-center gap-2.5 mb-10"
              style={{ animation: "cc-slide-up 0.5s ease 0.05s both" }}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden">
                <img src="/depstar-logo.jpeg" alt="DEPSTAR" className="w-full h-full object-contain p-1 bg-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white/80">
                CampusConnect
              </span>
            </div>

            {/* Headline */}
            <div style={{ animation: "cc-slide-up 0.5s ease 0.1s both" }}>
              <h1
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2.2rem", lineHeight: 1.1 }}
                className="text-white mb-1"
              >
                Welcome<br />
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  back.
                </span>
              </h1>
              <p className="text-slate-500 text-sm mt-3">
                Sign in to your campus account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">

              {/* Email */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.18s both" }}>
                <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className="cc-field w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600"
                />
              </div>

              {/* Password */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.24s both" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="cc-field w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    {showPwd ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p
                  className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-2.5"
                  style={{ animation: "cc-fade-in 0.2s ease both" }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.3s both" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="cc-btn-shine relative overflow-hidden w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>

            {/* Register link */}
            <p
              className="mt-6 text-center text-sm text-slate-500"
              style={{ animation: "cc-slide-up 0.5s ease 0.36s both" }}
            >
              New to CampusConnect?{" "}
              <Link
                to="/register"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* ── RIGHT: Canvas panel ── */}
        <div className="hidden lg:flex relative flex-1 items-center justify-center bg-[#07070f] overflow-hidden">
          {/* Canvas fills the panel */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Floating centre card */}
          <div
            className="relative z-10 text-center px-10"
            style={{ animation: "cc-float 6s ease-in-out infinite" }}
          >
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 ring-1 ring-indigo-500/30 flex items-center justify-center text-4xl mx-auto mb-5 backdrop-blur-sm">
              🏛️
            </div>
            <h2
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.5rem" }}
              className="text-white mb-2"
            >
              Your campus,<br />connected.
            </h2>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Clubs, events, chats and more — all in one place for your university life.
            </p>

            {/* Floating stat pills */}
            <div className="flex justify-center gap-3 mt-6">
              {[["🎭", "Clubs"], ["📅", "Events"], ["💬", "Chats"]].map(([icon, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm text-xs text-slate-400"
                >
                  <span className="text-sm">{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Edge fade — blends into form panel */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#07070f] to-transparent pointer-events-none" />
        </div>

      </div>
    </>
  );
}

/* ── Icon sub-components ── */
function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10M4.2 4.3C2.6 5.4 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.8-1M6 3.1C6.6 3 7.3 3 8 3c4.5 0 7 5 7 5s-.7 1.4-1.8 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
