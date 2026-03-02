import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/roleCheck.js";
import {
  createExternalEvent,
  extractFromPoster,
  getExternalEventById,
  getExternalEvents,
  verifyExternalEvent,
} from "../controllers/externalEventController.js";

const router = express.Router();

router.post("/ocr/extract", auth, asyncHandler(extractFromPoster));
router.post("/", auth, asyncHandler(createExternalEvent));
router.get("/", asyncHandler(getExternalEvents));
router.get("/:id", asyncHandler(getExternalEventById));
router.patch(
  "/:id/verify",
  auth,
  authorize("editor", "orgAdmin"),
  asyncHandler(verifyExternalEvent)
);

export default router;
