import Event from "../modules/events/event.model.js";
import RSVP from "../modules/events/rsvp.model.js";
import logger from "../middleware/logger.js";

export const reconcileAttendanceCounters = async () => {
  const events = await Event.find({ status: { $in: ["ongoing", "completed"] } });

  for (const event of events) {
    const registeredCount = await RSVP.countDocuments({ eventId: event._id });
    const attendedCount = await RSVP.countDocuments({ eventId: event._id, status: "attended" });

    if (event.registeredCount !== registeredCount || event.attendedCount !== attendedCount) {
      logger.info(`[reconcile] Event ${event._id} counters drifted. Reg: ${event.registeredCount}->${registeredCount}, Att: ${event.attendedCount}->${attendedCount}`);
      await Event.findByIdAndUpdate(event._id, {
        $set: { registeredCount, attendedCount }
      });
    }
  }
};
