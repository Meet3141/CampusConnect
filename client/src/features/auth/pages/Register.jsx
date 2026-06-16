/**
 * Register.jsx — Light-theme split-screen registration page.
 * Left  → brand canvas (mirrored layout vs Login)
 * Right → registration form with password strength meter
 *
 * API: POST /api/auth/register  body: { name, email, password }
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../../../context/ToastContext";
import useParticleCanvas from "../../../hooks/useParticleCanvas";
import { registerUser } from "../api";
import { useSyneFont } from "../hooks";
import { Eye, EyeOff, GraduationCap, User, Trophy, PenLine, AlertCircle } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/forms/Input";

/* ── Password strength ── */
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[@$!%*?&]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "#ff4d6d" };
  if (score === 2) return { score: 2, label: "Fair", color: "#ffb020" };
  if (score === 3) return { score: 3, label: "Good", color: "#004f9f" };
  return { score: 4, label: "Strong", color: "#00c27a" };
}

export default function Register() {
  useSyneFont();

  const navigate = useNavigate();
  const toast = useToast();
  const canvasRef = useRef(null);
  useParticleCanvas(canvasRef);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { password } = form;

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (!/^[A-Z]/.test(password)) {
      toast.error("Password must start with an uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }
    if (!/\d/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      return; 
    }

    setLoading(true);
    setApiErr("");
    try {
      await registerUser({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success("Registration successful! Please sign in.");
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
        .strength-bar {
          height: 3px; border-radius: 999px;
          transition: width 0.35s ease, background-color 0.35s ease;
        }
      `}</style>

      <div className="min-h-screen flex bg-[#f8f9fa] overflow-hidden" style={{ color: "#333" }}>

        {/* ── LEFT: Canvas panel (mirrored vs Login) ── */}
        <div className="hidden lg:flex relative flex-1 items-center justify-center overflow-hidden"
          style={{ background: "#eef3fa" }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Centre hero */}
          <div
            className="relative z-10 text-center px-10"
            style={{ animation: "cc-float 6s ease-in-out infinite" }}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm"
              style={{ background: "rgba(0,79,159,0.10)", border: "1.5px solid rgba(0,79,159,0.18)" }}
            >
              <GraduationCap size={36} style={{ color: "#004f9f" }} />
            </div>
            <h2
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#333" }}
              className="mb-2"
            >
              Join your campus<br />community.
            </h2>
            <p style={{ color: "rgba(51,51,51,0.52)", fontSize: "14px", maxWidth: "260px", lineHeight: "1.6", margin: "0 auto" }}>
              Create your account and start exploring clubs, events and everything your university has to offer.
            </p>

            {/* Role hint pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                { Icon: User, label: "Member" },
                { Icon: Trophy, label: "Club Admin" },
                { Icon: PenLine, label: "Editor" },
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

          {/* Right-edge fade */}
          <div className="absolute inset-y-0 right-0 w-16 pointer-events-none"
            style={{ background: "linear-gradient(to left, #eef3fa, transparent)" }} />
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="relative flex-1 flex items-center justify-center px-8 py-12 z-10">
          <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(0,79,159,0.05)" }} />

          <div
            className="relative w-full max-w-sm"
            style={{ opacity: ready ? 1 : 0, animation: ready ? "cc-fade-in 0.5s ease both" : "none" }}
          >
            {/* Logo */}
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
                Create your<br />
                <span className="cc-text-gradient">
                  account.
                </span>
              </h1>
              <p style={{ color: "rgba(51,51,51,0.52)", fontSize: "14px", marginTop: "12px" }}>
                Join thousands of students on campus.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">

              {/* Name */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.15s both" }}>
                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Arjun Shah"
                  autoComplete="name"
                  error={errors.name}
                />
              </div>

              {/* Email */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.20s both" }}>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@university.edu"
                  autoComplete="email"
                  error={errors.email}
                />
              </div>

              {/* Password + strength */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.25s both" }}>
                <Input
                  label="Password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={errors.password && !form.password ? errors.password : undefined}
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

                {/* Strength meter */}
                {form.password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className="strength-bar flex-1"
                          style={{ backgroundColor: s <= strength.score ? strength.color : "rgba(0,79,159,0.08)" }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px]" style={{ color: strength.color }}>
                      {strength.label}
                      {strength.score < 4 && (
                        <span style={{ color: "rgba(51,51,51,0.40)", marginLeft: "4px" }}>
                          — {!form.password.match(/[A-Z]/) ? "add uppercase · " : ""}
                          {!form.password.match(/\d/) ? "add a number · " : ""}
                          {form.password.length < 8 ? "8+ chars" : ""}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* API error */}
              {apiErr && (
                <div className="flex items-start gap-2.5 rounded-xl px-4 py-2.5"
                  style={{ background: "rgba(255,77,109,0.08)", border: "1.5px solid rgba(255,77,109,0.18)", animation: "cc-fade-in 0.2s ease both" }}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#ff4d6d" }} />
                  <p className="text-xs" style={{ color: "#ff4d6d" }}>{apiErr}</p>
                </div>
              )}

              {/* Submit */}
              <div style={{ animation: "cc-slide-up 0.5s ease 0.30s both" }}>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  Create account
                </Button>
              </div>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-sm" style={{ color: "rgba(51,51,51,0.52)", animation: "cc-slide-up 0.5s ease 0.36s both" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-medium transition-colors" style={{ color: "#004f9f" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
