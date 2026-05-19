import Event from "../modules/events/event.model.js";
import RSVP from "../modules/events/rsvp.model.js";
import User from "../modules/users/user.model.js";
import { createHttpError } from "./httpError.js";

export const processNoShows = async (eventId) => {
  const event = await Event.findById(eventId).lean();
  if (!event) throw createHttpError(404, "Event not found");

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

  await User.updateMany(
    { _id: { $in: noShowUserIds } },
    {
      $addToSet: { missedEvents: event._id },
    }
  );

  await Event.findByIdAndUpdate(event._id, {
    $inc: { noShowCount: noShowUserIds.length },
  });

  return {
    noShowCount: noShowUserIds.length,
    noShowUserIds,
  };
};