/**
 * CreateExternalEvent.jsx
 * Submit a new external event — with optional OCR poster extraction.
 *
 * API: POST /external-events/ocr/extract  body: { imageUrl }  → extracted fields
 *      POST /external-events              body: { title, description, universityName, date, venue, category, registrationLink, posterUrl }
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../../../components/ui/FormField";
import Input from "../../../components/forms/Input";
import Textarea from "../../../components/forms/Textarea";
import Button from "../../../components/ui/Button";
import { useToast } from "../../../context/ToastContext";
import { createExternalEvent as createExternalEventApi, extractExternalEventOcr } from "../api";
import { Code2, Wrench, Mic, Drama, Zap, Landmark, Trophy, Search } from "lucide-react";

const CATEGORIES = ["hackathon", "workshop", "webinar", "cultural", "sports", "conference", "competition"];
const CAT_META = {
  hackathon:   { Icon: Code2    },
  workshop:    { Icon: Wrench   },
  webinar:     { Icon: Mic      },
  cultural:    { Icon: Drama    },
  sports:      { Icon: Zap      },
  conference:  { Icon: Landmark },
  competition: { Icon: Trophy   },
};

export default function CreateExternalEvent() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    title: "", description: "", universityName: "", date: "",
    venue: "", category: "", registrationLink: "", posterUrl: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── OCR extraction ── */
  const [ocrUrl, setOcrUrl] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);

  const handleOcrExtract = async () => {
    if (!ocrUrl.trim()) return;
    setOcrLoading(true);
    setOcrDone(false);
    try {
      const res = await extractExternalEventOcr(ocrUrl.trim());
      const data = res.data.data || {};
      // Auto-fill form fields from OCR results
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        universityName: data.universityName || prev.universityName,
        date: data.date ? new Date(data.date).toISOString().slice(0, 16) : prev.date,
        venue: data.venue || prev.venue,
        category: data.category || prev.category,
        registrationLink: data.registrationLink || prev.registrationLink,
        posterUrl: ocrUrl.trim(),
      }));
      setOcrDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "OCR extraction failed.");
    } finally {
      setOcrLoading(false);
    }
  };

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 3) e.title = "Title must be at least 3 characters.";
    if (!form.description.trim() || form.description.trim().length < 10) e.description = "Description must be at least 10 characters.";
    if (!form.universityName.trim()) e.universityName = "University name is required.";
    if (!form.category) e.category = "Select a category.";
    if (!form.date) e.date = "Date is required.";
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
        title: form.title.trim(),
        description: form.description.trim(),
        universityName: form.universityName.trim(),
        category: form.category,
        date: form.date,
      };
      if (form.venue.trim()) body.venue = form.venue.trim();
      if (form.registrationLink.trim()) body.registrationLink = form.registrationLink.trim();
      if (form.posterUrl.trim()) body.posterUrl = form.posterUrl.trim();

      await createExternalEventApi(body);
      navigate("/external-events");
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to submit event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-[var(--cc-color-text-primary)]">
      <div className="max-w-xl mx-auto px-5 py-8">
        <button onClick={() => navigate("/external-events")} className="group flex items-center gap-2 text-[var(--cc-color-text-muted)] hover:text-[var(--cc-color-text-primary)] text-sm mb-8 transition-colors">
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to External Events
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Submit{" "}
            <span className="cc-text-gradient">External Event</span>
          </h1>
          <p className="text-[var(--cc-color-text-muted)] text-sm mt-2">Share an event from another university or community.</p>
        </div>

        {/* ── OCR Extraction Panel ── */}
        <div className="rounded-2xl border border-dashed border-[var(--cc-color-border-strong)] bg-[var(--cc-color-surface)] p-5 mb-6">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Search size={16} className="shrink-0" /> Auto-fill from poster
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-violet-950 text-violet-300 border border-violet-800 rounded-full font-medium">OCR</span>
          </h3>
          <p className="text-[11px] text-[var(--cc-color-text-muted)] mb-3">Paste a poster image URL and we'll extract event details automatically.</p>
          <div className="flex gap-2">
            <Input
              type="url"
              value={ocrUrl}
              onChange={(e) => setOcrUrl(e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleOcrExtract}
              loading={ocrLoading}
              disabled={!ocrUrl.trim()}
            >
              Extract
            </Button>
          </div>
          {ocrDone && (
            <p className="text-[var(--cc-color-success)] text-[11px] mt-2">✓ Fields auto-filled from poster. Review and adjust as needed.</p>
          )}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Event Title" required error={errors.title}>
            <Input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Inter-university Hackathon"
              maxLength={200}
              error={!!errors.title}
            />
          </FormField>

          <FormField label="University / Organization" required error={errors.universityName}>
            <Input
              type="text"
              value={form.universityName}
              onChange={(e) => set("universityName", e.target.value)}
              placeholder="e.g. IIT Delhi"
              error={!!errors.universityName}
            />
          </FormField>

          <FormField label="Category" required error={errors.category}>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const sel = form.category === cat;
                const { Icon } = CAT_META[cat] || {};
                return (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      sel ? "bg-[var(--cc-color-brand)]/20 border-[var(--cc-color-brand)]/60 ring-1 ring-[var(--cc-color-brand)]/20"
                        : "bg-[var(--cc-color-surface)] border-[var(--cc-color-border)] hover:border-[var(--cc-color-border-strong)]"
                    }`}>
                    <div className="flex items-center justify-center h-7 mb-0.5">
                      {Icon && <Icon size={24} className="text-cc-muted" />}
                    </div>
                    <div className="text-[11px] font-medium text-[var(--cc-color-text-primary)] capitalize">{cat}</div>
                  </button>
                );
              })}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date & Time" required error={errors.date}>
              <Input
                type="datetime-local"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                error={!!errors.date}
              />
            </FormField>
            <FormField label="Venue" hint="Optional">
              <Input
                type="text"
                value={form.venue}
                onChange={(e) => set("venue", e.target.value)}
                placeholder="e.g. Main Auditorium"
              />
            </FormField>
          </div>

          <FormField label="Description" required error={errors.description}>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Describe the event…"
              error={!!errors.description}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Registration Link" hint="Optional">
              <Input
                type="url"
                value={form.registrationLink}
                onChange={(e) => set("registrationLink", e.target.value)}
                placeholder="https://..."
              />
            </FormField>
            <FormField label="Poster URL" hint="Optional">
              <Input
                type="url"
                value={form.posterUrl}
                onChange={(e) => set("posterUrl", e.target.value)}
                placeholder="https://..."
              />
            </FormField>
          </div>

          {apiError && (
            <div className="bg-[var(--cc-color-danger-soft)] border border-[var(--cc-color-danger)] rounded-xl p-4 text-[var(--cc-color-danger)] text-sm">{apiError}</div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
          >
            Submit Event 🚀
          </Button>
        </form>
      </div>
    </div>
  );
}

// Use shared inputCls and FormField from utils/components
