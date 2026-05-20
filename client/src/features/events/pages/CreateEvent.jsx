/**
 * CreateEvent.jsx
 * Event creation form for club admins.
 *
 * API: POST /events
 *      Body: { title, description, clubId, category, date, venue, maxAttendees?, image? }
 *      Requires auth + clubAdmin/orgAdmin role
 *
 * Pre-fills clubId from ?clubId= query param.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listClubs } from "../../clubs/api";
import { useAuth } from "../../../context/AuthContext";
import FormField from "../../../components/ui/FormField";
import { inputCls } from "../../../utils/inputCls";
import { useToast } from "../../../context/ToastContext";
import { EVENT_CATEGORIES, EVENT_CATEGORY_META } from "../../../theme";
import { createEvent as createEventApi } from "../api";

// Helper: format duration in ms to human readable string
const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const preClubId = searchParams.get("clubId") || "";

  const canCreate = user?.roles?.includes("clubAdmin") || user?.roles?.includes("orgAdmin");

  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", clubId: preClubId, category: "",
    date: "", endDate: "", venue: "", maxAttendees: "", image: "",
    // Volunteer programme
    showOnVolunteerHub: false,
    volunteerLimit: "",
    volunteerSkillsNeeded: "",   // comma-separated string, converted to array on submit
    // Attendance policy
    countWarnings: false,
    allowGraceReview: true,
    strictAttendance: false,
    noShowThreshold: 2,
    warningLimit: 3,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Fetch user's clubs for selector */
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await listClubs({ limit: 200 });
        const all = res.data.data || [];
        const adminClubs = all.filter(
          (c) => String(c.adminId?._id || c.adminId) === String(user?._id)
        );
        setClubs(adminClubs);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load clubs.");
      }
    };
    if (user) fetchClubs();
  }, [user]);

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 3) e.title = "Title must be at least 3 characters.";
    if (!form.description.trim() || form.description.trim().length < 10) e.description = "Description must be at least 10 characters.";
    if (!form.clubId) e.clubId = "Please select a club.";
    if (!form.category) e.category = "Please select a category.";
    if (!form.date) e.date = "Please select a date.";
    if (form.endDate && !form.date) e.endDate = "Set start date before end date.";
    if (form.endDate && new Date(form.endDate) <= new Date(form.date)) e.endDate = "End time must be after start time.";
    if (form.date && new Date(form.date) <= new Date()) e.date = "Date must be in the future.";
    if (!form.venue.trim()) e.venue = "Venue is required.";
    if (form.showOnVolunteerHub && !form.volunteerLimit) e.volunteerLimit = "Set a volunteer limit when listing on Volunteer Hub.";
    if (form.showOnVolunteerHub && form.volunteerLimit && Number(form.volunteerLimit) < 1) e.volunteerLimit = "Limit must be at least 1.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setApiError("");
    try {
      const body = {
        title:       form.title.trim(),
        description: form.description.trim(),
        clubId:      form.clubId,
        category:    form.category,
        date:        form.date,
        endDate:     form.endDate || null,
        venue:       form.venue.trim(),
        showOnVolunteerHub: form.showOnVolunteerHub,
        attendancePolicy: {
          countWarnings: form.countWarnings,
          allowGraceReview: form.allowGraceReview,
          strictAttendance: form.strictAttendance,
          noShowThreshold: Number(form.noShowThreshold) || 2,
          warningLimit: Number(form.warningLimit) || 3,
        },
      };
      if (form.maxAttendees)  body.maxAttendees = Number(form.maxAttendees);
      if (form.image.trim())  body.image = form.image.trim();
      if (form.showOnVolunteerHub) {
        body.volunteerLimit = Number(form.volunteerLimit);
        body.volunteerSkillsNeeded = form.volunteerSkillsNeeded
          .split(",").map((s) => s.trim()).filter(Boolean);
      }

      const res = await createEventApi(body);
      navigate(`/events/${res.data.data._id}`);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-xl font-semibold text-cc mb-2">Access Restricted</h2>
          <p className="text-cc-muted text-sm">Only club admins can create events.</p>
          <button onClick={() => navigate(-1)} className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-cc">
      <div className="max-w-xl mx-auto px-5 py-8">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-cc-muted hover:text-cc text-sm mb-8 transition-colors">
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Create an{" "}
            <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Event</span>
          </h1>
          <p className="text-cc-muted text-sm mt-2">Plan and schedule a new event for your club.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Club selector */}
          <FormField label="Club" required error={errors.clubId}>
            <select value={form.clubId} onChange={(e) => set("clubId", e.target.value)}
              className={inputCls(!!errors.clubId) + " cursor-pointer"}>
              <option value="" className="bg-cc-surface">Select a club…</option>
              {clubs.map((c) => (
                <option key={c._id} value={c._id} className="bg-cc-surface">{c.name}</option>
              ))}
            </select>
          </FormField>

          {/* Title */}
          <FormField label="Event Title" required error={errors.title}>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Spring Hackathon 2026" maxLength={200} className={inputCls(!!errors.title)} />
          </FormField>

          {/* Category */}
          <FormField label="Category" required error={errors.category}>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                const m = EVENT_CATEGORY_META[cat];
                const sel = form.category === cat;
                return (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      sel ? "bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/20"
                        : "bg-cc-surface-weak border-cc-soft hover-border-cc-strong"
                    }`}>
                    <div className="text-xl mb-1">{m.emoji}</div>
                    <div className="text-xs font-medium text-cc capitalize">{cat}</div>
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Date & Venue */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date & Time" required error={errors.date}>
              <input type="datetime-local" value={form.date} onChange={(e) => set("date", e.target.value)}
                className={inputCls(!!errors.date)} />
            </FormField>
            <FormField label="Venue" required error={errors.venue}>
              <input type="text" value={form.venue} onChange={(e) => set("venue", e.target.value)}
                placeholder="e.g. Hall A, Block 3" className={inputCls(!!errors.venue)} />
            </FormField>
          </div>

          {/* End time + duration display */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="End Date & Time" error={errors.endDate}>
              <input type="datetime-local" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                className={inputCls(!!errors.endDate)} />
            </FormField>
            <div className="flex items-center">
              {form.date && form.endDate && new Date(form.endDate) > new Date(form.date) && (
                <div className="text-sm text-cc-muted">
                  Duration: {formatDuration(new Date(form.endDate) - new Date(form.date))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <FormField label="Description" required error={errors.description}>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={4} maxLength={2000} placeholder="Describe the event…"
              className={inputCls(!!errors.description) + " resize-none"} />
          </FormField>

          {/* Optional: Max Attendees + Image */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Max Attendees" hint="Optional">
              <input type="number" value={form.maxAttendees} onChange={(e) => set("maxAttendees", e.target.value)}
                placeholder="Unlimited" min={1} className={inputCls(false)} />
            </FormField>
            <FormField label="Image URL" hint="Optional">
              <input type="url" value={form.image} onChange={(e) => set("image", e.target.value)}
                placeholder="https://..." className={inputCls(false)} />
            </FormField>
          </div>

          {/* ── Volunteer Programme ── */}
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cc">🙋 Volunteer Opportunities</p>
                <p className="text-[11px] text-cc-muted mt-0.5">
                  List this event on the Volunteer Hub so students can apply to help out.
                </p>
              </div>
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => set("showOnVolunteerHub", !form.showOnVolunteerHub)}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                  form.showOnVolunteerHub ? "bg-indigo-600" : "bg-cc-surface"
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.showOnVolunteerHub ? "left-7" : "left-1"
                }`} />
              </button>
            </div>

            {form.showOnVolunteerHub && (
              <div className="space-y-4 pt-1 border-t border-cc-soft">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Volunteer Limit" required error={errors.volunteerLimit}>
                    <input
                      type="number"
                      value={form.volunteerLimit}
                      onChange={(e) => set("volunteerLimit", e.target.value)}
                      placeholder="e.g. 10"
                      min={1}
                      className={inputCls(!!errors.volunteerLimit)}
                    />
                  </FormField>
                </div>
                <FormField label="Preferred Skills" hint="comma-separated, optional">
                  <input
                    type="text"
                    value={form.volunteerSkillsNeeded}
                    onChange={(e) => set("volunteerSkillsNeeded", e.target.value)}
                    placeholder="e.g. Photography, Stage Setup, MCing, Design"
                    className={inputCls(false)}
                  />
                  <p className="text-[11px] text-slate-600 mt-1.5">
                    These are shown to applicants so they know what you're looking for.
                  </p>
                </FormField>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-cc">🎯 Attendance Policy</p>
              <p className="text-[11px] text-cc-muted mt-0.5">Control warning and review behavior for this event.</p>
            </div>
            <label className="flex items-center gap-3 text-sm text-cc cursor-pointer">
              <input type="checkbox" checked={form.countWarnings} onChange={(e) => set("countWarnings", e.target.checked)} />
              Count Warnings
            </label>
            <label className="flex items-center gap-3 text-sm text-cc cursor-pointer">
              <input type="checkbox" checked={form.allowGraceReview} onChange={(e) => set("allowGraceReview", e.target.checked)} />
              Allow Grace Review
            </label>
            <label className="flex items-center gap-3 text-sm text-cc cursor-pointer">
              <input type="checkbox" checked={form.strictAttendance} onChange={(e) => set("strictAttendance", e.target.checked)} />
              Strict Attendance
            </label>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="No-show Threshold" hint="Misses before warning/review">
                <input type="number" min={1} value={form.noShowThreshold} onChange={(e) => set("noShowThreshold", e.target.value)} className={inputCls(false)} />
              </FormField>
              <FormField label="Warning Limit" hint="Warnings before block">
                <input type="number" min={1} value={form.warningLimit} onChange={(e) => set("warningLimit", e.target.value)} className={inputCls(false)} />
              </FormField>
            </div>
          </div>

          {apiError && (
            <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">{apiError}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </span>
            ) : "Create Event 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Using shared FormField and inputCls utilities from components and utils
