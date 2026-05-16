/**
 * jobs/cleanupExpiredEvents.js
 * Marks upcoming/ongoing events as 'completed' when their date has passed.
 * Note: event.service.js also does this inline on reads — this job keeps the DB
 * consistent even when those routes are not hit (e.g. for background stats).
 */

import Event from "../modules/events/event.model.js";
import logger from "../middleware/logger.js";

export const cleanupExpiredEvents = async () => {
  const start = Date.now();
  logger.info("[job:cleanupExpiredEvents] starting");

  const result = await Event.updateMany(
    {
      status: { $in: ["upcoming", "ongoing"] },
      date: { $lt: new Date() },
    },
    { $set: { status: "completed" } }
  );

  logger.info(
    `[job:cleanupExpiredEvents] done — ${result.modifiedCount} events marked completed (${Date.now() - start}ms)`
  );
};
