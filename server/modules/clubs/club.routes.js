import express from "express";
import asyncHandler from "../../middleware/asyncHandler.js";
import auth from "../../middleware/auth.js";
import authorize from "../../middleware/roleCheck.js";
import requireClubPermission from "../../middleware/coordinatorCheck.js";
import {
  createClub, getClubs, getMyClubs, getClubById, updateClub, deleteClub,
  joinClub, leaveClub, getMembers, approveMember, rejectMember, assignCoordinator, removeCoordinator,
  getAnnouncements, createAnnouncement, deleteAnnouncement, pinAnnouncement,
} from "./club.controller.js";

const router = express.Router();

router.get("/",      asyncHandler(getClubs));
router.get("/mine",  auth, asyncHandler(getMyClubs));
router.get("/:id",   asyncHandler(getClubById));

router.post("/",   auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(createClub));
router.put("/:id", auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(updateClub));
router.delete("/:id", auth, authorize("orgAdmin"), asyncHandler(deleteClub));

router.post("/:id/join",            auth, asyncHandler(joinClub));
router.post("/:id/leave",           auth, asyncHandler(leaveClub));
router.get("/:id/members",          auth, asyncHandler(getMembers));
router.post("/:id/approve-member",  auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(approveMember));
router.post("/:id/reject-member",   auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(rejectMember));

router.post("/:id/coordinator/assign",    auth, asyncHandler(assignCoordinator));
router.delete("/:id/coordinator/:userId", auth, asyncHandler(removeCoordinator));

router.get("/:id/announcements",  auth, asyncHandler(getAnnouncements));
router.post("/:id/announcements", auth, requireClubPermission("announcement.create"), asyncHandler(createAnnouncement));
router.delete("/:id/announcements/:annId", auth, asyncHandler(deleteAnnouncement));
router.patch("/:id/announcements/:annId/pin", auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(pinAnnouncement));

export default router;
