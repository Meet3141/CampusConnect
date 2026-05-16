/**
 * jobs/reconcileRsvpCount.js
 * Corrects Event.rsvpCount drift by recomputing from the RSVP collection.
 */

import Event from "../modules/events/event.model.js";
import RSVP from "../modules/events/rsvp.model.js";
import logger from "../middleware/logger.js";

export const reconcileRsvpCount = async () => {
  const start = Date.now();
  logger.info("[job:reconcileRsvpCount] starting");

  // Only check events that are not yet completed/cancelled
  const events = await Event.find(
    { status: { $nin: ["completed", "cancelled"] } },
    "_id"
  ).lean();

  let corrected = 0;

  for (const ev of events) {
    const actual = await RSVP.countDocuments({
      eventId: ev._id,
      status: "registered",
    });

    const result = await Event.updateOne(
      { _id: ev._id, rsvpCount: { $ne: actual } },
      { $set: { rsvpCount: actual } }
    );

    if (result.modifiedCount > 0) corrected++;
  }

  logger.info(
    `[job:reconcileRsvpCount] done — checked ${events.length} events, corrected ${corrected} (${Date.now() - start}ms)`
  );
};
