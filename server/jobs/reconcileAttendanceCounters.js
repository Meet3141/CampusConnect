import Event from "../modules/events/event.model.js";
import RSVP from "../modules/events/rsvp.model.js";
import User from "../modules/users/user.model.js";
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

export const repairGovernanceState = async () => {
  const users = await User.find({
    $or: [
      { disciplineStatus: "blocked", isBlocked: false },
      { disciplineStatus: "blocked", blockedUntil: null },
      { disciplineStatus: "review", reviewRequired: false },
      { isBlocked: true, blockedUntil: { $lt: new Date() } }
    ]
  });

  let repairedCount = 0;

  for (const user of users) {
    let needsSave = false;

    if (user.disciplineStatus === "blocked" && (!user.isBlocked || !user.blockedUntil)) {
      // Downgrade to normal, let processNoShows recalculate if needed
      user.disciplineStatus = "normal";
      user.isBlocked = false;
      user.blockedUntil = null;
      needsSave = true;
    }

    if (user.disciplineStatus === "review" && !user.reviewRequired) {
      user.disciplineStatus = "normal";
      needsSave = true;
    }

    if (user.isBlocked && user.blockedUntil && new Date(user.blockedUntil) < new Date()) {
      user.archivedMissedEvents.push(...user.missedEvents);
      user.missedEvents = [];
      user.warningCount = 0;
      user.isBlocked = false;
      user.blockedUntil = null;
      user.disciplineStatus = "probation";
      user.probationUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      user.reviewRequired = false;
      needsSave = true;
    }

    if (needsSave) {
      await user.save();
      repairedCount++;
      logger.info(`[repair] Repaired invalid governance state for user ${user._id}`);
    }
  }
  
  return repairedCount;
};
