/**
 * jobs/scheduler.js
 * Node-cron scheduler — runs all background jobs on fixed intervals.
 *
 * Schedule:
 *  - reconcileMemberCount  → every 10 minutes
 *  - reconcileRsvpCount    → every 10 minutes
 *  - cleanupExpiredEvents  → every hour
 */

import cron from "node-cron";
import logger from "../middleware/logger.js";
import { reconcileMemberCount } from "./reconcileMemberCount.js";
import { reconcileRsvpCount } from "./reconcileRsvpCount.js";
import { cleanupExpiredEvents } from "./cleanupExpiredEvents.js";
import { reconcileAttendanceCounters } from "./reconcileAttendanceCounters.js";
import { cleanupExpiredBlocks } from "../modules/events/event.service.js";
import { runMorningDigest } from "./morningDigest.js";

const safeRun = async (name, fn) => {
  try {
    await fn();
  } catch (err) {
    logger.error(`[scheduler] ${name} failed: ${err.message}`, { stack: err.stack });
  }
};

export const startScheduler = () => {
  // Every 10 minutes
  cron.schedule("*/10 * * * *", () => {
    safeRun("reconcileMemberCount", reconcileMemberCount);
    safeRun("reconcileRsvpCount", reconcileRsvpCount);
  });

  // Every hour at :00
  cron.schedule("0 * * * *", () => {
    safeRun("cleanupExpiredEvents", cleanupExpiredEvents);
    safeRun("cleanupExpiredBlocks", cleanupExpiredBlocks);
    safeRun("reconcileAttendanceCounters", reconcileAttendanceCounters);
  });

  // Daily at 8:00 AM — Morning Digest event reminders
  cron.schedule("0 8 * * *", () => {
    safeRun("runMorningDigest", runMorningDigest);
  });

  logger.info("[scheduler] started — reconcile every 10min, cleanup every 1hr, morning digest daily at 8 AM");
};
