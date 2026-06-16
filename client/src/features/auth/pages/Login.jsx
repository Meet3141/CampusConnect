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
import Button from "../../../components/ui/Button";
import Input from "../../../components/forms/Input";

export default function Login() {
  useSyneFont();

  const { login } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  useParticleCanvas(canvasRef);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const validate = () => {
    if (!email.includes("@")) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      await login(sanitizedEmail, password);
      navigate("/dashboard");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Unknown Network Error";
      setError(errorMessage);
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
      `}</style>

      {/* Full-screen split: light form left, brand canvas right */}
      <div className="min-h-screen flex bg-[#f8f9fa] overflow-hidden" style={{ color: "#333" }}>

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
              <span className="text-sm font-semibold tracking-tight" style={{ color: "#333" }}>
                CampusConnect
              </span>
            </div>

            {/* Headline */}
            <div style={{ animation: "cc-slide-up 0.5s ease 0.1s both" }}>
              <h1
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2.2rem", lineHeight: 1.1, color: "#333" }}
              >
                Welcome<br />
                <span className="cc-text-gradient">
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
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@university.edu"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
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
                    style={{ color: "#004f9f" }}
                    onMouseEnter={(e) => e.target.style.color = "#0062c4"}
                    onMouseLeave={(e) => e.target.style.color = "#004f9f"}>
                    Forgot password?
                  </button>
                </div>
                <Input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="p-1 transition-colors hover:text-cc-strong"
                      style={{ color: "rgba(51,51,51,0.40)" }}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl px-4 py-2.5"
                  style={{ background: "rgba(255,77,109,0.08)", border: "1.5px solid rgba(255,77,109,0.18)", animation: "cc-fade-in 0.2s ease both" }}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#ff4d6d" }} />
                  <p className="text-xs" style={{ color: "#ff4d6d" }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.3s both" }}>
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  Sign in
                </Button>
              </div>
            </form>

            {/* Register link */}
            <p className="mt-6 text-center text-sm" style={{ color: "rgba(51,51,51,0.52)", animation: "cc-slide-up 0.5s ease 0.36s both" }}>
              New to CampusConnect?{" "}
              <Link to="/register" className="font-medium transition-colors" style={{ color: "#004f9f" }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* ── RIGHT: Canvas panel — light tint background ── */}
        <div className="hidden lg:flex relative flex-1 items-center justify-center overflow-hidden"
          style={{ background: "#eef3fa" }}>
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
              <Landmark size={36} style={{ color: "#004f9f" }} />
            </div>
            <h2
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#333" }}
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
                { Icon: Drama, label: "Clubs" },
                { Icon: Calendar, label: "Events" },
                { Icon: MessageCircle, label: "Chats" },
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
                  <Icon size={14} className="shrink-0" style={{ color: "#004f9f" }} /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Left-edge fade — blends into form panel */}
          <div className="absolute inset-y-0 left-0 w-16 pointer-events-none"
            style={{ background: "linear-gradient(to right, #eef3fa, transparent)" }} />
        </div>

      </div>
    </>
  );
}
