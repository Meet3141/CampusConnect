/**
 * CreateExternalEvent.jsx
 * Submit a new external event — with optional OCR poster extraction.
 *
 * API: POST /external-events/ocr/extract  body: { imageUrl }  → extracted fields
 *      POST /external-events              body: { title, description, universityName, date, venue, category, registrationLink, posterUrl }
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const CATEGORIES = ["hackathon", "workshop", "webinar", "cultural", "sports", "conference", "competition"];
const CAT_META = {
  hackathon:   { emoji: "💻" },
  workshop:    { emoji: "🛠" },
  webinar:     { emoji: "🎙" },
  cultural:    { emoji: "🎭" },
  sports:      { emoji: "⚡" },
  conference:  { emoji: "🏛" },
  competition: { emoji: "🏆" },
};

export default function CreateExternalEvent() {
  const navigate = useNavigate();

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
      const res = await api.post("/external-events/ocr/extract", { imageUrl: ocrUrl.trim() });
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
      alert(err.response?.data?.message || "OCR extraction failed.");
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

      await api.post("/external-events", body);
      navigate("/external-events");
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to submit event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-white">
      <div className="max-w-xl mx-auto px-5 py-8">
        <button onClick={() => navigate("/external-events")} className="group flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-8 transition-colors">
          <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to External Events
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Submit{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">External Event</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">Share an event from another university or community.</p>
        </div>

        {/* ── OCR Extraction Panel ── */}
        <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] p-5 mb-6">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            🔍 Auto-fill from poster
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-violet-950 text-violet-300 border border-violet-800 rounded-full font-medium">OCR</span>
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">Paste a poster image URL and we'll extract event details automatically.</p>
          <div className="flex gap-2">
            <input
              type="url" value={ocrUrl}
              onChange={(e) => setOcrUrl(e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-all"
            />
            <button type="button" onClick={handleOcrExtract} disabled={ocrLoading || !ocrUrl.trim()}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40 whitespace-nowrap">
              {ocrLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Extracting…
                </span>
              ) : "Extract"}
            </button>
          </div>
          {ocrDone && (
            <p className="text-emerald-400 text-[11px] mt-2">✓ Fields auto-filled from poster. Review and adjust as needed.</p>
          )}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Event Title" required error={errors.title}>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Inter-university Hackathon" maxLength={200} className={inputCls(!!errors.title)} />
          </Field>

          <Field label="University / Organization" required error={errors.universityName}>
            <input type="text" value={form.universityName} onChange={(e) => set("universityName", e.target.value)}
              placeholder="e.g. IIT Delhi" className={inputCls(!!errors.universityName)} />
          </Field>

          <Field label="Category" required error={errors.category}>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const sel = form.category === cat;
                return (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      sel ? "bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/20"
                        : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15]"
                    }`}>
                    <div className="text-lg mb-0.5">{CAT_META[cat]?.emoji}</div>
                    <div className="text-[11px] font-medium text-white capitalize">{cat}</div>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date & Time" required error={errors.date}>
              <input type="datetime-local" value={form.date} onChange={(e) => set("date", e.target.value)}
                className={inputCls(!!errors.date)} />
            </Field>
            <Field label="Venue" hint="Optional">
              <input type="text" value={form.venue} onChange={(e) => set("venue", e.target.value)}
                placeholder="e.g. Main Auditorium" className={inputCls(false)} />
            </Field>
          </div>

          <Field label="Description" required error={errors.description}>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={4} maxLength={2000} placeholder="Describe the event…"
              className={inputCls(!!errors.description) + " resize-none"} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Registration Link" hint="Optional">
              <input type="url" value={form.registrationLink} onChange={(e) => set("registrationLink", e.target.value)}
                placeholder="https://..." className={inputCls(false)} />
            </Field>
            <Field label="Poster URL" hint="Optional">
              <input type="url" value={form.posterUrl} onChange={(e) => set("posterUrl", e.target.value)}
                placeholder="https://..." className={inputCls(false)} />
            </Field>
          </div>

          {apiError && (
            <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">{apiError}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </span>
            ) : "Submit Event 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = (err) =>
  `w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all ${
    err ? "border-red-800 focus:border-red-600" : "border-white/[0.08] focus:border-indigo-500/60 focus:bg-white/[0.06]"
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
