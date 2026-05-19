import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/api";
import { useToast } from "../../../context/ToastContext";

export default function AttendanceManagement() {
  const { eventId } = useParams();
  const { showToast } = useToast();
  
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [selectedAttendees, setSelectedAttendees] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventAndAttendees();
  }, [eventId]);

  const fetchEventAndAttendees = async () => {
    try {
      setLoading(true);
      const [eventRes, attendeesRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/attendees`),
      ]);
      
      setEvent(eventRes.data.data);
      setAttendees(attendeesRes.data.data || []);
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to fetch event details", "error");
    } finally {
      setLoading(false);
    }
  };

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
    if (selectedAttendees.size === attendees.length) {
      setSelectedAttendees(new Set());
    } else {
      setSelectedAttendees(new Set(attendees.map(a => a.userId._id)));
    }
  };

  const handleMarkAttendance = async () => {
    if (selectedAttendees.size === 0) {
      showToast("Please select at least one attendee", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/events/${eventId}/attendance`, {
        attendeeIds: [...selectedAttendees],
      });

      showToast(response.data.message, "success");
      setSelectedAttendees(new Set());
      fetchEventAndAttendees();
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to mark attendance", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
        <p className="text-gray-600 mt-2">
          Venue: <span className="font-semibold">{event.venue}</span>
        </p>
        <p className="text-gray-600">
          Total Registered: <span className="font-semibold">{attendees.length}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-gray-600 text-sm">Registered</p>
          <p className="text-2xl font-bold text-blue-600">{attendees.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-gray-600 text-sm">Attended</p>
          <p className="text-2xl font-bold text-green-600">{event.attendedCount || 0}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-gray-600 text-sm">No Shows</p>
          <p className="text-2xl font-bold text-amber-600">{event.noShowCount || 0}</p>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedAttendees.size === attendees.length && attendees.length > 0}
                    onChange={toggleAll}
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
                          onChange={() => !alreadyAttended && toggleAttendee(attendee.userId._id)}
                          disabled={alreadyAttended}
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
          disabled={submitting || selectedAttendees.size === 0}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          {submitting ? "Marking..." : `Mark ${selectedAttendees.size} Present`}
        </button>
        <button
          onClick={() => setSelectedAttendees(new Set())}
          disabled={submitting}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Clear Selection
        </button>
      </div>

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
