import React, { useState, useEffect, useCallback } from "react";
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
      setAttendees(attendeesRes.data.data || []);
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
      setSelectedAttendees(new Set(attendees.map(a => a.userId._id)));
    }
  };

  const handleMarkAttendance = async () => {
    if (!isOngoing) {
      toast.info("Attendance can only be marked while the event is ongoing.");
      return;
    }
    if (selectedAttendees.size === 0) {
      toast.info("Please select at least one attendee");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/events/${eventId}/attendance`, {
        attendeeIds: [...selectedAttendees],
      });

      toast.success(response.data.message);
      setSelectedAttendees(new Set());
      fetchEventAndAttendees();
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
  const attendedCount = attendees.filter((attendee) => attendee.status === "attended").length;
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
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
        <p className="text-gray-600 mt-2">
          Venue: <span className="font-semibold">{event.venue}</span>
        </p>
        <p className="text-gray-600">
          Total Registered: <span className="font-semibold">{registeredCount}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-gray-600 text-sm">Registered</p>
          <p className="text-2xl font-bold text-blue-600">{registeredCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-gray-600 text-sm">Attended</p>
          <p className="text-2xl font-bold text-green-600">{attendedCount}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-gray-600 text-sm">No-shows</p>
          <p className="text-2xl font-bold text-amber-600">{noShowCount}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <p className="text-gray-600 text-sm">Attendance Rate</p>
          <p className="text-2xl font-bold text-indigo-600">{attendanceRate}%</p>
        </div>
      </div>

      {isCompleted && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Submit Grace Request</h2>
          <p className="text-sm text-gray-600">Add a reason if you missed the event and need faculty review.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Medical emergency, transport issue, etc."
          />
          <button
            onClick={handleSubmitGraceRequest}
            disabled={submittingReason}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            {submittingReason ? "Submitting..." : "Submit Reason"}
          </button>
        </div>
      )}

      {/* Attendees Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isOngoing && selectedAttendees.size === attendees.length && attendees.length > 0}
                    onChange={toggleAll}
                    disabled={!isOngoing}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendees.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    No registered attendees
                  </td>
                </tr>
              ) : (
                attendees.map((attendee) => {
                  const isSelected = selectedAttendees.has(attendee.userId._id);
                  const alreadyAttended = attendee.status === "attended";

                  return (
                    <tr
                      key={attendee._id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected || alreadyAttended}
                          onChange={() => !alreadyAttended && isOngoing && toggleAttendee(attendee.userId._id)}
                          disabled={alreadyAttended || !isOngoing}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {attendee.userId.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{attendee.userId.email}</td>
                      <td className="px-4 py-3 text-center">
                        {alreadyAttended ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleMarkAttendance}
          disabled={submitting || selectedAttendees.size === 0 || !isOngoing}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          {submitting ? "Marking..." : isOngoing ? `Mark ${selectedAttendees.size} Present` : "Attendance Locked"}
        </button>
        <button
          onClick={() => setSelectedAttendees(new Set())}
          disabled={submitting || !isOngoing}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Clear Selection
        </button>
      </div>

      {!isOngoing && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Attendance is locked because this event is {event.status}. Use this page for analytics only.
          </p>
        </div>
      )}

      {analytics?.reviewRequiredUsers?.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Faculty Review Required</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.reviewRequiredUsers.map((student) => (
              <div key={student._id} className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">Misses: {student.missedEvents?.length || 0} · Warnings: {student.warningCount || 0}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleReviewAction(student._id, "approveGrace")} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500">Approve Grace</button>
                  <button onClick={() => handleReviewAction(student._id, "reduceWarning")} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-500">Reduce Warning</button>
                  <button onClick={() => handleReviewAction(student._id, "blockStudent")} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500">Block Student</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Tip:</strong> Check the box next to each student name to mark them as present. 
          Already marked attendees cannot be unchecked.
        </p>
      </div>
    </div>
  );
}
