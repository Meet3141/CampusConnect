import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import auth from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";    // B: for role-aware public routes
import authorize from "../middleware/roleCheck.js";
import {
  createExternalEvent,
  extractFromPoster,
  getExternalEventById,
  getExternalEvents,
  verifyExternalEvent,
  updateExternalEvent,   // C: edit by uploader or editor
} from "../controllers/externalEventController.js";

const router = express.Router();

router.post("/ocr/extract", auth, asyncHandler(extractFromPoster));
router.post("/",            auth, asyncHandler(createExternalEvent));
router.get("/",             asyncHandler(getExternalEvents));

// B: optionalAuth — identifies user if logged in, but doesn't block public access
router.get("/:id",     optionalAuth, asyncHandler(getExternalEventById));
// C: uploader can edit their own unverified event; editor/orgAdmin can edit any
router.put("/:id",     auth,         asyncHandler(updateExternalEvent));

router.patch(
  "/:id/verify",
  auth,
  authorize("editor", "orgAdmin"),
  asyncHandler(verifyExternalEvent)
);

export default router;

