import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/roleCheck.js";
import {
  getPostings,
  getPostingById,
  createPosting,
  updatePosting,
  deletePosting,
  applyToPosting,
  withdrawApplication,
  reviewApplication,
  getMyPostings,
  getMyApplications,
} from "../controllers/volunteerController.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/",    asyncHandler(getPostings));
router.get("/:id", asyncHandler(getPostingById));

// ── Auth required ─────────────────────────────────────────────────────────────
router.use(auth);

// My postings and applications
router.get("/user/my-postings",    asyncHandler(getMyPostings));
router.get("/user/my-applications", asyncHandler(getMyApplications));

// Create — clubAdmin or orgAdmin
router.post(
  "/",
  authorize("clubAdmin", "orgAdmin"),
  asyncHandler(createPosting)
);

// Update / Delete (scope-checked inside controller)
router.put("/:id",    asyncHandler(updatePosting));
router.delete("/:id", asyncHandler(deletePosting));

// Applications — any logged-in user
router.post("/:id/apply",    asyncHandler(applyToPosting));
router.post("/:id/withdraw", asyncHandler(withdrawApplication));

// Review application — poster or orgAdmin (scope-checked inside controller)
router.patch("/:id/review", asyncHandler(reviewApplication));

export default router;
