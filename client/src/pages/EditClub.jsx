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
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["technical", "cultural", "sports", "academic", "arts", "other"];
const CATEGORY_META = {
  technical: { emoji: "⚙️", desc: "Coding, robotics, engineering"  },
  cultural:  { emoji: "🎭", desc: "Drama, music, festivals"         },
  sports:    { emoji: "⚡", desc: "Athletics, fitness, competition" },
  academic:  { emoji: "📚", desc: "Research, debate, study groups"  },
  arts:      { emoji: "🎨", desc: "Visual arts, design, film"       },
  other:     { emoji: "🌐", desc: "Everything else"                 },
};

const NAME_MAX = 100;
const DESC_MAX = 1000;

const inputCls = (err) =>
  `w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all ${
    err
      ? "border-red-800 focus:border-red-600"
      : "border-white/[0.08] focus:border-indigo-500/60 focus:bg-white/[0.06]"
  }`;

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[11px] text-slate-700 font-mono">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-red-400 text-[11px] mt-1.5">{error}</p>}
    </div>
  );
}

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
        const res = await api.get(`/clubs/${id}`);
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

  /* ── Role check (after club loads) ── */
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
      await api.put(`/clubs/${id}`, body);
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
        <div className="w-9 h-9 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── Fetch error ── */
  if (fetchErr) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-center">
        <div>
          <p className="text-red-400 mb-4">{fetchErr}</p>
          <button onClick={() => navigate(-1)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Permission gate ── */
  if (!canEdit) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm">You don't have permission to edit this club.</p>
          <button onClick={() => navigate(`/clubs/${id}`)}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Back to Club
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-0 w-80 h-80 bg-indigo-700/6 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-3">
            Admin / Clubs / Edit
          </p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Edit{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Club
                </span>
              </h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Changes are reflected immediately for all members.
              </p>
            </div>
            <button
              onClick={() => navigate(`/clubs/${id}`)}
              className="shrink-0 px-4 py-2 border border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white rounded-xl text-sm transition-all"
            >
              ← Back to Club
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 lg:px-6 py-6">
        <form onSubmit={handleSubmit} className="max-w-xl space-y-6">

          {/* Name */}
          <Field label="Club Name" required hint={`${form.name.length} / ${NAME_MAX}`} error={fieldErrors.name}>
            <input
              type="text" value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={NAME_MAX} placeholder="e.g. Robotics Society"
              className={inputCls(!!fieldErrors.name)}
            />
          </Field>

          {/* Category */}
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
              {CATEGORIES.map((cat) => {
                const cm  = CATEGORY_META[cat];
                const sel = form.category === cat;
                return (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className={`p-3.5 rounded-xl border text-left transition-all group ${
                      sel
                        ? "bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/20"
                        : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.05]"
                    }`}>
                    <div className="text-xl mb-1.5 group-hover:scale-110 transition-transform">{cm.emoji}</div>
                    <div className="text-sm font-medium text-white capitalize">{cat}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-tight">{cm.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <Field label="Description" required hint={`${form.description.length} / ${DESC_MAX}`} error={fieldErrors.description}>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={DESC_MAX} rows={5}
              placeholder="What is this club about?"
              className={`${inputCls(!!fieldErrors.description)} resize-none`}
            />
          </Field>

          {/* Cover image */}
          <Field label="Cover Image URL" hint="Optional" error={fieldErrors.coverImage}>
            <input
              type="url" value={form.coverImage}
              onChange={(e) => set("coverImage", e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className={inputCls(!!fieldErrors.coverImage)}
            />
            {form.coverImage && !fieldErrors.coverImage && (
              <div className="mt-2 h-24 rounded-xl overflow-hidden border border-white/[0.07]">
                <img src={form.coverImage} alt="Preview"
                  className="w-full h-full object-cover opacity-50"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
            )}
          </Field>

          {/* API error */}
          {apiError && (
            <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">
              {apiError}
            </div>
          )}

          {/* Success flash */}
          {saved && (
            <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-xl p-4 text-emerald-400 text-sm">
              ✓ Changes saved — redirecting…
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(`/clubs/${id}`)}
              className="flex-1 py-3 border border-white/[0.10] hover:border-white/[0.18] text-slate-400 hover:text-white rounded-xl text-sm transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving || saved}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
