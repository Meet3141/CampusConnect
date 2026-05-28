/**
 * Login.jsx — Light-theme split-screen auth page.
 * Left  → clean light-surface login form with staggered entrance animation
 * Right → live canvas: floating connected-node constellation (brand primary colours)
 *
 * API: POST /api/auth/login  body: { email, password }
 *      → { success, token, user }
 *      Token stored in localStorage("token") via AuthContext.login()
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import useParticleCanvas from "../../../hooks/useParticleCanvas";
import { useSyneFont } from "../hooks";
import { Eye, EyeOff, Landmark, Drama, Calendar, MessageCircle, AlertCircle } from "lucide-react";

export default function Login() {
  useSyneFont();

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const canvasRef  = useRef(null);
  useParticleCanvas(canvasRef);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const validate = () => {
    if (!email.includes("@")) return "Enter a valid email address.";
    if (!password)             return "Password is required.";
    return null;
  };

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
        .cc-auth-field {
          width: 100%;
          background: #F3F6F9;
          border: 1.5px solid rgba(0,79,159,0.10);
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 14px;
          color: #333333;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .cc-auth-field::placeholder { color: rgba(51,51,51,0.38); }
        .cc-auth-field:focus {
          background: #FFFFFF;
          border-color: #004F9F;
          box-shadow: 0 0 0 3px rgba(0,79,159,0.10);
        }
        .cc-btn-shine::after {
          content:'';position:absolute;inset:0;border-radius:inherit;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.14) 50%,transparent 60%);
          transform:translateX(-100%);transition:transform 0.5s;
        }
        .cc-btn-shine:hover::after { transform:translateX(100%); }
      `}</style>

      {/* Full-screen split: light form left, brand canvas right */}
      <div className="min-h-screen flex bg-[#F8F9FA] overflow-hidden" style={{ color: "#333333" }}>

        {/* ── LEFT: Form panel ── */}
        <div className="relative flex-1 flex items-center justify-center px-8 py-12 z-10">

          {/* Subtle glow blob behind form — primary-soft */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
               style={{ background: "rgba(0,79,159,0.06)" }} />

          <div
            className="relative w-full max-w-sm"
            style={{ opacity: ready ? 1 : 0, animation: ready ? "cc-fade-in 0.5s ease both" : "none" }}
          >
            {/* Logo mark */}
            <div className="flex items-center gap-2.5 mb-10" style={{ animation: "cc-slide-up 0.5s ease 0.05s both" }}>
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-[rgba(0,79,159,0.10)] shadow-sm">
                <img src="/depstar-logo.jpeg" alt="DEPSTAR" className="w-full h-full object-contain p-1 bg-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight" style={{ color: "#333333" }}>
                CampusConnect
              </span>
            </div>

            {/* Headline */}
            <div style={{ animation: "cc-slide-up 0.5s ease 0.1s both" }}>
              <h1
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2.2rem", lineHeight: 1.1, color: "#333333" }}
              >
                Welcome<br />
                <span style={{ background: "linear-gradient(135deg, #004F9F, #00BCEB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  back.
                </span>
              </h1>
              <p style={{ color: "rgba(51,51,51,0.52)", fontSize: "14px", marginTop: "12px" }}>
                Sign in to your campus account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">

              {/* Email */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.18s both" }}>
                <label className="block text-[11px] uppercase tracking-widest font-semibold mb-1.5"
                       style={{ color: "rgba(51,51,51,0.52)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className="cc-auth-field"
                />
              </div>

              {/* Password */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.24s both" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] uppercase tracking-widest font-semibold"
                         style={{ color: "rgba(51,51,51,0.52)" }}>
                    Password
                  </label>
                  <button type="button" className="text-[11px] font-medium transition-colors"
                          style={{ color: "#004F9F" }}
                          onMouseEnter={(e) => e.target.style.color="#0062C4"}
                          onMouseLeave={(e) => e.target.style.color="#004F9F"}>
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
                    className="cc-auth-field"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                    style={{ color: "rgba(51,51,51,0.40)" }}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl px-4 py-2.5"
                     style={{ background: "rgba(255,77,109,0.08)", border: "1.5px solid rgba(255,77,109,0.18)", animation: "cc-fade-in 0.2s ease both" }}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#FF4D6D" }} />
                  <p className="text-xs" style={{ color: "#FF4D6D" }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.3s both" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="cc-btn-shine relative overflow-hidden w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  style={{ background: "#004F9F" }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#0062C4")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#004F9F")}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                  onMouseUp={(e)   => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : "Sign in"}
                </button>
              </div>
            </form>

            {/* Register link */}
            <p className="mt-6 text-center text-sm" style={{ color: "rgba(51,51,51,0.52)", animation: "cc-slide-up 0.5s ease 0.36s both" }}>
              New to CampusConnect?{" "}
              <Link to="/register" className="font-medium transition-colors" style={{ color: "#004F9F" }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* ── RIGHT: Canvas panel — light tint background ── */}
        <div className="hidden lg:flex relative flex-1 items-center justify-center overflow-hidden"
             style={{ background: "#EEF3FA" }}>
          {/* Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Floating centre card */}
          <div
            className="relative z-10 text-center px-10"
            style={{ animation: "cc-float 6s ease-in-out infinite" }}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm"
              style={{ background: "rgba(0,79,159,0.10)", border: "1.5px solid rgba(0,79,159,0.18)" }}
            >
              <Landmark size={36} style={{ color: "#004F9F" }} />
            </div>
            <h2
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#333333" }}
              className="mb-2"
            >
              Your campus,<br />connected.
            </h2>
            <p style={{ color: "rgba(51,51,51,0.52)", fontSize: "14px", maxWidth: "240px", lineHeight: "1.6", margin: "0 auto" }}>
              Clubs, events, chats and more — all in one place for your university life.
            </p>

            {/* Stat pills */}
            <div className="flex justify-center gap-3 mt-6">
              {[
                { Icon: Drama,         label: "Clubs"  },
                { Icon: Calendar,      label: "Events" },
                { Icon: MessageCircle, label: "Chats"  },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs backdrop-blur-sm"
                  style={{
                    background: "rgba(255,255,255,0.70)",
                    border: "1.5px solid rgba(0,79,159,0.12)",
                    color: "rgba(51,51,51,0.70)",
                  }}
                >
                  <Icon size={14} className="shrink-0" style={{ color: "#004F9F" }} /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Left-edge fade — blends into form panel */}
          <div className="absolute inset-y-0 left-0 w-16 pointer-events-none"
               style={{ background: "linear-gradient(to right, #EEF3FA, transparent)" }} />
        </div>

      </div>
    </>
  );
}
