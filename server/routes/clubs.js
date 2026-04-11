import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/roleCheck.js";
import requireClubPermission from "../middleware/coordinatorCheck.js";
import {
  createClub,
  getClubs,
  getMyClubs,
  getClubById,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
  getMembers,
  approveMember,
  rejectMember,
  assignCoordinator,
  removeCoordinator,
} from "../controllers/clubController.js";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  pinAnnouncement,
} from "../controllers/announcementController.js";

const router = express.Router();

// Public listing
router.get("/",     asyncHandler(getClubs));

// ── /mine must come BEFORE /:id ──
router.get("/mine", auth, asyncHandler(getMyClubs));

router.get("/:id",  asyncHandler(getClubById));

// Mutations — role-guarded
router.post(
  "/",
  auth,
  authorize("clubAdmin", "orgAdmin"),
  asyncHandler(createClub)
);

// PUT — defence-in-depth role check
router.put(
  "/:id",
  auth,
  authorize("clubAdmin", "orgAdmin"),
  asyncHandler(updateClub)
);

router.delete(
  "/:id",
  auth,
  authorize("orgAdmin"),
  asyncHandler(deleteClub)
);

// Membership actions — any authenticated user
router.post("/:id/join",   auth, asyncHandler(joinClub));
router.post("/:id/leave",  auth, asyncHandler(leaveClub));
router.get("/:id/members", auth, asyncHandler(getMembers));

// Membership approval — clubAdmin or orgAdmin
router.post(
  "/:id/approve-member",
  auth,
  authorize("clubAdmin", "orgAdmin"),
  asyncHandler(approveMember)
);
router.post(
  "/:id/reject-member",
  auth,
  authorize("clubAdmin", "orgAdmin"),
  asyncHandler(rejectMember)
);

// ── Coordinator management (club admin or orgAdmin) ──────────────────────────
router.post("/:id/coordinator/assign",    auth, asyncHandler(assignCoordinator));
router.delete("/:id/coordinator/:userId", auth, asyncHandler(removeCoordinator));

// ── Announcements ─────────────────────────────────────────────────────────────
// Read: any approved member (scoped inside controller)
router.get("/:id/announcements", auth, asyncHandler(getAnnouncements));

// Write: club admin OR coordinator (via requireClubPermission)
router.post(
  "/:id/announcements",
  auth,
  requireClubPermission("announcement.create"),
  asyncHandler(createAnnouncement)
);

// Delete: author, club admin, orgAdmin — scope-checked in controller
router.delete("/:id/announcements/:annId", auth, asyncHandler(deleteAnnouncement));

// Pin: admin-only
router.patch(
  "/:id/announcements/:annId/pin",
  auth,
  authorize("clubAdmin", "orgAdmin"),
  asyncHandler(pinAnnouncement)
);

export default router;
