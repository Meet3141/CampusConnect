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
import { useToast } from "../../../context/ToastContext";
import { EVENT_CATEGORIES, EVENT_CATEGORY_META } from "../../../theme";
import { createEvent as createEventApi } from "../api";
import Input from "../../../components/forms/Input";
import Textarea from "../../../components/forms/Textarea";
import Select from "../../../components/forms/Select";
import Checkbox from "../../../components/forms/Checkbox";
import Switch from "../../../components/forms/Switch";
import Alert from "../../../components/feedback/Alert";
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";

// Helper: format duration in ms to human readable string
const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const POLICY_RECOMMENDATIONS = {
  hackathon: { strictAttendance: true, countWarnings: true, allowGraceReview: true, reason: "Hackathons have limited seats and resource planning." },
  workshop: { strictAttendance: true, countWarnings: true, allowGraceReview: true, reason: "Workshops require strict seat management but allow a buffer." },
  "placement training": { strictAttendance: true, countWarnings: false, allowGraceReview: true, reason: "Mandatory for careers. Skips warnings directly to review." },
  "industry visit": { strictAttendance: true, countWarnings: false, allowGraceReview: false, reason: "Hard limits on transport. Zero tolerance for no-shows." },
  "recruitment drive": { strictAttendance: false, countWarnings: false, allowGraceReview: true, reason: "High turnout desired. Penalizing can hurt club growth." },
  "alumni session": { strictAttendance: false, countWarnings: false, allowGraceReview: false, reason: "Casual drop-ins allowed." },
  "cultural night": { strictAttendance: false, countWarnings: false, allowGraceReview: false, reason: "Open ground event. RSVPs are for headcount only." },
  "freshers party": { strictAttendance: false, countWarnings: false, allowGraceReview: false, reason: "Casual, high-volume event." },
  "volunteer meeting": { strictAttendance: false, countWarnings: false, allowGraceReview: true, reason: "Encourage volunteering without scaring them away." },
  "technical seminar": { strictAttendance: false, countWarnings: false, allowGraceReview: false, reason: "Optional seminar, tracking is generally for analytics." },
};

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const preClubId = searchParams.get("clubId") || "";

  const isAdminRole = user?.roles?.includes("clubAdmin") || user?.roles?.includes("orgAdmin");
  // Coordinators come in from ClubDetail with a pre-filled clubId — allow them through
  const canCreate = isAdminRole || !!preClubId;

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
        let adminClubs;
        if (isAdminRole) {
          // clubAdmin / orgAdmin: show only clubs they directly admin
          adminClubs = all.filter(
            (c) => String(c.adminId?._id || c.adminId) === String(user?._id)
          );
        } else if (preClubId) {
          // Coordinator: pre-filtered to the specific club they came from
          adminClubs = all.filter((c) => String(c._id) === preClubId);
        } else {
          adminClubs = [];
        }
        setClubs(adminClubs);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load clubs.");
      }
    };
    if (user) fetchClubs();
  }, [user, isAdminRole, preClubId, toast]);

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
    if (form.strictAttendance && Number(form.warningLimit) < Number(form.noShowThreshold) + 2) {
      e.warningLimit = "Limit must be at least threshold + 2.";
    }
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
          countWarnings: form.strictAttendance ? form.countWarnings : false,
          allowGraceReview: form.strictAttendance ? form.allowGraceReview : false,
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

  return (
    <div className="w-full">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[var(--cc-color-brand)]/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-700/[0.06] rounded-full blur-3xl" />
      </div>

      <PageHeader
        breadcrumb="Dashboard / Events / New"
        title={<>Create an <span className="cc-text-gradient">Event</span></>}
        subtitle="Plan and schedule a new event for your club."
        actions={
          <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm font-medium rounded-xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface-hover text-cc transition-colors">
            Go Back
          </button>
        }
      />

      <PageContainer className="py-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Club"
            required
            error={errors.clubId}
            value={form.clubId}
            onChange={(e) => set("clubId", e.target.value)}
          >
            <option value="" className="bg-cc-surface">Select a club…</option>
            {clubs.map((c) => (
              <option key={c._id} value={c._id} className="bg-cc-surface">
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="Event Title"
            required
            placeholder="e.g. Spring Hackathon 2026"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={200}
            error={errors.title}
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-label text-muted">
                Category <span className="text-[var(--cc-color-danger)]">*</span>
              </label>
            </div>
            {errors.category && <p className="text-micro text-error mb-2">{errors.category}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EVENT_CATEGORIES.map((cat) => {
                const m = EVENT_CATEGORY_META[cat];
                const sel = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set("category", cat)}
                    className={`p-4 rounded-xl border text-left transition-all group ${
                      sel
                        ? "bg-[var(--cc-color-brand)]/20 border-[var(--cc-color-brand)]/60 ring-1 ring-[var(--cc-color-brand)]/20"
                        : "bg-[var(--cc-color-surface)] border-[var(--cc-color-border)] hover:border-[var(--cc-color-border-strong)] hover:bg-[var(--cc-color-surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl mb-2 bg-cc-surface group-hover:scale-110 transition-transform">
                      {m.Icon && <m.Icon size={24} className="text-cc-muted" />}
                    </div>
                    <div className="text-body-sm font-semibold text-[var(--cc-color-text-primary)] capitalize">{cat}</div>
                    <div className="text-caption text-muted mt-0.5 leading-tight">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date &amp; Time"
              required
              type="datetime-local"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              error={errors.date}
            />
            <Input
              label="Venue"
              required
              placeholder="e.g. Hall A, Block 3"
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              error={errors.venue}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="End Date &amp; Time"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              error={errors.endDate}
            />
            <div className="flex items-end pb-2">
              {form.date && form.endDate && new Date(form.endDate) > new Date(form.date) && (
                <p className="text-sm text-cc-muted">
                  Duration: {formatDuration(new Date(form.endDate) - new Date(form.date))}
                </p>
              )}
            </div>
          </div>

          <Textarea
            label="Description"
            required
            rows={4}
            maxLength={2000}
            placeholder="Describe the event…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Max Attendees"
              hint="Optional"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={form.maxAttendees}
              onChange={(e) => set("maxAttendees", e.target.value)}
            />
            <Input
              label="Image URL"
              hint="Optional"
              type="url"
              placeholder="https://…"
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
            />
          </div>

          <div className="rounded-2xl surface-primary p-5 space-y-4">
            <Switch
              label="Volunteer Opportunities"
              description="List this event on the Volunteer Hub so students can apply to help out."
              checked={form.showOnVolunteerHub}
              onChange={(v) => set("showOnVolunteerHub", v)}
            />
            {form.showOnVolunteerHub && (
              <div className="space-y-4 pt-1 border-t border-[var(--cc-color-border)]">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Volunteer Limit"
                    required
                    type="number"
                    min={1}
                    placeholder="e.g. 10"
                    value={form.volunteerLimit}
                    onChange={(e) => set("volunteerLimit", e.target.value)}
                    error={errors.volunteerLimit}
                  />
                </div>
                <Input
                  label="Preferred Skills"
                  hint="comma-separated, optional"
                  placeholder="e.g. Photography, Stage Setup"
                  value={form.volunteerSkillsNeeded}
                  onChange={(e) => set("volunteerSkillsNeeded", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl surface-primary p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--cc-color-text-primary)]">Attendance Policy</p>
              <p className="text-[11px] text-muted mt-0.5">Control warning and review behavior for this event.</p>
            </div>

            {form.category && POLICY_RECOMMENDATIONS[form.category.toLowerCase()] && (
              <div className="p-4 bg-[var(--cc-color-brand)]/10 border border-[var(--cc-color-brand)]/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--cc-color-brand)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Recommended Configuration
                </div>
                <div className="text-xs text-cc-muted flex gap-4">
                   <span>Strict: <span className="font-bold text-cc">{POLICY_RECOMMENDATIONS[form.category.toLowerCase()].strictAttendance ? "ON" : "OFF"}</span></span>
                   <span>Warnings: <span className="font-bold text-cc">{POLICY_RECOMMENDATIONS[form.category.toLowerCase()].countWarnings ? "ON" : "OFF"}</span></span>
                   <span>Grace: <span className="font-bold text-cc">{POLICY_RECOMMENDATIONS[form.category.toLowerCase()].allowGraceReview ? "ON" : "OFF"}</span></span>
                </div>
                <p className="text-xs text-cc-muted italic">Reason: {POLICY_RECOMMENDATIONS[form.category.toLowerCase()].reason}</p>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--cc-color-brand)] text-white hover:opacity-90 transition-opacity"
                  onClick={() => {
                    set("strictAttendance", POLICY_RECOMMENDATIONS[form.category.toLowerCase()].strictAttendance);
                    set("countWarnings", POLICY_RECOMMENDATIONS[form.category.toLowerCase()].countWarnings);
                    set("allowGraceReview", POLICY_RECOMMENDATIONS[form.category.toLowerCase()].allowGraceReview);
                  }}
                >
                  Apply Recommendations
                </button>
              </div>
            )}

            <Switch
              label="Strict Attendance (Master Switch)"
              description="Enable to enforce punitive measures for no-shows. If OFF, other settings are ignored."
              checked={form.strictAttendance}
              onChange={(v) => set("strictAttendance", v)}
            />

            <div className={`space-y-4 transition-opacity ${!form.strictAttendance ? 'opacity-40 pointer-events-none' : ''}`}>
              <Checkbox
                label="Count Warnings"
                checked={form.countWarnings}
                onChange={(e) => set("countWarnings", e.target.checked)}
              />
              <Checkbox
                label="Allow Grace Review"
                checked={form.allowGraceReview}
                onChange={(e) => set("allowGraceReview", e.target.checked)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="No-show Threshold"
                  hint="Misses before warning"
                  type="number"
                  min={1}
                  value={form.noShowThreshold}
                  onChange={(e) => set("noShowThreshold", e.target.value)}
                />
                <Input
                  label="Warning Limit"
                  hint="Warnings before block"
                  type="number"
                  min={1}
                  value={form.warningLimit}
                  onChange={(e) => set("warningLimit", e.target.value)}
                  error={errors.warningLimit}
                />
              </div>
            </div>

            {form.category && POLICY_RECOMMENDATIONS[form.category.toLowerCase()] && form.strictAttendance !== POLICY_RECOMMENDATIONS[form.category.toLowerCase()].strictAttendance && (
              <div className="text-xs text-[var(--cc-color-danger)] mt-2">
                ⚠ This differs from the recommended configuration for {form.category} events.
              </div>
            )}
          </div>

          {apiError && <Alert variant="error" title={apiError} />}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 btn-primary rounded-xl text-body-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create Event"}
          </button>
        </form>
      </PageContainer>
    </div>
  );
}
