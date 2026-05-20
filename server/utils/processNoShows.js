import Event from "../modules/events/event.model.js";
import RSVP from "../modules/events/rsvp.model.js";
import User from "../modules/users/user.model.js";
import { createHttpError } from "./httpError.js";
import ReviewHistory from "../modules/events/review-history.model.js";
import Notification from "../modules/notifications/notification.model.js";

export const processNoShows = async (eventId) => {
  const event = await Event.findById(eventId).lean();
  if (!event) throw createHttpError(404, "Event not found");
  const policy = event.attendancePolicy || {};
  const strictAttendance = policy.strictAttendance === true;
  const countWarnings = strictAttendance && policy.countWarnings === true;
  const allowGraceReview = policy.allowGraceReview !== false;

  const registeredAttendees = await RSVP.find({
    eventId,
    status: "registered",
  })
    .select("userId")
    .lean();

  const attendedAttendees = await RSVP.find({
    eventId,
    status: "attended",
  })
    .select("userId")
    .lean();

  const attendedSet = new Set(attendedAttendees.map((attendee) => String(attendee.userId)));
  const noShowUserIds = registeredAttendees
    .map((attendee) => attendee.userId)
    .filter((userId) => !attendedSet.has(String(userId)));

  if (noShowUserIds.length === 0) {
    return { noShowCount: 0, noShowUserIds: [] };
  }

  const reviewedUsers = [];
  const blockedUsers = [];
  const warnedUsers = [];
  const reminderUsers = [];

  for (const userId of noShowUserIds) {
    const user = await User.findById(userId);
    if (!user) continue;

    user.missedEvents = Array.isArray(user.missedEvents) ? user.missedEvents : [];
    const alreadyMissed = user.missedEvents.some((missedEventId) => String(missedEventId) === String(event._id));
    if (!alreadyMissed) {
      user.missedEvents.push(event._id);
    }

    const missedCount = user.missedEvents.length;
    const warningLimit = Number(policy.warningLimit || 3);
    user.disciplineStatus = "normal";

    if (!strictAttendance) {
      reminderUsers.push(user._id);
      user.reviewRequired = false;
      user.disciplineStatus = "normal";
      await user.save();
      await Notification.create({
        userId: user._id,
        type: "warning",
        title: "Attendance reminder",
        message: "You missed an event. No warning was applied because this event is relaxed by policy.",
        eventId: event._id,
      });
      continue;
    }

    if (countWarnings && missedCount === 2) {
      user.warningCount = (user.warningCount || 0) + 1;
      warnedUsers.push(user._id);
      user.disciplineStatus = "warning";
      await Notification.create({
        userId: user._id,
        type: "warning",
        title: "Attendance warning",
        message: "You missed 2 strict events. Your attendance record has been updated.",
        eventId: event._id,
      });
    }

    if (allowGraceReview && missedCount >= 3) {
      user.reviewRequired = true;
      reviewedUsers.push(user._id);
      user.disciplineStatus = "review";
      await Notification.create({
        userId: user._id,
        type: "review",
        title: "Attendance review required",
        message: "Your attendance case is under review by faculty.",
        eventId: event._id,
      });
    }

    if ((missedCount >= 4 || (user.warningCount || 0) >= warningLimit) && policy.strictAttendance) {
      user.isBlocked = true;
      user.blockedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      user.reviewRequired = false;
      user.disciplineStatus = "blocked";
      blockedUsers.push(user._id);
      await Notification.create({
        userId: user._id,
        type: "blocked",
        title: "Temporary attendance block",
        message: "Your attendance access has been temporarily blocked.",
        eventId: event._id,
      });
    }

    await user.save();

    await ReviewHistory.create({
      eventId: event._id,
      userId: user._id,
      action: user.isBlocked
        ? "STUDENT_BLOCKED"
        : user.reviewRequired
          ? "GRACE_REJECTED"
          : missedCount === 2
            ? "WARNING_REDUCED"
            : "GRACE_APPROVED",
      performedBy: user._id,
      role: "system",
      reason: "processNoShows",
    });
  }

  await Event.findByIdAndUpdate(event._id, {
    $inc: { noShowCount: noShowUserIds.length },
  });

  return {
    noShowCount: noShowUserIds.length,
    noShowUserIds,
    reminderUsers,
    warnedUsers,
    reviewedUsers,
    blockedUsers,
  };
};