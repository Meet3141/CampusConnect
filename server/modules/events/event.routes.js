import express from "express";
import asyncHandler from "../../middleware/asyncHandler.js";
import auth from "../../middleware/auth.js";
import authorize from "../../middleware/roleCheck.js";
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
  reviewVolunteer,
  removeVolunteer,
  getVolunteers,
  getVolunteerEvents,
  publishEvent,
  startEvent,
  restartEvent,
  endEvent,
  markAttendance,
} from "./event.controller.js";

const router = express.Router();

router.get("/volunteer-feed", asyncHandler(getVolunteerEvents));

router.post("/", auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(createEvent));
router.get("/", asyncHandler(getEvents));
router.get("/:id", asyncHandler(getEventById));
router.put("/:id", auth, asyncHandler(updateEvent));
router.delete("/:id", auth, asyncHandler(deleteEvent));

router.post("/:id/rsvp", auth, asyncHandler(rsvpEvent));
router.post("/:id/cancel-rsvp", auth, asyncHandler(cancelRsvp));
router.get("/:id/attendees", auth, asyncHandler(getAttendees));

router.post("/:id/volunteer", auth, asyncHandler(volunteerForEvent));
router.patch("/:id/volunteer/:userId/review", auth, asyncHandler(reviewVolunteer));
router.delete("/:id/volunteer/:userId", auth, asyncHandler(removeVolunteer));
router.get("/:id/volunteers", auth, asyncHandler(getVolunteers));

router.post("/:id/publish", auth, asyncHandler(publishEvent));
router.post("/:id/start", auth, asyncHandler(startEvent));
router.post("/:id/restart", auth, asyncHandler(restartEvent));
router.post("/:id/end", auth, asyncHandler(endEvent));
router.post("/:id/attendance", auth, asyncHandler(markAttendance));

export default router;