import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/roleCheck.js";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
  getAttendees,
  volunteerForEvent,
} from "../controllers/eventController.js";

const router = express.Router();

router.post("/", auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(createEvent));
router.get("/", asyncHandler(getEvents));
router.get("/:id", asyncHandler(getEventById));
router.put("/:id", auth, asyncHandler(updateEvent));
router.delete("/:id", auth, asyncHandler(deleteEvent));

router.post("/:id/rsvp", auth, asyncHandler(rsvpEvent));
router.post("/:id/cancel-rsvp", auth, asyncHandler(cancelRsvp));
router.get("/:id/attendees", auth, asyncHandler(getAttendees));
router.post("/:id/volunteer", auth, asyncHandler(volunteerForEvent));

export default router;
