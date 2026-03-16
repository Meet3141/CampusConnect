/**
 * Register.jsx
 * Split-screen registration page.
 * Left  → animated canvas (same constellation as Login)
 * Right → registration form with password strength meter
 *
 * Layout is MIRRORED vs Login (canvas left, form right) for visual variety
 * while staying aesthetically consistent.
 *
 * API: POST /api/auth/register  body: { name, email, password }
 *      → { success, token, user }
 *      On success: alert + navigate to /login  (matches existing pattern)
 *
 * Password rules (mirrors backend regex):
 *   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

/* ── Inject Google Font once ── */
function useSyneFont() {
  useEffect(() => {
    if (document.getElementById("syne-font")) return;
    const link = document.createElement("link");
    link.id   = "syne-font";
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ── Canvas: same floating constellation ── */
function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const mouse = { x: null, y: null };

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });

    const N = 55;
    const pts = Array.from({ length: N }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      r:     Math.random() * 1.8 + 1.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const LINK_DIST = 140;

    const tick = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10)              p.x = canvas.width  + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10)              p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        if (mouse.x !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d  = Math.hypot(dx, dy);
          if (d < 110) {
            const f = ((110 - d) / 110) * 0.025;
            p.x += dx * f;
            p.y += dy * f;
          }
        }

        const pulse = p.r + Math.sin(t * 0.0009 + p.phase) * 0.7;
        const glow  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulse * 4);
        glow.addColorStop(0,   "rgba(139,92,246,0.85)");
        glow.addColorStop(0.4, "rgba(99,102,241,0.4)");
        glow.addColorStop(1,   "rgba(99,102,241,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(167,139,250,0.9)";
        ctx.fill();

        for (let j = i + 1; j < pts.length; j++) {
          const q  = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d  = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            const a    = (1 - d / LINK_DIST) * 0.28;
            const grad = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
            grad.addColorStop(0, `rgba(139,92,246,${a})`);
            grad.addColorStop(1, `rgba(99,102,241,${a * 0.5})`);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 0.7;
            ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [canvasRef]);
}

/* ── Password strength ── */
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8)       score++;
  if (/[a-z]/.test(pwd))    score++;
  if (/[A-Z]/.test(pwd))    score++;
  if (/\d/.test(pwd))       score++;
  if (/[@$!%*?&]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: "Weak",   color: "#ef4444" };
  if (score === 2) return { score: 2, label: "Fair",   color: "#f59e0b" };
  if (score === 3) return { score: 3, label: "Good",   color: "#3b82f6" };
  return              { score: 4, label: "Strong", color: "#22c55e" };
}

