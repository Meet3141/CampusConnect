/**
* EditEvent.jsx
* Edit an existing event.
*
 * API:
*   GET /api/events/:id  → { success, data: Event }  (event.createdBy = raw ObjectId)
*   PUT /api/events/:id  body: { title?, description?, date?, endDate?, venue?, maxAttendees?,
*                                image?, category?, volunteer fields? }
*                        → { success, data: Event }
*
* Access: event.createdBy === user._id  OR  roles includes "orgAdmin"
*
* Status is derived by backend lifecycle/date sync and not manually edited here.
*/

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { EVENT_CATEGORIES, EVENT_CATEGORY_META } from "../../../theme";
import { fetchEventById, updateEvent } from "../api";
import Input from "../../../components/forms/Input";
import Textarea from "../../../components/forms/Textarea";
import Checkbox from "../../../components/forms/Checkbox";
import Switch from "../../../components/forms/Switch";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/feedback/Alert";
import Spinner from "../../../components/feedback/Spinner";
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";


/* Convert ISO date to datetime-local input format */
const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function EditEvent() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [event, setEvent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", category: "", date: "", endDate: "",
    venue: "", maxAttendees: "", image: "",
    showOnVolunteerHub: false, volunteerLimit: "", volunteerSkillsNeeded: "",
    countWarnings: false, allowGraceReview: true, strictAttendance: false,
    noShowThreshold: 2, warningLimit: 3,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  /* ── Fetch event ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetchEventById(id);
        const ev  = res.data.data;
        setEvent(ev);
        setForm({
          title:       ev.title       || "",
          description: ev.description || "",
          category:    ev.category    || "",
          date:        toDatetimeLocal(ev.date),
          endDate:     toDatetimeLocal(ev.endDate),
          venue:       ev.venue       || "",
          maxAttendees: ev.maxAttendees ? String(ev.maxAttendees) : "",
          image:       ev.image       || "",
          showOnVolunteerHub: ev.showOnVolunteerHub || false,
          volunteerLimit: ev.volunteerLimit ? String(ev.volunteerLimit) : "",
          volunteerSkillsNeeded: (ev.volunteerSkillsNeeded || []).join(", "),
          countWarnings: ev.attendancePolicy?.countWarnings ?? false,
          allowGraceReview: ev.attendancePolicy?.allowGraceReview ?? true,
          strictAttendance: ev.attendancePolicy?.strictAttendance ?? false,
          noShowThreshold: ev.attendancePolicy?.noShowThreshold ?? 2,
          warningLimit: ev.attendancePolicy?.warningLimit ?? 3,
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
    if (form.endDate && new Date(form.endDate) <= new Date(form.date)) e.endDate = "End time must be after start time.";
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
      if (form.maxAttendees) body.maxAttendees = Number(form.maxAttendees);
      if (form.image.trim()) body.image = form.image.trim();
      if (form.volunteerLimit) body.volunteerLimit = Number(form.volunteerLimit);
      if (form.volunteerSkillsNeeded.trim()) {
        body.volunteerSkillsNeeded = form.volunteerSkillsNeeded
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }

      await updateEvent(id, body);
      setSaved(true);
      setTimeout(() => navigate(`/events/${id}`), 800);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner.Page message="Loading event…" />;

  if (fetchErr) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-center">
        <div>
          <p className="text-[var(--cc-color-danger)] mb-4">{fetchErr}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2 btn-primary rounded-xl text-sm transition-colors">
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
          <h2 className="text-xl font-semibold text-[var(--cc-color-text-primary)] mb-2">Access Restricted</h2>
          <p className="text-[var(--cc-color-text-muted)] text-sm">Only the event creator, the club admin, or Org Admins can edit events.</p>
          <button onClick={() => navigate(`/events/${id}`)}
            className="mt-6 px-5 py-2.5 btn-primary rounded-xl text-sm transition-colors">
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-0 w-80 h-80 bg-[var(--cc-color-brand)]/[0.06] rounded-full blur-3xl" />
      </div>

      <PageHeader
        breadcrumb="Admin / Events / Edit"
        title={<>Edit <span className="cc-text-gradient">Event</span></>}
        subtitle={event?.title}
        actions={
          <button onClick={() => navigate(`/events/${id}`)} className="px-4 py-2 text-sm font-medium rounded-xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface-hover text-cc transition-colors">
            Back to Event
          </button>
        }
      />

      <PageContainer className="py-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <Input
            label="Event Title" required
            placeholder="e.g. Spring Hackathon 2026"
            value={form.title} onChange={(e) => set("title", e.target.value)}
            maxLength={200} error={fieldErrors.title}
          />

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-widest text-cc-muted font-medium">
              Category <span className="text-[var(--cc-color-danger)]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                const m   = EVENT_CATEGORY_META[cat];
                const sel = form.category === cat;
                return (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      sel ? "bg-[var(--cc-color-brand)]/20 border-[var(--cc-color-brand)]/60 ring-1 ring-[var(--cc-color-brand)]/20"
                        : "bg-cc-surface-weak border-cc-soft hover:border-cc-strong"
                    }`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg mb-2 bg-cc-surface">
                      {m.Icon && <m.Icon size={24} className="text-cc-muted" />}
                    </div>
                    <div className="text-xs font-medium text-cc capitalize">{cat}</div>
                  </button>
                );
              })}
            </div>
            {fieldErrors.category && <p className="text-[var(--cc-color-danger)] text-[11px]">⚠ {fieldErrors.category}</p>}
          </div>

          {/* Date & Venue */}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date &amp; Time" required type="datetime-local"
              value={form.date} onChange={(e) => set("date", e.target.value)} error={fieldErrors.date} />
            <Input label="Venue" required
              placeholder="e.g. Hall A, Block 3"
              value={form.venue} onChange={(e) => set("venue", e.target.value)} error={fieldErrors.venue} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="End Date &amp; Time" type="datetime-local"
              value={form.endDate} onChange={(e) => set("endDate", e.target.value)} error={fieldErrors.endDate} />
            <div className="flex items-end">
              {form.date && form.endDate && new Date(form.endDate) > new Date(form.date) && (
                <div className="rounded-xl surface-primary px-4 py-3 text-sm text-[var(--cc-color-text-primary)] w-full">
                  Duration: <span className="text-[var(--cc-color-text-primary)] font-medium">{formatDuration(new Date(form.endDate) - new Date(form.date))}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <Textarea
            label="Description" required rows={4} maxLength={2000}
            placeholder="Describe the event…"
            value={form.description} onChange={(e) => set("description", e.target.value)}
            error={fieldErrors.description}
          />

          {/* Optional */}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Max Attendees" hint="Optional" type="number" min={1}
              placeholder="Unlimited" value={form.maxAttendees} onChange={(e) => set("maxAttendees", e.target.value)} />
            <Input label="Image URL" hint="Optional" type="url"
              placeholder="https://…" value={form.image} onChange={(e) => set("image", e.target.value)} />
          </div>

          {/* Volunteer Settings */}
          <div className="rounded-2xl surface-primary p-4 space-y-4">
            <p className="text-[11px] uppercase tracking-widest text-[var(--cc-color-text-secondary)] font-semibold">Volunteer Settings</p>
            <Switch
              label="Show on Volunteer Hub"
              description="Allow users to apply as volunteers for this event"
              checked={form.showOnVolunteerHub}
              onChange={(v) => set("showOnVolunteerHub", v)}
            />
            {form.showOnVolunteerHub && (
              <>
                <Input label="Volunteer Spots Needed" hint="Optional" type="number" min={1}
                  placeholder="Unlimited" value={form.volunteerLimit}
                  onChange={(e) => set("volunteerLimit", e.target.value)} />
                <Input label="Skills Needed" hint="Comma-separated"
                  placeholder="e.g. Photography, Stage Setup, MCing"
                  value={form.volunteerSkillsNeeded} onChange={(e) => set("volunteerSkillsNeeded", e.target.value)} />
              </>
            )}
          </div>

          <div className="rounded-2xl surface-primary p-4 space-y-4">
            <p className="text-[11px] uppercase tracking-widest text-[var(--cc-color-text-secondary)] font-semibold">Attendance Policy</p>
            <Checkbox label="Count Warnings" checked={form.countWarnings} onChange={(e) => set("countWarnings", e.target.checked)} />
            <Checkbox label="Allow Grace Review" checked={form.allowGraceReview} onChange={(e) => set("allowGraceReview", e.target.checked)} />
            <Checkbox label="Strict Attendance" checked={form.strictAttendance} onChange={(e) => set("strictAttendance", e.target.checked)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="No-show Threshold" hint="Misses before warning" type="number" min={1}
                value={form.noShowThreshold} onChange={(e) => set("noShowThreshold", e.target.value)} />
              <Input label="Warning Limit" hint="Warnings before block" type="number" min={1}
                value={form.warningLimit} onChange={(e) => set("warningLimit", e.target.value)} />
            </div>
          </div>

          {apiError && <Alert variant="error" title={apiError} />}
          {saved && <Alert variant="success" title="✓ Changes saved — redirecting…" />}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate(`/events/${id}`)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={saving} disabled={saving || saved}>Save Changes</Button>
          </div>
        </form>
      </PageContainer>
    </div>
  );
}
