/**
 * coordinatorCheck.js
 *
 * Middleware factory for club-scoped coordinator permissions.
 * Usage:  requireClubPermission("event.create", getClubIdFn)
 *
 * getClubIdFn(req) is a function that returns the clubId from the request.
 * Defaults to req.params.id (club routes) but can be customised for event routes.
 *
 * Permission → who is allowed
 * ─────────────────────────────────────────────────────
 * event.create              → orgAdmin | this club's admin | coordinator of this club
 * event.edit                → orgAdmin | this club's admin | coordinator who created the event
 * event.manage_registrations → orgAdmin | this club's admin | coordinator
 * event.mark_attendance     → orgAdmin | this club's admin | coordinator
 * event.publish             → orgAdmin | this club's admin ONLY (coordinators cannot publish)
 * announcement.create       → orgAdmin | this club's admin | coordinator
 * member.view               → orgAdmin | this club's admin | coordinator
 * coordinator.assign        → orgAdmin | this club's admin ONLY
 */

import Membership from "../modules/clubs/membership.model.js";
import Club from "../modules/clubs/club.model.js";

// Permissions that coordinators are allowed to perform
const COORDINATOR_PERMISSIONS = new Set([
  "event.create",
  "event.edit",
  "event.manage_registrations",
  "event.mark_attendance",
  "announcement.create",
  "member.view",
]);

/**
 * @param {string} permission  - one of the constants above
 * @param {Function} [getClubId] - (req) => clubId string.
 *   Default: req.params.clubId or req.params.id
 */
const requireClubPermission = (permission, getClubId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      const userRoles = req.user.roles || [];

      // orgAdmin always passes
      if (userRoles.includes("orgAdmin")) return next();

      // Resolve the clubId for this request
      const clubId = getClubId
        ? getClubId(req)
        : req.params.clubId || req.params.id;

      if (!clubId) {
        return res.status(400).json({ success: false, message: "Club ID could not be resolved" });
      }

      // Load the club
      const club = await Club.findById(clubId).lean();
      if (!club) {
        return res.status(404).json({ success: false, message: "Club not found" });
      }

      // Club admin of THIS club always passes
      if (club.adminId.toString() === req.user.id) return next();

      // Coordinator check — only if this permission is in the allowed set
      if (!COORDINATOR_PERMISSIONS.has(permission)) {
        // Permission is admin-only (e.g. event.publish, coordinator.assign)
        return res.status(403).json({ success: false, message: "Forbidden: admin-only action" });
      }

      // Look up the caller's membership in this club
      const membership = await Membership.findOne({
        userId: req.user.id,
        clubId,
        status: "approved",
        clubRole: "coordinator",
      }).lean();

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: coordinator access required for this club",
        });
      }

      // Attach extras for downstream controllers
      req.membership     = membership;
      req.resolvedClubId = clubId;
      req.resolvedClub   = club;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default requireClubPermission;
