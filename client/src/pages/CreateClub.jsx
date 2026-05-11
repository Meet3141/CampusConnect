/**
 * CreateClub.jsx
 * 2-step club creation form.
 * Step 1: Name + Category
 * Step 2: Description + Cover image URL
 *
 * API: POST /api/clubs  (requires auth + clubAdmin or orgAdmin role)
 *      Body: { name, description, category, coverImage? }
 *      Response: { success: true, data: Club }
 *
 * Role check is done both on the backend (authorize middleware) and
 * on the frontend (shows permission screen if roles don't match).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { inputCls } from "../utils/inputCls";
import { CLUB_CATEGORIES, CLUB_CATEGORY_META } from "../theme";

const NAME_MAX = 100;
const DESC_MAX = 1000;

export default function CreateClub() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  // Role guard — backend also enforces this via authorize("clubAdmin","orgAdmin")
  const canCreate =
    user?.roles?.includes("clubAdmin") || user?.roles?.includes("orgAdmin");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:        "",
    category:    "",
    description: "",
    coverImage:  "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError]       = useState("");
  const [submitting, setSubmitting]   = useState(false);

  /* ── Field change ── */
  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: "" }));
    setApiError("");
  };

  /* ── Step 1 validation ── */
  const validateStep1 = () => {
    const errs = {};
    const name = form.name.trim();
    if (name.length < 3)      errs.name = "Club name must be at least 3 characters.";
    if (name.length > NAME_MAX) errs.name = `Max ${NAME_MAX} characters.`;
    if (!form.category)        errs.category = "Please choose a category.";
    return errs;
  };

  /* ── Step 2 validation ── */
  const validateStep2 = () => {
    const errs = {};
    const desc = form.description.trim();
    if (desc.length < 20)      errs.description = "Description must be at least 20 characters.";
    if (desc.length > DESC_MAX) errs.description = `Max ${DESC_MAX} characters.`;
    if (form.coverImage && !/^https?:\/\/.+/.test(form.coverImage)) {
      errs.coverImage = "Must be a valid URL starting with https://";
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setStep(2);
  };

  /* ── Submit ──
     POST /api/clubs  body: { name, description, category, coverImage? }
     → { success: true, data: Club }                                     */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setSubmitting(true);
    setApiError("");
    try {
      const body = {
        name:        form.name.trim(),
        description: form.description.trim(),
        category:    form.category,
      };
      // Only include coverImage if provided (backend accepts null/omitted)
      if (form.coverImage.trim()) body.coverImage = form.coverImage.trim();

      const res = await api.post("/clubs", body);
      // Navigate to the newly created club — response.data.data._id
      navigate(`/clubs/${res.data.data._id}`);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to create club. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Permission gate ── */
  if (!canCreate) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Only users with <span className="text-indigo-400">Club Admin</span> or{" "}
            <span className="text-indigo-400">Org Admin</span> roles can create clubs.
          </p>
          <button
            onClick={() => navigate("/clubs")}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors"
          >
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  const selectedCat = CLUB_CATEGORY_META[form.category];

  return (
    <div className="text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-700/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-700/6 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-xl mx-auto px-5 py-8">

        {/* Back */}
        <button
          onClick={() => (step === 1 ? navigate("/clubs") : setStep(1))}
          className="group flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-10 transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
          {step === 1 ? "Back to Clubs" : "Back to Step 1"}
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-2">
            Dashboard / Clubs / New
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Create a{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Club
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Build a community around a shared interest.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-9">
          {[1, 2].map((s, idx) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s
                  ? "bg-indigo-600 text-white"
                  : s < step
                  ? "bg-emerald-900/60 text-emerald-400 border border-emerald-700"
                  : "bg-white/[0.04] text-slate-600 border border-white/[0.08]"
              }`}>
                {s < step ? "✓" : s}
              </div>
              <span className={`text-xs font-medium ${step === s ? "text-white" : "text-slate-600"}`}>
                {s === 1 ? "Basics" : "Details"}
              </span>
              {idx < 1 && (
                <div className={`w-10 h-px ${step > s ? "bg-emerald-700" : "bg-white/[0.08]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Name + Category ── */}
        {step === 1 && (
          <div className="space-y-6">

            {/* Name */}
            <FormField
              label="Club Name"
              required
              hint={`${form.name.length} / ${NAME_MAX}`}
              error={fieldErrors.name}
            >
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={NAME_MAX}
                placeholder="e.g. Robotics Society"
                autoFocus
                className={inputCls(!!fieldErrors.name)}
              />
            </FormField>

            {/* Category grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
                  Category <span className="text-red-400">*</span>
                </label>
              </div>
              {fieldErrors.category && (
                <p className="text-red-400 text-[11px] mb-2">{fieldErrors.category}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CLUB_CATEGORIES.map((cat) => {
                  const cm       = CLUB_CATEGORY_META[cat];
                  const selected = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => set("category", cat)}
                      className={`p-4 rounded-xl border text-left transition-all group ${
                        selected
                          ? "bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/20"
                          : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                        {cm.emoji}
                      </div>
                      <div className="text-sm font-medium text-white capitalize">{cat}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 leading-tight">{cm.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Description + Cover ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Preview strip */}
            {selectedCat && (
              <div className={`rounded-xl border border-white/[0.07] overflow-hidden bg-gradient-to-r ${selectedCat.color} p-4 flex items-center gap-3`}>
                <span className="text-2xl">{selectedCat.emoji}</span>
                <div>
                  <p className="font-semibold text-white text-sm">{form.name || "Club Name"}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{form.category}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <FormField
              label="Description"
              required
              hint={`${form.description.length} / ${DESC_MAX}`}
              error={fieldErrors.description}
            >
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={DESC_MAX}
                rows={5}
                placeholder="What is this club about? What do members do? Who should join?"
                className={`${inputCls(!!fieldErrors.description)} resize-none`}
              />
            </FormField>

            {/* Cover image URL */}
            <FormField
              label="Cover Image URL"
              hint="Optional"
              error={fieldErrors.coverImage}
            >
              <input
                type="url"
                value={form.coverImage}
                onChange={(e) => set("coverImage", e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className={inputCls(!!fieldErrors.coverImage)}
              />
              {form.coverImage && !fieldErrors.coverImage && (
                <div className="mt-2 h-24 rounded-xl overflow-hidden border border-white/[0.07]">
                  <img
                    src={form.coverImage}
                    alt="Preview"
                    className="w-full h-full object-cover opacity-50"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
              )}
            </FormField>

            {/* API error */}
            {apiError && (
              <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">
                {apiError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-white/[0.10] hover:border-white/[0.18] text-slate-400 hover:text-white rounded-xl text-sm transition-all"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating…
                  </span>
                ) : (
                  "Create Club 🚀"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Using shared `inputCls` and `FormField` component
