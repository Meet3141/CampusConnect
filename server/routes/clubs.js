import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/roleCheck.js";
import {
  createClub,
  getClubs,
  getClubById,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
  getMembers,
  approveMember,
  rejectMember,
} from "../controllers/clubController.js";

const router = express.Router();

router.post("/", auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(createClub));
router.get("/", asyncHandler(getClubs));
router.get("/:id", asyncHandler(getClubById));
router.put("/:id", auth, asyncHandler(updateClub));
router.delete("/:id", auth, authorize("orgAdmin"), asyncHandler(deleteClub));

router.post("/:id/join", auth, asyncHandler(joinClub));
router.post("/:id/leave", auth, asyncHandler(leaveClub));
router.get("/:id/members", auth, asyncHandler(getMembers));
router.post("/:id/approve-member", auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(approveMember));
router.post("/:id/reject-member", auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(rejectMember));

export default router;
