import Event from "../modules/events/event.model.js";
import RSVP from "../modules/events/rsvp.model.js";
import User from "../modules/users/user.model.js";
import { createHttpError } from "./httpError.js";
import ReviewHistory from "../modules/events/review-history.model.js";

export const processNoShows = async (eventId) => {
  const event = await Event.findById(eventId).lean();
  if (!event) throw createHttpError(404, "Event not found");
  const policy = event.attendancePolicy || {};

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

    if (policy.countWarnings !== false && missedCount === 2) {
      user.warningCount = (user.warningCount || 0) + 1;
      warnedUsers.push(user._id);
    }

    if (missedCount >= 3) {
      user.reviewRequired = true;
      reviewedUsers.push(user._id);
    }

    if ((missedCount >= 4 || (user.warningCount || 0) >= warningLimit) && policy.strictAttendance) {
      user.isBlocked = true;
      user.blockedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      user.reviewRequired = false;
      blockedUsers.push(user._id);
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
    warnedUsers,
    reviewedUsers,
    blockedUsers,
  };
};