import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import { fetchEventAnalytics, reviewAttendanceIssue, submitGraceRequest, amendAttendance, getCorrectionRequest, requestAttendanceCorrection } from "../api";
import { getAttendanceStats } from "../../../../../utils/attendanceStats.js";
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";
import { useAuth } from "../../../context/AuthContext";

export default function AttendanceManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [correctionRequest, setCorrectionRequest] = useState(null);
  const [selectedAttendees, setSelectedAttendees] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState("");
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
      
      if (eventRes.data.data.status === "completed") {
        try {
          const correctionRes = await getCorrectionRequest(eventId);
          setCorrectionRequest(correctionRes.data.data || null);
        } catch (e) {
          // ignore if 404
        }
      }
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
    if (!isOngoing && !isCompleted) return;
    if (selectedAttendees.size === attendees.length) {
      setSelectedAttendees(new Set());
    } else {
      setSelectedAttendees(new Set(attendees.map((a) => a.userId?._id).filter(Boolean)));
    }
  };

  const handleMarkAttendance = async () => {
    if (!isOngoing && !isCompleted) {
      toast.info("Attendance can only be modified for ongoing or completed events.");
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

      let response;
      if (isCompleted) {
        response = await amendAttendance(eventId, [...selected]);
        // Also refetch analytics to get updated review lists if needed
        const newAnalytics = await fetchEventAnalytics(eventId);
        setAnalytics(newAnalytics.data.data || null);
      } else {
        response = await api.post(`/events/${eventId}/attendance`, {
          attendeeIds: [...selected],
        });
      }

      if (changedCount > 0) {
        toast.success(`${changedCount} attendance(s) marked`);
      } else {
        toast.success(response.data?.message || "Attendance updated");
      }

      if (isCompleted) {
        const correctionRes = await getCorrectionRequest(eventId);
        setCorrectionRequest(correctionRes.data.data || null);
      }

      const updated = attendees.map((a) => {
        const uid = a.userId?._id;
        if (!uid) return a;
        if (selected.has(uid)) return { ...a, status: "attended" };
        if (prevAttended.has(uid) && !selected.has(uid)) return { ...a, status: "registered" };
        return a;
      });

      setAttendees(updated);
      setSelectedAttendees(new Set(updated.map((a) => (a.status === "attended" ? a.userId?._id : null)).filter(Boolean)));
      setAnalytics((current) =>
        current
          ? {
              ...current,
              ...getAttendanceStats({
                registeredCount: updated.length,
                attendedCount: updated.filter((attendee) => attendee.status === "attended").length,
                noShowCount: Math.max(0, updated.length - updated.filter((attendee) => attendee.status === "attended").length),
              }),
            }
          : current
      );
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
      setIsProcessing("grace");
      const response = await submitGraceRequest(eventId, reason.trim());
      toast.success(response.data.message);
      setReason("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to submit grace request");
    } finally {
      setIsProcessing("");
    }
  };

  const handleReviewAction = async (studentId, action) => {
    try {
      setIsProcessing(`${studentId}-${action}`);
      const response = await reviewAttendanceIssue(eventId, studentId, action);
      toast.success(response.data.message);
      fetchEventAndAttendees();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update attendance review");
    } finally {
      setIsProcessing("");
    }
  };

  const attendanceStats = getAttendanceStats(analytics || event || {});
  const registeredCount = attendanceStats.registered;
  const attendedCount = attendanceStats.attended;
  const noShowCount = attendanceStats.noShow;
  const attendanceRate = attendanceStats.attendanceRate;

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
    <div className="w-full">
      <PageHeader
        breadcrumb={`Events / ${event.status} / Attendance tracking`}
        title={event.title}
        subtitle={<>Venue: <span className="text-cc">{event.venue}</span> · Total Registered: <span className="text-cc font-semibold">{registeredCount}</span></>}
        actions={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-cc-soft bg-cc-surface-weak px-4 py-2 text-sm font-medium text-cc hover:bg-cc-surface transition-colors"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        }
      />

      <PageContainer className="py-6 max-w-6xl mx-auto space-y-6">

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[var(--cc-color-brand)]/50 bg-[var(--cc-color-surface-brand)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--cc-color-brand)]/70">Registered</p>
              <p className="mt-2 text-3xl font-bold text-[var(--cc-color-brand)]">{registeredCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--cc-color-success)]/50 bg-[var(--cc-color-success-soft)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--cc-color-success)]/70">Attended</p>
              <p className="mt-2 text-3xl font-bold text-[var(--cc-color-success)]">{attendedCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--cc-color-warning)]/50 bg-[var(--cc-color-warning-soft)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--cc-color-warning)]/70">No-shows</p>
              <p className="mt-2 text-3xl font-bold text-[var(--cc-color-warning)]">{noShowCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--cc-color-brand)]/50 bg-[var(--cc-color-surface-brand)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--cc-color-brand)]/70">Attendance Rate</p>
              <p className="mt-2 text-3xl font-bold text-[var(--cc-color-brand)]">{attendanceRate}%</p>
            </div>
          </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md overflow-hidden shadow-2xl shadow-[var(--cc-shadow-md)]">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-cc-soft bg-cc-surface-weak/60">
              <div>
                <h2 className="font-semibold text-cc">Attendee List</h2>
                <p className="text-xs text-cc-muted mt-1">Select students and mark presence while the event is ongoing.</p>
              </div>
              <button
                onClick={() => setSelectedAttendees(new Set())}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-cc-soft text-sm text-cc-muted hover:text-cc hover:bg-[var(--cc-color-surface-elevated)] transition-colors disabled:opacity-50"
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
                        checked={(isOngoing || isCompleted) && attendees.length > 0 && selectedAttendees.size === attendees.length}
                        onChange={toggleAll}
                        disabled={!isOngoing && !isCompleted}
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
                          ? "bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border-[var(--cc-color-success)]"
                          : "bg-[var(--cc-color-surface-brand)] text-[var(--cc-color-brand)] border-[var(--cc-color-brand)]";
                      } else {
                        statusLabel = "Pending";
                        statusClass = "bg-[var(--cc-color-background)] text-[var(--cc-color-text-muted)] border-[var(--cc-color-border)]";
                      }

                      return (
                        <tr
                          key={attendee._id}
                          className={`border-b border-cc-soft/70 transition-colors ${desired ? "bg-[var(--cc-color-surface-brand)]/20" : "hover:bg-[var(--cc-color-surface-hover)]"}`}
                        >
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={desired}
                              onChange={() => (isOngoing || (isCompleted && correctionRequest?.status === "approved")) && toggleAttendee(attendeeId)}
                              disabled={!isOngoing && !(isCompleted && correctionRequest?.status === "approved")}
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
                disabled={submitting || (!isOngoing && !(isCompleted && correctionRequest?.status === "approved"))}
                className="flex-1 rounded-xl btn-primary py-3 px-4 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : isOngoing ? "Save Attendance" : (isCompleted && correctionRequest?.status === "approved") ? "Submit Correction" : "Attendance Locked"}
              </button>
              <button
                onClick={() => setSelectedAttendees(new Set())}
                disabled={submitting}
                className="sm:w-48 rounded-xl border border-cc-soft bg-[var(--cc-color-surface-elevated)] text-cc py-3 px-4 text-sm font-semibold hover:bg-[var(--cc-color-surface-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md p-5 shadow-2xl shadow-[var(--cc-shadow-md)]">
              <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">Event Status</h3>
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-cc-soft bg-[var(--cc-color-surface-elevated)] p-4">
                  <p className="text-cc-muted text-xs uppercase tracking-widest">Current state</p>
                  <p className="mt-2 text-cc font-medium capitalize">{event.status}</p>
                </div>
                <div className="rounded-2xl border border-cc-soft bg-[var(--cc-color-surface-elevated)] p-4">
                  <p className="text-cc-muted text-xs uppercase tracking-widest">Attendance rate</p>
                  <p className="mt-2 text-cc font-medium">{attendanceRate}%</p>
                </div>
                <div className="rounded-2xl border border-cc-soft bg-[var(--cc-color-surface-elevated)] p-4">
                  <p className="text-cc-muted text-xs uppercase tracking-widest">Selection count</p>
                  <p className="mt-2 text-cc font-medium">{selectedAttendees.size} selected</p>
                </div>
              </div>
            </div>

            {isCompleted && (
              <div className="rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md p-5 shadow-2xl shadow-[var(--cc-shadow-md)] space-y-4">
                <h2 className="text-lg font-semibold text-cc">Submit Grace Request</h2>
                <p className="text-sm text-cc-muted">Add a reason if you missed the event and need faculty review.</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-cc-soft bg-[var(--cc-color-surface-elevated)] px-4 py-3 text-sm text-cc placeholder:text-cc-muted focus:outline-none focus:ring-2 focus:ring-[var(--cc-color-brand)]/50"
                  placeholder="Medical emergency, transport issue, etc."
                />
                <button
                  onClick={handleSubmitGraceRequest}
                  disabled={isProcessing === "grace"}
                  className="w-full rounded-xl bg-[var(--cc-color-success)] hover:bg-[var(--cc-color-success)]/80 text-[var(--cc-color-on-brand)] py-3 px-4 text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  {isProcessing === "grace" ? "Submitting..." : "Submit Reason"}
                </button>
              </div>
            )}

            {analytics?.reviewRequiredUsers?.length > 0 && (
              <div className="rounded-3xl border border-cc-soft bg-cc-surface/90 backdrop-blur-md overflow-hidden shadow-2xl shadow-[var(--cc-shadow-md)]">
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
                        <button disabled={isProcessing === `${student._id}-approveGrace`} onClick={() => handleReviewAction(student._id, "approveGrace")} className="px-3 py-2 rounded-xl bg-[var(--cc-color-success)] text-[var(--cc-color-on-brand)] text-xs font-medium hover:bg-[var(--cc-color-success)]/80 transition-colors disabled:opacity-50">Approve Grace</button>
                        <button disabled={isProcessing === `${student._id}-reduceWarning`} onClick={() => handleReviewAction(student._id, "reduceWarning")} className="px-3 py-2 rounded-xl bg-[var(--cc-color-warning)] text-[var(--cc-color-on-brand)] text-xs font-medium hover:bg-[var(--cc-color-warning)]/80 transition-colors disabled:opacity-50">Reduce Warning</button>
                        <button disabled={isProcessing === `${student._id}-blockStudent`} onClick={() => handleReviewAction(student._id, "blockStudent")} className="px-3 py-2 rounded-xl bg-[var(--cc-color-danger)] text-[var(--cc-color-on-brand)] text-xs font-medium hover:bg-[var(--cc-color-danger)]/80 transition-colors disabled:opacity-50">Block Student</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="rounded-3xl border border-[var(--cc-color-warning)]/60 bg-[var(--cc-color-warning-soft)] p-5 shadow-2xl shadow-[var(--cc-shadow-md)] space-y-4">
                <h3 className="text-lg font-semibold text-[var(--cc-color-warning)]">Request Correction</h3>
                
                {(() => {
                  if (correctionRequest) {
                    return (
                      <div className="space-y-2 text-sm text-[var(--cc-color-warning)]">
                        <p>Status: <strong className="capitalize">{correctionRequest.status}</strong></p>
                        {correctionRequest.status === "approved" && (
                          <p>You may now amend attendance. Check the boxes and click "Submit Correction".</p>
                        )}
                        {correctionRequest.status === "rejected" && (
                          <p>Reason: {correctionRequest.facultyRemark}</p>
                        )}
                      </div>
                    );
                  }

                  const isOrgAdmin = user?.roles?.includes("orgAdmin");
                  const completionDate = event.endDate || event.updatedAt;
                  const isWindowExpired = new Date(completionDate).getTime() < Date.now() - 24 * 60 * 60 * 1000;

                  if (isWindowExpired && !isOrgAdmin) {
                    return (
                      <div className="p-3 rounded-xl bg-[var(--cc-color-danger)]/10 text-[var(--cc-color-danger)] text-sm">
                        <p className="font-semibold">Correction Window Expired</p>
                        <p>Please contact an organization administrator.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {isWindowExpired && isOrgAdmin && (
                        <div className="p-3 mb-2 rounded-xl bg-[var(--cc-color-warning)]/20 text-[var(--cc-color-warning)] text-sm font-semibold border border-[var(--cc-color-warning)]/40">
                          Emergency Override Available
                        </div>
                      )}
                      <p className="text-sm text-[var(--cc-color-warning)]/80">Request orgAdmin approval to amend attendance.</p>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-[var(--cc-color-warning)]/40 bg-transparent px-4 py-3 text-sm text-[var(--cc-color-warning)] placeholder:text-[var(--cc-color-warning)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--cc-color-warning)]/50"
                        placeholder="Why do you need to correct attendance?"
                      />
                      <button
                        onClick={handleRequestCorrection}
                        disabled={isProcessing === "correction"}
                        className="w-full rounded-xl bg-[var(--cc-color-warning)] hover:bg-[var(--cc-color-warning)]/80 text-black py-3 px-4 text-sm font-semibold transition-colors disabled:opacity-40"
                      >
                        {isProcessing === "correction" ? "Submitting..." : "Submit Correction Request"}
                      </button>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="rounded-3xl border border-[var(--cc-color-brand)]/60 bg-[var(--cc-color-surface-brand)] p-5 shadow-2xl shadow-[var(--cc-shadow-md)]">
              <p className="text-sm text-indigo-200">
                <strong>Tip:</strong> Check the box next to each student name to mark them as present. You can also uncheck attendees; click "Save Attendance" to persist changes.
              </p>
            </div>
          </div>
        </div>

        {!isOngoing && !isCompleted && (
          <div className="rounded-3xl border border-[var(--cc-color-warning)]/60 bg-[var(--cc-color-warning-soft)] p-5 text-sm text-[var(--cc-color-warning)]">
            Attendance is locked because this event is {event.status}.
          </div>
        )}
      </PageContainer>
    </div>
  );
}
