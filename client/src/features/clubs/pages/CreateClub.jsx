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
import { useAuth } from "../../../context/AuthContext";
import FormField from "../../../components/ui/FormField";
import { inputCls } from "../../../utils/inputCls";
import { CLUB_CATEGORIES, CLUB_CATEGORY_META } from "../../../theme";
import { createClub } from "../api";
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";

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

      const res = await createClub(body);
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
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--cc-color-surface-elevated)]">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-heading-md text-[var(--cc-color-text-primary)] mb-2">Access Restricted</h2>
          <p className="text-body-sm text-muted text-relaxed">
            Only users with <span className="text-accent">Club Admin</span> or{" "}
            <span className="text-accent">Org Admin</span> roles can create clubs.
          </p>
          <button
            onClick={() => navigate("/clubs")}
            className="mt-6 px-5 py-2.5 btn-primary rounded-xl text-body-sm transition-colors"
          >
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  const selectedCat = CLUB_CATEGORY_META[form.category];

  return (
    <div className="w-full">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[var(--cc-color-brand)]/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-700/[0.06] rounded-full blur-3xl" />
      </div>

      <PageHeader
        breadcrumb="Dashboard / Clubs / New"
        title={<>Create a <span className="cc-text-gradient">Club</span></>}
        subtitle="Build a community around a shared interest."
        actions={
          <button onClick={() => (step === 1 ? navigate("/clubs") : setStep(1))} className="px-4 py-2 text-sm font-medium rounded-xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface-hover text-cc transition-colors">
            {step === 1 ? "Back to Clubs" : "Back to Step 1"}
          </button>
        }
      />

      <PageContainer className="py-6 max-w-xl mx-auto">

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-9">
          {[1, 2].map((s, idx) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold transition-all ${
                step === s
                  ? "bg-[var(--cc-color-brand)] text-[var(--cc-color-on-brand)]"
                  : s < step
                  ? "bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border border-[var(--cc-color-success)]"
                  : "bg-[var(--cc-color-surface-elevated)] text-[var(--cc-color-text-secondary)] border border-[var(--cc-color-border)]"
              }`}>
                {s < step ? "✓" : s}
              </div>
              <span className={`text-caption font-semibold ${step === s ? "text-[var(--cc-color-text-primary)]" : "text-[var(--cc-color-text-secondary)]"}`}>
                {s === 1 ? "Basics" : "Details"}
              </span>
              {idx < 1 && (
                <div className={`w-10 h-px ${step > s ? "bg-[var(--cc-color-success)]" : "bg-[var(--cc-color-border)]"}`} />
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
                <label className="text-label text-muted">
                  Category <span className="text-[var(--cc-color-danger)]">*</span>
                </label>
              </div>
              {fieldErrors.category && (
                <p className="text-micro text-error mb-2">{fieldErrors.category}</p>
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
                          ? "bg-[var(--cc-color-brand)]/20 border-[var(--cc-color-brand)]/60 ring-1 ring-[var(--cc-color-brand)]/20"
                          : "bg-[var(--cc-color-surface)] border-[var(--cc-color-border)] hover:border-[var(--cc-color-border-strong)] hover:bg-[var(--cc-color-surface-hover)]"
                      }`}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl mb-2 bg-cc-surface group-hover:scale-110 transition-transform">
                        {cm.Icon && <cm.Icon size={24} className="text-cc-muted" />}
                      </div>
                      <div className="text-body-sm font-semibold text-[var(--cc-color-text-primary)] capitalize">{cat}</div>
                      <div className="text-caption text-muted mt-0.5 leading-tight">{cm.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              className="w-full py-3 btn-primary rounded-xl font-semibold text-body-sm transition-colors"
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
              <div className={`rounded-xl border border-[var(--cc-color-border)] overflow-hidden bg-gradient-to-r ${selectedCat.color} p-4 flex items-center gap-3`}>
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10">
                  {selectedCat.Icon && <selectedCat.Icon size={24} className="text-[var(--cc-color-text-primary)]/80" />}
                </span>
                <div>
                  <p className="font-semibold text-[var(--cc-color-text-primary)] text-body-sm">{form.name || "Club Name"}</p>
                  <p className="text-caption text-muted capitalize">{form.category}</p>
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
                <div className="mt-2 h-24 rounded-xl overflow-hidden border border-[var(--cc-color-border)]">
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
              <div className="bg-[var(--cc-color-danger-soft)] border border-[var(--cc-color-danger)] rounded-xl p-4 text-[var(--cc-color-danger)] text-body-sm">
                {apiError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-[var(--cc-color-border-strong)] hover:border-[var(--cc-color-text-muted)] text-[var(--cc-color-text-muted)] hover:text-[var(--cc-color-text-primary)] rounded-xl text-body-sm transition-all"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 btn-primary rounded-xl text-body-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </PageContainer>
    </div>
  );
}

// Using shared `inputCls` and `FormField` component
