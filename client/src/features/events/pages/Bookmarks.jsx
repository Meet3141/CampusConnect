/**
 * Bookmarks.jsx (migrated to events feature)
 * Save events for later.
 *
 * API: GET /bookmarks         → { success, data } each entry has hydrated .event
 *      DELETE /bookmarks/:id  → { success, message }
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import { CLUB_CATEGORY_META } from "../../../theme";
import { EVENT_CATEGORY_META } from "../../../theme";
import { Bookmark, MapPin } from "lucide-react";

const catOf = (k) => CLUB_CATEGORY_META[k] || EVENT_CATEGORY_META[k] || CLUB_CATEGORY_META.other;

const styles = {
  page: "text-cc",
  header: "relative overflow-hidden border-b border-cc-soft",
  headerInner: "relative px-5 lg:px-6 pt-6 pb-5",
  headerKicker: "text-[11px] tracking-widest text-cc-muted uppercase font-mono mb-3",
  headerTitle: "text-3xl font-bold tracking-tight",
  headerCount: "text-cc-muted mt-1.5 text-sm",
  tabBar: "flex gap-1 mt-5 border-b border-cc-soft -mb-px",
  tabButton:
    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all",
  tabCount:
    "text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums",
  content: "px-5 lg:px-6 py-6",
  loadingCard: "h-16 rounded-xl bg-cc-surface-weak animate-pulse",
  emptyState: "flex flex-col items-center py-16 gap-4 text-center",
  emptyTitle: "text-lg font-semibold",
  emptyMeta: "text-cc-muted text-sm mt-1",
  bookmarkList: "space-y-2",
  bookmarkRow:
    "group flex items-center gap-4 p-4 rounded-xl border border-cc-soft bg-cc-surface-weak hover-bg-cc-surface hover-border-cc-strong transition-all cursor-pointer",
  bookmarkIcon:
    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
  bookmarkTitle: "text-sm font-medium text-cc group-hover:text-indigo-300 transition-colors truncate",
  bookmarkMeta: "text-[11px] text-cc-muted",
  eventTypeBadge:
    "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium",
  removeButton:
    "opacity-0 group-hover:opacity-100 text-cc-muted hover:text-red-400 transition-all px-2 py-1 rounded-lg hover:bg-red-950/30 text-sm shrink-0",
};

export default function Bookmarks() {
  const navigate = useNavigate();
  const toast = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all"); // all, internal, external

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/bookmarks");
        setBookmarks(res.data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load bookmarks.");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleRemove = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove bookmark.");
    }
  };

 const filtered = filter === "all"
    ? bookmarks
    : bookmarks.filter((b) => b.eventType === filter);

 return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 right-0 w-80 h-80 bg-blue-700/6 rounded-full blur-3xl" />
        </div>
        <div className={styles.headerInner}>
          <p className={styles.headerKicker}>
            Dashboard / Bookmarks
          </p>
          <h1 className={styles.headerTitle}>
            My{" "}
            <span style={{ background: 'linear-gradient(120deg, #004F9F, #00BCEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bookmarks</span>
          </h1>
          <p className={styles.headerCount}>
            {bookmarks.length} saved event{bookmarks.length !== 1 ? "s" : ""}
          </p>

          {bookmarks.length > 0 && (
            <div className={styles.tabBar}>
              {[
                { key: "all", label: "All", count: bookmarks.length },
                { key: "internal", label: "Internal", count: bookmarks.filter((b) => b.eventType === "internal").length },
                { key: "external", label: "External", count: bookmarks.filter((b) => b.eventType === "external").length },
              ].map(({ key, label, count }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`${styles.tabButton} ${
                    filter === key ? "border-blue-500 text-cc" : "border-transparent text-cc-muted hover:text-cc"
                  }`}>
                  {label}
                  <span className={`${styles.tabCount} ${
                    filter === key ? "bg-blue-600/30 text-blue-300" : "bg-cc-surface-weak text-cc-muted"
                  }`}>{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.loadingCard} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cc-surface-weak">
              <Bookmark size={16} className="text-cc-muted" />
            </span>
            <div>
              <h2 className={styles.emptyTitle}>No bookmarks</h2>
              <p className={styles.emptyMeta}>Bookmark events to find them quickly later.</p>
            </div>
            <Button onClick={() => navigate("/clubs")}>
              Browse Events
            </Button>
          </div>
        ) : (
          <div className={styles.bookmarkList}>
            {filtered.map((bk) => {
              const ev  = bk.event;
              const cat = catOf(ev?.category);
              const parseDate = (val) => {
                if (!val) return null;
                const d = new Date(val);
                return Number.isNaN(d.getTime()) ? null : d;
              };
              const dateObj = parseDate(ev?.date) || parseDate(ev?.createdAt);
              const dateLabel = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

              return (
                <div key={bk._id}
                  className={styles.bookmarkRow}
                  onClick={() => {
                    if (bk.eventType === "internal") navigate(`/events/${bk.eventId}`);
                  }}>
                  <div className={`${styles.bookmarkIcon} ${cat.gradient || "from-slate-800 to-slate-700"}`}>
                    {cat.Icon ? <cat.Icon size={24} className="opacity-70" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={styles.bookmarkTitle}>
                      {ev?.title || "Untitled Event"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`{styles.eventTypeBadge} ${
                        bk.eventType === "external" ? "bg-cyan-950 text-cyan-300 border-cyan-800" : "bg-blue-950 text-blue-300 border-blue-800"
                      }`}>
                        {bk.eventType}
                      </span>
                      {dateLabel && <span className="text-[11px] text-cc-muted">{dateLabel}</span>}
                      {ev?.venue && <span className="text-[11px] text-cc-muted flex items-center gap-1"><MapPin size={14} className="shrink-0" /> {ev.venue}</span>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(bk._id); }}
                    className={styles.removeButton}
                    title="Remove bookmark">
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
