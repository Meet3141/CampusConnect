/**
 * jobs/reconcileMemberCount.js
 * Corrects Club.memberCount drift by recomputing from the Membership collection.
 * Runs via the scheduler — safe to call at any time.
 */

import Club from "../modules/clubs/club.model.js";
import Membership from "../modules/clubs/membership.model.js";
import logger from "../middleware/logger.js";

export const reconcileMemberCount = async () => {
  const start = Date.now();
  logger.info("[job:reconcileMemberCount] starting");

  const clubs = await Club.find({}, "_id").lean();
  let corrected = 0;

  for (const club of clubs) {
    const actual = await Membership.countDocuments({
      clubId: club._id,
      status: "approved",
    });

    const result = await Club.updateOne(
      { _id: club._id, memberCount: { $ne: actual } },
      { $set: { memberCount: actual } }
    );

    if (result.modifiedCount > 0) corrected++;
  }

  logger.info(
    `[job:reconcileMemberCount] done — checked ${clubs.length} clubs, corrected ${corrected} (${Date.now() - start}ms)`
  );
};
