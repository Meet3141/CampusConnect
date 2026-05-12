/**
 * EditEvent.jsx
 * Edit an existing event.
 *
 * API:
 *   GET /api/events/:id  → { success, data: Event }  (event.createdBy = raw ObjectId)
 *   PUT /api/events/:id  body: { title?, description?, date?, venue?, maxAttendees?,
 *                                image?, category?, volunteer fields? }
 *                        → { success, data: Event }
 *
 * Access: event.createdBy === user._id  OR  roles includes "orgAdmin"
 *
 * Status is derived by backend lifecycle/date sync and not manually edited here.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import FormField from "../components/FormField";
import { inputCls } from "../utils/inputCls";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_META,
} from "../theme";


/* Convert ISO date to datetime-local input format */
const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EditEvent() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [event, setEvent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", category: "", date: "",
    venue: "", maxAttendees: "", image: "",
    showOnVolunteerHub: false, volunteerLimit: "", volunteerSkillsNeeded: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  /* ── Fetch event ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        const ev  = res.data.data;
        setEvent(ev);
        setForm({
          title:       ev.title       || "",
          description: ev.description || "",
          category:    ev.category    || "",
          date:        toDatetimeLocal(ev.date),
          venue:       ev.venue       || "",
          maxAttendees: ev.maxAttendees ? String(ev.maxAttendees) : "",
          image:       ev.image       || "",
          showOnVolunteerHub: ev.showOnVolunteerHub || false,
          volunteerLimit: ev.volunteerLimit ? String(ev.volunteerLimit) : "",
          volunteerSkillsNeeded: (ev.volunteerSkillsNeeded || []).join(", "),
        });
      } catch (err) {
        setFetchErr(err.response?.data?.message || "Failed to load event.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  /* ── Role/ownership check ── */
  const isOrgAdmin = user?.roles?.includes("orgAdmin");
  const isCreator  = event && String(event.createdBy?._id || event.createdBy) === String(user?._id);
  const isClubAdminOfEvent = event && String(event?.clubId?.adminId?._id || event?.clubId?.adminId) === String(user?._id);
  const canEdit    = isOrgAdmin || isCreator || isClubAdminOfEvent;

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setFieldErrors((p) => ({ ...p, [key]: "" }));
    setApiError("");
    setSaved(false);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 3)
      e.title = "Title must be at least 3 characters.";
    if (!form.description.trim() || form.description.trim().length < 10)
      e.description = "Description must be at least 10 characters.";
    if (!form.category) e.category = "Please select a category.";
    if (!form.date)     e.date = "Please select a date.";
    if (!form.venue.trim()) e.venue = "Venue is required.";
    return e;
  };

  /* ── Submit → PUT /api/events/:id ── */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSaving(true);
    setApiError("");
    try {
      const body = {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        date:        form.date,
        venue:       form.venue.trim(),
        showOnVolunteerHub: form.showOnVolunteerHub,
      };
      if (form.maxAttendees) body.maxAttendees = Number(form.maxAttendees);
      if (form.image.trim()) body.image = form.image.trim();
      if (form.volunteerLimit) body.volunteerLimit = Number(form.volunteerLimit);
      if (form.volunteerSkillsNeeded.trim()) {
        body.volunteerSkillsNeeded = form.volunteerSkillsNeeded
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }

      await api.put(`/events/${id}`, body);
      setSaved(true);
      setTimeout(() => navigate(`/events/${id}`), 800);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-9 h-9 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (fetchErr) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-center">
        <div>
          <p className="text-red-400 mb-4">{fetchErr}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
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
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm">Only the event creator, the club admin, or Org Admins can edit events.</p>
          <button onClick={() => navigate(`/events/${id}`)}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Back to Event
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
          <div className="absolute -top-32 right-0 w-80 h-80 bg-indigo-700/6 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-3">
            Admin / Events / Edit
          </p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Edit{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Event
                </span>
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 truncate max-w-sm">
                {event?.title}
              </p>
            </div>
            <button onClick={() => navigate(`/events/${id}`)}
              className="shrink-0 px-4 py-2 border border-white/[0.08] hover:border-white/[0.15] text-slate-400 hover:text-white rounded-xl text-sm transition-all">
              ← Back to Event
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 lg:px-6 py-6">
        <form onSubmit={handleSubmit} className="max-w-xl space-y-5">

          {/* Title */}
          <FormField label="Event Title" required error={fieldErrors.title}>
            <input type="text" value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={200} placeholder="e.g. Spring Hackathon 2026"
              className={inputCls(!!fieldErrors.title)} />
          </FormField>

          {/* Category */}
          <FormField label="Category" required error={fieldErrors.category}>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                const m   = EVENT_CATEGORY_META[cat];
                const sel = form.category === cat;
                return (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      sel
                        ? "bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/20"
                        : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15]"
                    }`}>
                    <div className="text-xl mb-1">{m.emoji}</div>
                    <div className="text-xs font-medium text-white capitalize">{cat}</div>
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Date & Venue */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date & Time" required error={fieldErrors.date}>
              <input type="datetime-local" value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={inputCls(!!fieldErrors.date)} />
            </FormField>
            <FormField label="Venue" required error={fieldErrors.venue}>
              <input type="text" value={form.venue}
                onChange={(e) => set("venue", e.target.value)}
                placeholder="e.g. Hall A, Block 3"
                className={inputCls(!!fieldErrors.venue)} />
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Description" required error={fieldErrors.description}>
            <textarea value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4} maxLength={2000} placeholder="Describe the event…"
              className={`${inputCls(!!fieldErrors.description)} resize-none`} />
          </FormField>

          {/* Optional */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Max Attendees" hint="Optional">
              <input type="number" value={form.maxAttendees}
                onChange={(e) => set("maxAttendees", e.target.value)}
                placeholder="Unlimited" min={1}
                className={inputCls(false)} />
            </FormField>
            <FormField label="Image URL" hint="Optional">
              <input type="url" value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://…"
                className={inputCls(false)} />
            </FormField>
          </div>

          {/* Volunteer Settings */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold">
              Volunteer Settings
            </p>
            
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.showOnVolunteerHub}
                  onChange={(e) => set("showOnVolunteerHub", e.target.checked)}
                  className="w-5 h-5 rounded border-white/[0.2] bg-white/[0.05] accent-indigo-500" />
                <span className="text-sm font-medium text-slate-300">Show on Volunteer Hub</span>
              </label>
              <p className="text-xs text-slate-500 mt-1.5 ml-8">
                Allow users to apply as volunteers for this event
              </p>
            </div>

            {form.showOnVolunteerHub && (
              <>
                <FormField label="Volunteer Spots Needed" hint="Optional">
                  <input type="number" value={form.volunteerLimit}
                    onChange={(e) => set("volunteerLimit", e.target.value)}
                    placeholder="Unlimited" min={1}
                    className={inputCls(false)} />
                </FormField>
                <FormField label="Skills Needed" hint="Comma-separated (e.g. Photography, MC, Setup)">
                  <input type="text" value={form.volunteerSkillsNeeded}
                    onChange={(e) => set("volunteerSkillsNeeded", e.target.value)}
                    placeholder="e.g. Photography, Stage Setup, MCing"
                    className={inputCls(false)} />
                </FormField>
              </>
            )}
          </div>

          {apiError && (
            <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">
              {apiError}
            </div>
          )}
          {saved && (
            <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-xl p-4 text-emerald-400 text-sm">
              ✓ Changes saved — redirecting…
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(`/events/${id}`)}
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
