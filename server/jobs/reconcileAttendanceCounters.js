import Event from "../modules/events/event.model.js";
import RSVP from "../modules/events/rsvp.model.js";
import User from "../modules/users/user.model.js";
import Notification from "../modules/notifications/notification.model.js";
import logger from "../middleware/logger.js";
import { recalculateDisciplineState } from "../utils/governanceUtils.js";

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
      { isBlocked: true, blockedUntil: { $lt: new Date() } },
      { disciplineStatus: "probation", probationUntil: { $lt: new Date() } }
    ]
  });

  let repairedCount = 0;

  for (const user of users) {
    let needsSave = false;
    let enteringProbation = false;
    const wasProbation = user.disciplineStatus === "probation";

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
      enteringProbation = true;
    }

    // Always run through the deterministic engine to catch any other drift
    const newState = recalculateDisciplineState(user, {});
    
    if (
      user.disciplineStatus !== newState.disciplineStatus ||
      user.isBlocked !== newState.isBlocked ||
      user.reviewRequired !== newState.reviewRequired
    ) {
      user.disciplineStatus = newState.disciplineStatus;
      user.isBlocked = newState.isBlocked;
      user.blockedUntil = newState.blockedUntil || user.blockedUntil;
      user.reviewRequired = newState.reviewRequired || user.reviewRequired;
      needsSave = true;
    }

    if (needsSave) {
      await user.save();
      repairedCount++;
      
      // Emit Notification A if block expired into probation
      if (enteringProbation) {
        await Notification.create({
          userId: user._id,
          type: "system",
          title: "Block Expired",
          message: "You have completed your attendance block. Your account is now under a 30-day probation period. Any additional unexcused absence may result in an immediate attendance block."
        });
      }
      
      // Emit Notification B if probation successfully completed
      if (wasProbation && user.disciplineStatus === "normal") {
        await Notification.create({
          userId: user._id,
          type: "system",
          title: "Probation Successfully Completed",
          message: "Congratulations. Your probation period has ended and your attendance status has returned to normal."
        });
      }

      logger.info(`[repair] Repaired invalid governance state for user ${user._id}`);
    }
  }
  
  return repairedCount;
};