/* ══════════════════════════════════════════════
   Main component
══════════════════════════════════════════════ */
export default function Register() {
  useSyneFont();

  const navigate  = useNavigate();
  const canvasRef = useRef(null);
  useParticleCanvas(canvasRef);

  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const strength = getStrength(form.password);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
    setApiErr("");
  };

  /* Validate */
  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";
    if (!form.email.includes("@"))
      errs.email = "Enter a valid email address.";
    if (!PWD_REGEX.test(form.password))
      errs.password = "8+ chars, uppercase, lowercase and a number.";
    return errs;
  };

  /* Submit → POST /api/auth/register */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiErr("");
    try {
      await api.post("/auth/register", {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      });
      alert("Registration successful! Please sign in.");
      navigate("/login");
    } catch (err) {
      setApiErr(err.response?.data?.message || "Registration failed. Please try again.");
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
        .cc-field { transition: border-color 0.2s, box-shadow 0.2s; }
        .cc-field:focus {
          outline: none;
          border-color: rgba(99,102,241,0.7);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .cc-field-err {
          border-color: rgba(239,68,68,0.6) !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08) !important;
        }
        .cc-btn-shine::after {
          content:'';position:absolute;inset:0;border-radius:inherit;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.12) 50%,transparent 60%);
          transform:translateX(-100%);transition:transform 0.5s;
        }
        .cc-btn-shine:hover::after { transform:translateX(100%); }
        .strength-bar {
          height: 3px;
          border-radius: 999px;
          transition: width 0.35s ease, background-color 0.35s ease;
        }
      `}</style>

      <div className="min-h-screen flex bg-[#0a0a12] text-white overflow-hidden">

        {/* ── LEFT: Canvas panel (mirrored vs Login) ── */}
        <div className="hidden lg:flex relative flex-1 items-center justify-center bg-[#07070f] overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Centre hero */}
          <div
            className="relative z-10 text-center px-10"
            style={{ animation: "cc-float 6s ease-in-out infinite" }}
          >
            <div className="w-20 h-20 rounded-3xl bg-violet-600/20 ring-1 ring-violet-500/30 flex items-center justify-center text-4xl mx-auto mb-5 backdrop-blur-sm">
              🎓
            </div>
            <h2
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.5rem" }}
              className="text-white mb-2"
            >
              Join your campus<br />community.
            </h2>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Create your account and start exploring clubs, events and everything your university has to offer.
            </p>

            {/* Role hint pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                { icon: "👤", label: "Member" },
                { icon: "🏆", label: "Club Admin" },
                { icon: "✏️", label: "Editor" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm text-xs text-slate-400"
                >
                  <span className="text-sm">{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right-edge fade */}
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a0a12] to-transparent pointer-events-none" />
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="relative flex-1 flex items-center justify-center px-8 py-12 z-10">
          <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

          <div
            className="relative w-full max-w-sm"
            style={{ opacity: ready ? 1 : 0, animation: ready ? "cc-fade-in 0.5s ease both" : "none" }}
          >
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 mb-10"
              style={{ animation: "cc-slide-up 0.5s ease 0.05s both" }}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.95"/>
                  <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.55"/>
                  <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.55"/>
                  <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.28"/>
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-tight text-white/80">
                CampusConnect
              </span>
            </div>

            {/* Headline */}
            <div style={{ animation: "cc-slide-up 0.5s ease 0.1s both" }}>
              <h1
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2.2rem", lineHeight: 1.1 }}
                className="text-white"
              >
                Create your<br />
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  account.
                </span>
              </h1>
              <p className="text-slate-500 text-sm mt-3">
                Join thousands of students on campus.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">

              {/* Name */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.15s both" }}>
                <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-medium mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Arjun Shah"
                  autoComplete="name"
                  className={`cc-field w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 ${errors.name ? "cc-field-err border-red-800/60" : "border-white/[0.09]"}`}
                />
                {errors.name && (
                  <p className="text-red-400 text-[11px] mt-1.5">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.20s both" }}>
                <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className={`cc-field w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 ${errors.email ? "cc-field-err border-red-800/60" : "border-white/[0.09]"}`}
                />
                {errors.email && (
                  <p className="text-red-400 text-[11px] mt-1.5">{errors.email}</p>
                )}
              </div>

              {/* Password + strength */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.25s both" }}>
                <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`cc-field w-full bg-white/[0.04] border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 ${errors.password ? "cc-field-err border-red-800/60" : "border-white/[0.09]"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    {showPwd ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                {/* Strength meter */}
                {form.password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className="strength-bar flex-1"
                          style={{
                            backgroundColor:
                              s <= strength.score ? strength.color : "rgba(255,255,255,0.07)",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px]" style={{ color: strength.color }}>
                      {strength.label}
                      {strength.score < 4 && (
                        <span className="text-slate-600 ml-1">
                          — {!form.password.match(/[A-Z]/) ? "add uppercase · " : ""}
                          {!form.password.match(/\d/) ? "add a number · " : ""}
                          {form.password.length < 8 ? "8+ chars" : ""}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {errors.password && !form.password && (
                  <p className="text-red-400 text-[11px] mt-1.5">{errors.password}</p>
                )}
              </div>

              {/* API error */}
              {apiErr && (
                <p
                  className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-2.5"
                  style={{ animation: "cc-fade-in 0.2s ease both" }}
                >
                  {apiErr}
                </p>
              )}

              {/* Submit */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.30s both" }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="cc-btn-shine relative overflow-hidden w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>

            {/* Login link */}
            <p
              className="mt-6 text-center text-sm text-slate-500"
              style={{ animation: "cc-slide-up 0.5s ease 0.36s both" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
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
