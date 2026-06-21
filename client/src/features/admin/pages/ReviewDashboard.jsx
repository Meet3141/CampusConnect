/**
 * features/admin/pages/ReviewDashboard.jsx
 * Governance dashboard for attendance warnings, blocked users, and grace requests.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../context/ToastContext";
import { fetchReviewDashboard } from "../api";
import api from "../../../services/api";
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";
import GovernanceStatusBadge from "../../../components/ui/GovernanceStatusBadge";

const STATUS_BADGE = {
  normal: "bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border-[var(--cc-color-success)]",
  warning: "bg-[var(--cc-color-warning-soft)] text-[var(--cc-color-warning)] border-[var(--cc-color-warning)]",
  review: "bg-[var(--cc-color-surface-brand)] text-[var(--cc-color-brand)] border-[var(--cc-color-brand)]",
  blocked: "bg-[var(--cc-color-danger-soft)] text-[var(--cc-color-danger)] border-[var(--cc-color-danger)]",
};

const VIEW_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pendingReview", label: "Pending review" },
  { value: "warningsOnly", label: "Warnings only" },
  { value: "gracePending", label: "Grace pending" },
  { value: "blocked", label: "Blocked users" },
  { value: "probation", label: "Probation" },
];

function getClubMeta(club) {
  if (!club) return { clubId: "", clubName: "Unknown club" };
  if (typeof club === "string") return { clubId: club, clubName: "Unknown club" };
  const clubId = club._id || club.id || club.value || club.toString?.() || "";
  return { clubId: String(clubId), clubName: club.name || club.title || "Unknown club" };
}

function getStudentClubMeta(student) {
  const events = Array.isArray(student?.missedEvents) ? student.missedEvents : [];
  const map = new Map();

  events.forEach((event) => {
    const { clubId, clubName } = getClubMeta(event?.clubId);
    if (clubId) {
      map.set(clubId, clubName);
    }
  });

  if (map.size === 0) {
    return {
      clubIds: [],
      clubNames: ["Unknown club"],
      primaryClubId: "",
      primaryClubName: "Unknown club",
    };
  }

  const clubIds = [...map.keys()];
  const clubNames = [...map.values()];

  return {
    clubIds,
    clubNames,
    primaryClubId: clubIds[0],
    primaryClubName: clubNames[0],
  };
}

export default function ReviewDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isProcessing, setIsProcessing] = useState("");
  const [view, setView] = useState("all");
  const [clubFilter, setClubFilter] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchReviewDashboard();
      setData(res.data.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => (data?.reviewRequiredUsers || []).map((student) => {
    const { clubIds, clubNames, primaryClubId, primaryClubName } = getStudentClubMeta(student);
    return {
      ...student,
      clubIds,
      clubNames,
      clubId: primaryClubId,
      clubName: primaryClubName,
    };
  }), [data]);

  const requests = useMemo(() => (data?.pendingGraceRequests || []).map((request) => {
    const { clubId, clubName } = getClubMeta(request.eventId?.clubId);
    return {
      ...request,
      clubId,
      clubName,
    };
  }), [data]);

  const blocked = useMemo(() => (data?.blockedUsers || []).map((student) => {
    const { clubIds, clubNames, primaryClubId, primaryClubName } = getStudentClubMeta(student);
    return {
      ...student,
      clubIds,
      clubNames,
      clubId: primaryClubId,
      clubName: primaryClubName,
    };
  }), [data]);

  const probation = useMemo(() => (data?.probationUsers || []).map((student) => {
    const { clubIds, clubNames, primaryClubId, primaryClubName } = getStudentClubMeta(student);
    return {
      ...student,
      clubIds,
      clubNames,
      clubId: primaryClubId,
      clubName: primaryClubName,
    };
  }), [data]);

  const clubs = useMemo(() => {
    const map = new Map();
    [...rows, ...blocked, ...probation].forEach((item) => {
      const ids = Array.isArray(item.clubIds) ? item.clubIds : [];
      const names = Array.isArray(item.clubNames) ? item.clubNames : [];
      ids.forEach((id, index) => {
        if (!id) return;
        if (!map.has(id)) {
          map.set(id, names[index] || "Unknown club");
        }
      });
    });
    requests.forEach((item) => {
      if (!item.clubId) return;
      if (!map.has(item.clubId)) {
        map.set(item.clubId, item.clubName || "Unknown club");
      }
    });
    return [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows, requests, blocked, probation]);

  const visibleRows = useMemo(() => {
    let filtered = rows;
    if (view === "warningsOnly") {
      filtered = filtered.filter((student) => student.disciplineStatus === "warning");
    } else if (view === "pendingReview") {
      filtered = filtered.filter((student) => student.disciplineStatus === "review" || student.reviewRequired);
    } else if (view === "blocked" || view === "probation") {
      filtered = [];
    }
    if (clubFilter !== "all") {
      filtered = filtered.filter((student) => Array.isArray(student.clubIds) && student.clubIds.includes(clubFilter));
    }
    return filtered;
  }, [rows, view, clubFilter]);

  const visibleRequests = useMemo(() => {
    let filtered = requests;
    if (view !== "all" && view !== "gracePending") {
      filtered = [];
    }
    if (clubFilter !== "all") {
      filtered = filtered.filter((request) => request.clubId === clubFilter);
    }
    return filtered;
  }, [requests, view, clubFilter]);

  const visibleBlocked = useMemo(() => {
    let filtered = blocked;
    if (view !== "all" && view !== "blocked") {
      filtered = [];
    }
    if (clubFilter !== "all") {
      filtered = filtered.filter((student) => Array.isArray(student.clubIds) && student.clubIds.includes(clubFilter));
    }
    return filtered;
  }, [blocked, view, clubFilter]);

  const visibleProbation = useMemo(() => {
    let filtered = probation;
    if (view !== "all" && view !== "probation") {
      filtered = [];
    }
    if (clubFilter !== "all") {
      filtered = filtered.filter((student) => Array.isArray(student.clubIds) && student.clubIds.includes(clubFilter));
    }
    return filtered;
  }, [probation, view, clubFilter]);

  const reviewUser = async (user, action, eventId, extra = {}) => {
    const key = `${user._id}-${action}`;
    try {
      setIsProcessing(key);
      await api.post(`/events/${eventId}/review/${user._id}`, { action, ...extra });
      toast.success("Review updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update review.");
    } finally {
      setIsProcessing("");
    }
  };

  const reviewRequest = async (request, action, extra = {}) => {
    const key = `${request._id}-${action}`;
    try {
      setIsProcessing(key);
      await api.post(`/events/${request.eventId._id}/grace-request/${request._id}/review`, { action, ...extra });
      toast.success("Grace request reviewed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review grace request.");
    } finally {
      setIsProcessing("");
    }
  };

  const latestMissedEventId = (student) => {
    const missed = student.missedEvents || [];
    const latest = missed[missed.length - 1];
    return latest?._id || latest;
  };

  if (loading) {
    return <div className="px-6 py-10 text-cc-muted">Loading reviews…</div>;
  }

  return (
    <div className="w-full">
      <PageHeader
        breadcrumb="Admin / Reviews"
        title="Attendance Review Dashboard"
        subtitle="Centralized governance for warnings, grace requests, and blocks."
        actions={
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface-hover text-sm hover:border-cc-strong transition-colors">
            Back
          </button>
        }
      />
      <PageContainer className="py-6 space-y-6">

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5"><p className="text-sm text-cc-muted">Pending Grace</p><p className="text-3xl font-bold mt-1">{data?.summary?.pendingGraceRequests || 0}</p></div>
        <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5"><p className="text-sm text-cc-muted">Review Required</p><p className="text-3xl font-bold mt-1">{data?.summary?.reviewRequiredUsers || 0}</p></div>
        <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5"><p className="text-sm text-cc-muted">Blocked</p><p className="text-3xl font-bold mt-1">{data?.summary?.blockedUsers || 0}</p></div>
        <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5"><p className="text-sm text-cc-muted">Probation</p><p className="text-3xl font-bold mt-1">{data?.summary?.probationUsers || 0}</p></div>
      </div>

      <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setView(option.value)}
              className={`px-3 py-2 rounded-full text-xs border transition-colors ${view === option.value ? "bg-[var(--cc-color-brand)] text-[var(--cc-color-on-brand)] border-[var(--cc-color-brand)]" : "bg-transparent text-cc-muted border-cc-soft hover:text-cc hover:border-cc"}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-cc-muted uppercase tracking-widest">Club</span>
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="rounded-xl border border-cc-soft bg-cc-surface px-3 py-2 text-sm text-cc"
          >
            <option value="all">All clubs</option>
            {clubs.map((club) => (
              <option key={club.value} value={club.value}>{club.label}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setView("all");
              setClubFilter("all");
            }}
            className="px-3 py-2 rounded-xl border border-cc-soft text-sm text-cc-muted hover:text-cc hover:border-cc transition-colors"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-cc-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-cc-soft bg-cc-surface-weak">
          <h2 className="font-semibold">Students Needing Review</h2>
        </div>
        <div className="divide-y divide-cc-soft">
          {visibleRows.length === 0 ? (
            <div className="px-5 py-8 text-cc-muted text-sm">No students currently require review.</div>
          ) : visibleRows.map((student) => {
            const eventId = latestMissedEventId(student);
            return (
              <div key={student._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-cc-muted">Misses: {student.missedEvents?.length || 0} · Warnings: {student.warningCount || 0} · Status: {student.disciplineStatus || "normal"} · Club: {student.clubNames?.join(", ") || "Unknown club"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={!eventId || isProcessing === `${student._id}-approveGrace`} onClick={() => reviewUser(student, "approveGrace", eventId)} className="px-3 py-2 rounded-lg bg-[var(--cc-color-success)] text-[var(--cc-color-on-brand)] text-xs disabled:opacity-50">Approve Grace</button>
                  <button disabled={!eventId || isProcessing === `${student._id}-reduceWarning`} onClick={() => reviewUser(student, "reduceWarning", eventId)} className="px-3 py-2 rounded-lg bg-[var(--cc-color-warning)] text-[var(--cc-color-on-brand)] text-xs disabled:opacity-50">Reduce Warning</button>
                  <button disabled={!eventId || isProcessing === `${student._id}-blockStudent`} onClick={() => reviewUser(student, "blockStudent", eventId)} className="px-3 py-2 rounded-lg bg-[var(--cc-color-danger)] text-[var(--cc-color-on-brand)] text-xs disabled:opacity-50">Block Student</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-cc-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-cc-soft bg-cc-surface-weak">
          <h2 className="font-semibold">Pending Grace Requests</h2>
        </div>
        <div className="divide-y divide-cc-soft">
          {visibleRequests.length === 0 ? (
            <div className="px-5 py-8 text-cc-muted text-sm">No pending grace requests.</div>
          ) : visibleRequests.map((request) => (
            <div key={request._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium">{request.userId?.name || "Student"}</p>
                <p className="text-sm text-cc-muted">Event: {request.eventId?.title || "Unknown"} · Reason: {request.reason} · Club: {request.clubName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button disabled={isProcessing === `${request._id}-approveGrace`} onClick={() => reviewRequest(request, "approveGrace", { reason: request.reason })} className="px-3 py-2 rounded-lg bg-[var(--cc-color-success)] text-[var(--cc-color-on-brand)] text-xs disabled:opacity-50">Approve Grace</button>
                <button disabled={isProcessing === `${request._id}-reduceWarning`} onClick={() => reviewRequest(request, "reduceWarning", { reason: request.reason })} className="px-3 py-2 rounded-lg bg-[var(--cc-color-warning)] text-[var(--cc-color-on-brand)] text-xs disabled:opacity-50">Reduce Warning</button>
                <button disabled={isProcessing === `${request._id}-blockStudent`} onClick={() => reviewRequest(request, "blockStudent", { reason: request.reason })} className="px-3 py-2 rounded-lg bg-[var(--cc-color-danger)] text-[var(--cc-color-on-brand)] text-xs disabled:opacity-50">Block Student</button>
                <button disabled={isProcessing === `${request._id}-reject`} onClick={() => reviewRequest(request, "reject", { reason: request.reason })} className="px-3 py-2 rounded-lg bg-[var(--cc-color-surface-elevated)] text-[var(--cc-color-text-primary)] text-xs disabled:opacity-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-cc-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-cc-soft bg-cc-surface-weak">
          <h2 className="font-semibold">Blocked Students</h2>
        </div>
        <div className="divide-y divide-cc-soft">
          {visibleBlocked.length === 0 ? (
            <div className="px-5 py-8 text-cc-muted text-sm">No blocked students.</div>
          ) : visibleBlocked.map((student) => (
            <div key={student._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-cc-muted">Warnings: {student.warningCount || 0} · Until: {student.blockedUntil ? new Date(student.blockedUntil).toLocaleDateString() : "n/a"} · Club: {student.clubNames?.join(", ") || "Unknown club"}</p>
              </div>
              <GovernanceStatusBadge status="blocked" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-cc-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--cc-color-warning)] bg-[var(--cc-color-warning-soft)]">
          <h2 className="font-semibold text-[var(--cc-color-warning)]">Students on Probation</h2>
        </div>
        <div className="divide-y divide-cc-soft">
          {visibleProbation.length === 0 ? (
            <div className="px-5 py-8 text-cc-muted text-sm">No students on probation.</div>
          ) : visibleProbation.map((student) => (
            <div key={student._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-cc-muted">
                  Probation Ends: {student.probationUntil ? new Date(student.probationUntil).toLocaleDateString() : "n/a"} · 
                  Archived Misses: {student.archivedMissedEvents?.length || 0} · 
                  Club: {student.clubNames?.join(", ") || "Unknown club"}
                </p>
              </div>
              <GovernanceStatusBadge status="probation" />
            </div>
          ))}
        </div>
      </div>
      </PageContainer>
    </div>
  );
}