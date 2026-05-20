import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import { fetchEventAnalytics, reviewAttendanceIssue, submitGraceRequest } from "../api";

export default function AttendanceManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedAttendees, setSelectedAttendees] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [submittingReason, setSubmittingReason] = useState(false);
  const previousStatusRef = useRef(null);
  const isOngoing = event?.status === "ongoing";
  const isCompleted = event?.status === "completed";

  const fetchEventAndAttendees = useCallback(async () => {
    try {
      setLoading(true);
      const [eventRes, attendeesRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/attendees`),
      ]);
      const analyticsRes = await fetchEventAnalytics(eventId);
      
      setEvent(eventRes.data.data);
            const nextAttendees = attendeesRes.data.data || [];
            setAttendees(nextAttendees);
            setSelectedAttendees(
              new Set(
                nextAttendees
                  .filter((attendee) => attendee.status === "attended")
                  .map((attendee) => attendee.userId?._id)
                  .filter(Boolean)
              )
            );
      setAnalytics(analyticsRes.data.data || null);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch event details");
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchEventAndAttendees();
  }, [fetchEventAndAttendees]);

  useEffect(() => {
    if (event?.status === "ongoing" && previousStatusRef.current === "completed") {
      setSelectedAttendees(new Set());
    }
    previousStatusRef.current = event?.status || null;
  }, [event?.status]);

  const toggleAttendee = (attendeeId) => {
    const newSelected = new Set(selectedAttendees);
    if (newSelected.has(attendeeId)) {
      newSelected.delete(attendeeId);
    } else {
      newSelected.add(attendeeId);
    }
    setSelectedAttendees(newSelected);
  };

  const toggleAll = () => {
    if (!isOngoing) return;
    if (selectedAttendees.size === attendees.length) {
      setSelectedAttendees(new Set());
    } else {
      setSelectedAttendees(new Set(attendees.map((a) => a.userId?._id).filter(Boolean)));
    }
  };

  const handleMarkAttendance = async () => {
    if (!isOngoing) {
      toast.info("Attendance can only be marked while the event is ongoing.");
      return;
    }

    try {
      setSubmitting(true);

      // compute previous attended set and intended selection so we can show accurate feedback
      const prevAttended = new Set(
        attendees
          .filter((a) => a.status === "attended")
          .map((a) => a.userId?._id)
          .filter(Boolean)
      );
      const selected = new Set(selectedAttendees);

      // compute counts (added + removed)
      let added = 0;
      let removed = 0;
      selected.forEach((id) => {
        if (!prevAttended.has(id)) added += 1;
      });
      prevAttended.forEach((id) => {
        if (!selected.has(id)) removed += 1;
      });
      const changedCount = added + removed;

      const response = await api.post(`/events/${eventId}/attendance`, {
        attendeeIds: [...selected],
      });

      // prefer a computed changedCount for clearer UX; fall back to server message
      if (changedCount > 0) {
        toast.success(`${changedCount} attendance(s) marked`);
      } else {
        toast.success(response.data?.message || "Attendance updated");
      }

      // update attendees locally to reflect the saved/desired state
      const updated = attendees.map((a) => {
        const uid = a.userId?._id;
        if (!uid) return a;
        if (selected.has(uid)) return { ...a, status: "attended" };
        if (prevAttended.has(uid) && !selected.has(uid)) return { ...a, status: "registered" };
        return a;
      });

      setAttendees(updated);
      setSelectedAttendees(new Set(updated.map((a) => (a.status === "attended" ? a.userId?._id : null)).filter(Boolean)));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGraceRequest = async () => {
    if (!reason.trim()) {
      toast.info("Please enter a reason");
      return;
    }

    try {
      setSubmittingReason(true);
      const response = await submitGraceRequest(eventId, reason.trim());
      toast.success(response.data.message);
      setReason("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to submit grace request");
    } finally {
      setSubmittingReason(false);
    }
  };

  const handleReviewAction = async (studentId, action) => {
    try {
      const response = await reviewAttendanceIssue(eventId, studentId, action);
      toast.success(response.data.message);
      fetchEventAndAttendees();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update attendance review");
    }
  };

  const registeredCount = attendees.length;
  const attendedCount = selectedAttendees.size;
  const noShowCount = Math.max(0, registeredCount - attendedCount);
  const attendanceRate = registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Event not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-5 lg:px-6 py-6 text-cc bg-cc-bg">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md p-5 lg:p-6 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-cc-soft bg-white/4 px-4 py-2 text-sm font-medium text-cc hover:bg-white/6 transition-colors"
            >
              <span aria-hidden="true">←</span>
              Back
            </button>

            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cc-muted">
              <span className={`px-2 py-1 rounded-full border ${isOngoing ? "border-emerald-800 text-emerald-300 bg-emerald-950/40" : isCompleted ? "border-slate-700 text-slate-400 bg-slate-900/50" : "border-indigo-800 text-indigo-300 bg-indigo-950/40"}`}>
                {event.status}
              </span>
              <span className="px-2 py-1 rounded-full border border-cc-soft bg-white/4">
                Attendance tracking
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-cc">{event.title}</h1>
            <p className="mt-2 text-cc-muted text-sm lg:text-base">Venue: <span className="text-cc">{event.venue}</span></p>
            <p className="text-cc-muted text-sm lg:text-base">Total Registered: <span className="text-cc font-semibold">{registeredCount}</span></p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-blue-900/50 bg-blue-950/20 p-4">
              <p className="text-xs uppercase tracking-widest text-blue-300/70">Registered</p>
              <p className="mt-2 text-3xl font-bold text-blue-300">{registeredCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-4">
              <p className="text-xs uppercase tracking-widest text-emerald-300/70">Attended</p>
              <p className="mt-2 text-3xl font-bold text-emerald-300">{attendedCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-4">
              <p className="text-xs uppercase tracking-widest text-amber-300/70">No-shows</p>
              <p className="mt-2 text-3xl font-bold text-amber-300">{noShowCount}</p>
            </div>
            <div className="rounded-2xl border border-indigo-900/50 bg-indigo-950/20 p-4">
              <p className="text-xs uppercase tracking-widest text-indigo-300/70">Attendance Rate</p>
              <p className="mt-2 text-3xl font-bold text-indigo-300">{attendanceRate}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md overflow-hidden shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-cc-soft bg-cc-surface-weak/60">
              <div>
                <h2 className="font-semibold text-cc">Attendee List</h2>
                <p className="text-xs text-cc-muted mt-1">Select students and mark presence while the event is ongoing.</p>
              </div>
              <button
                onClick={() => setSelectedAttendees(new Set())}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-cc-soft text-sm text-cc-muted hover:text-cc hover:bg-white/4 transition-colors disabled:opacity-50"
              >
                Clear Selection
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cc-soft bg-cc-surface-weak/40 text-cc-muted text-sm">
                    <th className="px-5 py-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={isOngoing && attendees.length > 0 && selectedAttendees.size === attendees.length}
                        onChange={toggleAll}
                        disabled={!isOngoing}
                        className="w-4 h-4 accent-indigo-500"
                      />
                    </th>
                    <th className="px-5 py-4 text-left font-medium">Name</th>
                    <th className="px-5 py-4 text-left font-medium">Email</th>
                    <th className="px-5 py-4 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-10 text-center text-cc-muted">
                        No registered attendees
                      </td>
                    </tr>
                  ) : (
                    attendees.map((attendee) => {
                      const attendeeId = attendee.userId?._id;
                      const desired = selectedAttendees.has(attendeeId);
                      const alreadyAttended = attendee.status === "attended";

                      // prioritize current user selection for immediate feedback
                      let statusLabel;
                      let statusClass;
                      if (desired) {
                        statusLabel = alreadyAttended ? "Present" : "Selected";
                        statusClass = alreadyAttended
                          ? "bg-emerald-950/50 text-emerald-300 border-emerald-800"
                          : "bg-indigo-950/50 text-indigo-300 border-indigo-800";
                      } else {
                        statusLabel = "Pending";
                        statusClass = "bg-slate-900/60 text-slate-400 border-slate-700";
                      }

                      return (
                        <tr
                          key={attendee._id}
                          className={`border-b border-cc-soft/70 transition-colors ${desired ? "bg-indigo-950/20" : "hover:bg-white/3"}`}
                        >
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={desired}
                              onChange={() => isOngoing && toggleAttendee(attendeeId)}
                              disabled={!isOngoing}
                              className="w-4 h-4 accent-indigo-500"
                            />
                          </td>
                          <td className="px-5 py-4 font-medium text-cc">{attendee.userId.name}</td>
                          <td className="px-5 py-4 text-cc-muted">{attendee.userId.email}</td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-cc-soft bg-cc-surface-weak/40 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleMarkAttendance}
                disabled={submitting || !isOngoing}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : isOngoing ? "Save Attendance" : "Attendance Locked"}
              </button>
              <button
                onClick={() => setSelectedAttendees(new Set())}
                disabled={submitting}
                className="sm:w-48 rounded-xl border border-cc-soft bg-white/4 text-cc py-3 px-4 text-sm font-semibold hover:bg-white/6 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md p-5 shadow-2xl shadow-black/20">
              <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">Event Status</h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-cc-soft bg-white/4 p-4">
                  <p className="text-cc-muted text-xs uppercase tracking-widest">Current state</p>
                  <p className="mt-2 text-cc font-medium capitalize">{event.status}</p>
                </div>
                <div className="rounded-2xl border border-cc-soft bg-white/4 p-4">
                  <p className="text-cc-muted text-xs uppercase tracking-widest">Attendance rate</p>
                  <p className="mt-2 text-cc font-medium">{attendanceRate}%</p>
                </div>
                <div className="rounded-2xl border border-cc-soft bg-white/4 p-4">
                  <p className="text-cc-muted text-xs uppercase tracking-widest">Selection count</p>
                  <p className="mt-2 text-cc font-medium">{selectedAttendees.size} selected</p>
                </div>
              </div>
            </div>

            {isCompleted && (
              <div className="rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md p-5 shadow-2xl shadow-black/20 space-y-4">
                <h2 className="text-lg font-semibold text-cc">Submit Grace Request</h2>
                <p className="text-sm text-cc-muted">Add a reason if you missed the event and need faculty review.</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-cc-soft bg-white/4 px-4 py-3 text-sm text-cc placeholder:text-cc-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Medical emergency, transport issue, etc."
                />
                <button
                  onClick={handleSubmitGraceRequest}
                  disabled={submittingReason}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  {submittingReason ? "Submitting..." : "Submit Reason"}
                </button>
              </div>
            )}

            {analytics?.reviewRequiredUsers?.length > 0 && (
              <div className="rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md overflow-hidden shadow-2xl shadow-black/20">
                <div className="px-5 py-4 border-b border-cc-soft bg-cc-surface-weak/60">
                  <h3 className="font-semibold text-cc">Faculty Review Required</h3>
                </div>
                <div className="divide-y divide-cc-soft">
                  {analytics.reviewRequiredUsers.map((student) => (
                    <div key={student._id} className="px-5 py-4 flex flex-col gap-3">
                      <div>
                        <p className="font-medium text-cc">{student.name}</p>
                        <p className="text-sm text-cc-muted">Misses: {student.missedEvents?.length || 0} · Warnings: {student.warningCount || 0}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleReviewAction(student._id, "approveGrace")} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors">Approve Grace</button>
                        <button onClick={() => handleReviewAction(student._id, "reduceWarning")} className="px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-medium hover:bg-amber-500 transition-colors">Reduce Warning</button>
                        <button onClick={() => handleReviewAction(student._id, "blockStudent")} className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors">Block Student</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-indigo-900/60 bg-indigo-950/20 p-5 shadow-2xl shadow-black/20">
              <p className="text-sm text-indigo-200">
                <strong>Tip:</strong> Check the box next to each student name to mark them as present. You can also uncheck attendees; click "Save Attendance" to persist changes.
              </p>
            </div>
          </div>
        </div>

        {!isOngoing && (
          <div className="rounded-3xl border border-amber-900/60 bg-amber-950/20 p-5 text-sm text-amber-200">
            Attendance is locked because this event is {event.status}. Use this page for analytics only.
          </div>
        )}
      </div>
    </div>
  );
}
