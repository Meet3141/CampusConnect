/**
 * features/admin/pages/ReviewDashboard.jsx
 * Governance dashboard for attendance warnings, blocked users, and grace requests.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../context/ToastContext";
import { fetchReviewDashboard } from "../api";
import api from "../../../services/api";

const STATUS_BADGE = {
  normal: "bg-emerald-950 text-emerald-300 border-emerald-800",
  warning: "bg-amber-950 text-amber-300 border-amber-800",
  review: "bg-indigo-950 text-indigo-300 border-indigo-800",
  blocked: "bg-red-950 text-red-300 border-red-800",
};

export default function ReviewDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [busyKey, setBusyKey] = useState("");

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

  const rows = useMemo(() => data?.reviewRequiredUsers || [], [data]);
  const requests = data?.pendingGraceRequests || [];
  const blocked = data?.blockedUsers || [];

  const reviewUser = async (user, action, eventId, extra = {}) => {
    const key = `${user._id}-${action}`;
    try {
      setBusyKey(key);
      await api.post(`/events/${eventId}/review/${user._id}`, { action, ...extra });
      toast.success("Review updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update review.");
    } finally {
      setBusyKey("");
    }
  };

  const reviewRequest = async (request, action, extra = {}) => {
    const key = `${request._id}-${action}`;
    try {
      setBusyKey(key);
      await api.post(`/events/${request.eventId._id}/grace-request/${request._id}/review`, { action, ...extra });
      toast.success("Grace request reviewed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review grace request.");
    } finally {
      setBusyKey("");
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
    <div className="text-cc px-5 lg:px-6 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-widest text-cc-muted uppercase font-mono mb-2">Admin / Reviews</p>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Review Dashboard</h1>
          <p className="text-cc-muted text-sm mt-1">Centralized governance for warnings, grace requests, and blocks.</p>
        </div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl border border-cc-soft text-sm hover:border-cc-strong">Back</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5"><p className="text-sm text-cc-muted">Pending Grace</p><p className="text-3xl font-bold mt-1">{data?.summary?.pendingGraceRequests || 0}</p></div>
        <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5"><p className="text-sm text-cc-muted">Review Required</p><p className="text-3xl font-bold mt-1">{data?.summary?.reviewRequiredUsers || 0}</p></div>
        <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5"><p className="text-sm text-cc-muted">Blocked</p><p className="text-3xl font-bold mt-1">{data?.summary?.blockedUsers || 0}</p></div>
      </div>

      <div className="rounded-2xl border border-cc-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-cc-soft bg-cc-surface-weak">
          <h2 className="font-semibold">Students Needing Review</h2>
        </div>
        <div className="divide-y divide-cc-soft">
          {rows.length === 0 ? (
            <div className="px-5 py-8 text-cc-muted text-sm">No students currently require review.</div>
          ) : rows.map((student) => {
            const eventId = latestMissedEventId(student);
            return (
              <div key={student._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-cc-muted">Misses: {student.missedEvents?.length || 0} · Warnings: {student.warningCount || 0} · Status: {student.disciplineStatus || "normal"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={!eventId || busyKey === `${student._id}-approveGrace`} onClick={() => reviewUser(student, "approveGrace", eventId)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs">Approve Grace</button>
                  <button disabled={!eventId || busyKey === `${student._id}-reduceWarning`} onClick={() => reviewUser(student, "reduceWarning", eventId)} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs">Reduce Warning</button>
                  <button disabled={!eventId || busyKey === `${student._id}-blockStudent`} onClick={() => reviewUser(student, "blockStudent", eventId)} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs">Block Student</button>
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
          {requests.length === 0 ? (
            <div className="px-5 py-8 text-cc-muted text-sm">No pending grace requests.</div>
          ) : requests.map((request) => (
            <div key={request._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium">{request.userId?.name || "Student"}</p>
                <p className="text-sm text-cc-muted">Event: {request.eventId?.title || "Unknown"} · Reason: {request.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button disabled={busyKey === `${request._id}-approveGrace`} onClick={() => reviewRequest(request, "approveGrace", { reason: request.reason })} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs">Approve Grace</button>
                <button disabled={busyKey === `${request._id}-reduceWarning`} onClick={() => reviewRequest(request, "reduceWarning", { reason: request.reason })} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs">Reduce Warning</button>
                <button disabled={busyKey === `${request._id}-blockStudent`} onClick={() => reviewRequest(request, "blockStudent", { reason: request.reason })} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs">Block Student</button>
                <button disabled={busyKey === `${request._id}-reject`} onClick={() => reviewRequest(request, "reject", { reason: request.reason })} className="px-3 py-2 rounded-lg bg-slate-700 text-white text-xs">Reject</button>
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
          {blocked.length === 0 ? (
            <div className="px-5 py-8 text-cc-muted text-sm">No blocked students.</div>
          ) : blocked.map((student) => (
            <div key={student._id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-cc-muted">Warnings: {student.warningCount || 0} · Until: {student.blockedUntil ? new Date(student.blockedUntil).toLocaleDateString() : "n/a"}</p>
              </div>
              <span className={`px-3 py-1 rounded-full border text-xs ${STATUS_BADGE.blocked}`}>Blocked</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}