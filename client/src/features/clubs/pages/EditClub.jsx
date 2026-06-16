/**
 * EditClub.jsx
 * Edit an existing club's details.
 *
 * API:
 *   GET  /api/clubs/:id   → { success, data: Club }  club.adminId = { _id, name, email } (populated)
 *   PUT  /api/clubs/:id   body: { name?, description?, category?, coverImage? }
 *                         → { success, data: Club }
 *
 * Access: club.adminId._id === user._id  OR  roles includes "orgAdmin"
 * Backend also enforces this — frontend guard is for UX only.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import FormField from "../../../components/ui/FormField";
import { inputCls } from "../../../utils/inputCls";
import { CLUB_CATEGORIES, CLUB_CATEGORY_META } from "../../../theme";
import { fetchClubById, updateClub } from "../api";
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";

const NAME_MAX = 100;
const DESC_MAX = 1000;

// Using shared FormField and inputCls utilities

export default function EditClub() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [club, setClub]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  const [form, setForm] = useState({
    name: "", description: "", category: "", coverImage: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  /* ── Fetch existing club ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetchClubById(id);
        const c   = res.data.data;
        setClub(c);
        setForm({
          name:        c.name        || "",
          description: c.description || "",
          category:    c.category    || "",
          coverImage:  c.coverImage  || "",
        });
      } catch (err) {
        setFetchErr(err.response?.data?.message || "Failed to load club.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  /* ── Role/ownership check (after club loads) ── */
  const isOrgAdmin  = user?.roles?.includes("orgAdmin");
  const isClubAdmin = club && (
    String(club.adminId?._id || club.adminId) === String(user?._id)
  );
  const canEdit = isOrgAdmin || isClubAdmin;

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setFieldErrors((p) => ({ ...p, [key]: "" }));
    setApiError("");
    setSaved(false);
  };

  /* ── Validate ── */
  const validate = () => {
    const errs = {};
    const name = form.name.trim();
    if (name.length < 3)       errs.name = "Club name must be at least 3 characters.";
    if (name.length > NAME_MAX) errs.name = `Max ${NAME_MAX} characters.`;
    if (!form.category)         errs.category = "Please choose a category.";
    const desc = form.description.trim();
    if (desc.length < 20)      errs.description = "Description must be at least 20 characters.";
    if (desc.length > DESC_MAX) errs.description = `Max ${DESC_MAX} characters.`;
    if (form.coverImage && !/^https?:\/\/.+/.test(form.coverImage))
      errs.coverImage = "Must be a valid URL.";
    return errs;
  };

  /* ── Submit → PUT /api/clubs/:id ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSaving(true);
    setApiError("");
    try {
      const body = {
        name:        form.name.trim(),
        description: form.description.trim(),
        category:    form.category,
        coverImage:  form.coverImage.trim() || null,
      };
      await updateClub(id, body);
      setSaved(true);
      setTimeout(() => navigate(`/clubs/${id}`), 800);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-9 h-9 rounded-full border-2 border-[var(--cc-color-brand)] border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── Fetch error ── */
  if (fetchErr) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-center">
        <div>
          <p className="text-body-sm text-error mb-4">{fetchErr}</p>
          <button onClick={() => navigate(-1)}
            className="px-5 py-2 btn-primary rounded-xl text-body-sm transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          <div className="text-heading-xl mb-5">🔒</div>
          <h2 className="text-heading-md text-[var(--cc-color-text-primary)] mb-2">Access Restricted</h2>
          <p className="text-body-sm text-muted">You don't have permission to edit this club.</p>
          <button onClick={() => navigate(`/clubs/${id}`)}
            className="mt-6 px-5 py-2.5 btn-primary rounded-xl text-body-sm transition-colors">
            Back to Club
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        breadcrumb="Admin / Clubs / Edit"
        title={<>Edit <span className="cc-text-gradient">Club</span></>}
        subtitle="Changes are reflected immediately for all members."
        actions={
          <button onClick={() => navigate(`/clubs/${id}`)} className="px-4 py-2 text-sm font-medium rounded-xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface-hover text-cc transition-colors">
            Back to Club
          </button>
        }
      />

      {/* Form */}
      <PageContainer className="py-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <FormField label="Club Name" required hint={`${form.name.length} / ${NAME_MAX}`} error={fieldErrors.name}>
            <input
              type="text" value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={NAME_MAX} placeholder="e.g. Robotics Society"
              className={inputCls(!!fieldErrors.name)}
            />
          </FormField>

          {/* Category */}
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
                const cm  = CLUB_CATEGORY_META[cat];
                const sel = form.category === cat;
                return (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className={`p-3.5 rounded-xl border text-left transition-all group ${
                      sel
                        ? "bg-[var(--cc-color-brand)]/20 border-[var(--cc-color-brand)]/60 ring-1 ring-[var(--cc-color-brand)]/20"
                        : "bg-[var(--cc-color-surface)] border-[var(--cc-color-border)] hover:border-[var(--cc-color-border-strong)] hover:bg-[var(--cc-color-surface-hover)]"
                    }`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg mb-1.5 bg-cc-surface group-hover:scale-110 transition-transform">
                      {cm.Icon && <cm.Icon size={24} className="text-cc-muted" />}
                    </div>
                    <div className="text-body-sm font-semibold text-[var(--cc-color-text-primary)] capitalize">{cat}</div>
                    <div className="text-caption text-muted mt-0.5 leading-tight">{cm.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <FormField label="Description" required hint={`${form.description.length} / ${DESC_MAX}`} error={fieldErrors.description}>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={DESC_MAX} rows={5}
              placeholder="What is this club about?"
              className={`${inputCls(!!fieldErrors.description)} resize-none`}
            />
          </FormField>

          {/* Cover image */}
          <FormField label="Cover Image URL" hint="Optional" error={fieldErrors.coverImage}>
            <input
              type="url" value={form.coverImage}
              onChange={(e) => set("coverImage", e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className={inputCls(!!fieldErrors.coverImage)}
            />
            {form.coverImage && !fieldErrors.coverImage && (
              <div className="mt-2 h-24 rounded-xl overflow-hidden border border-[var(--cc-color-border)]">
                <img src={form.coverImage} alt="Preview"
                  className="w-full h-full object-cover opacity-50"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
            )}
          </FormField>

          {/* API error */}
          {apiError && (
            <div className="bg-[var(--cc-color-danger-soft)] border border-[var(--cc-color-danger)] rounded-xl p-4 text-[var(--cc-color-danger)] text-body-sm">
              {apiError}
            </div>
          )}

          {/* Success flash */}
          {saved && (
            <div className="bg-[var(--cc-color-success-soft)] border border-[var(--cc-color-success)] rounded-xl p-4 text-[var(--cc-color-success)] text-body-sm">
              ✓ Changes saved — redirecting…
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(`/clubs/${id}`)}
              className="flex-1 py-3 border border-[var(--cc-color-border-strong)] hover:border-[var(--cc-color-text-muted)] text-[var(--cc-color-text-muted)] hover:text-[var(--cc-color-text-primary)] rounded-xl text-body-sm transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving || saved}
              className="flex-1 py-3 btn-primary rounded-xl text-body-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </PageContainer>
    </div>
  );
}
