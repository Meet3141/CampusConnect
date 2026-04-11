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
  reviewVolunteer,
  removeVolunteer,
  getVolunteers,
  getVolunteerEvents,
  publishEvent,
  markAttendance,
} from "../controllers/eventController.js";

const router = express.Router();

// Volunteer-hub public feed (must be BEFORE /:id)
router.get("/volunteer-feed", asyncHandler(getVolunteerEvents));

router.post("/", auth, authorize("clubAdmin", "orgAdmin"), asyncHandler(createEvent));
router.get("/",   asyncHandler(getEvents));
router.get("/:id", asyncHandler(getEventById));
router.put("/:id", auth, asyncHandler(updateEvent));
router.delete("/:id", auth, asyncHandler(deleteEvent));

// Attendee actions
router.post("/:id/rsvp",        auth, asyncHandler(rsvpEvent));
router.post("/:id/cancel-rsvp", auth, asyncHandler(cancelRsvp));
router.get("/:id/attendees",    auth, asyncHandler(getAttendees));

// Volunteer actions
router.post("/:id/volunteer",                   auth, asyncHandler(volunteerForEvent));          // apply
router.patch("/:id/volunteer/:userId/review",    auth, asyncHandler(reviewVolunteer));            // accept/reject
router.delete("/:id/volunteer/:userId",          auth, asyncHandler(removeVolunteer));            // withdraw/remove
router.get("/:id/volunteers",                    auth, asyncHandler(getVolunteers));              // list (admin)

// Admin / coordinator actions
router.post("/:id/publish",    auth, asyncHandler(publishEvent));
router.post("/:id/attendance", auth, asyncHandler(markAttendance));

export default router;
