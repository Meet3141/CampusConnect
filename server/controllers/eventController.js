import Event from "../models/Event.js";
import Club from "../models/Club.js";

// Create internal event (clubAdmin)
export const createEvent = async (req, res) => {
  const { title, description, clubId, category, date, venue, maxAttendees, image } = req.body;

  const club = await Club.findById(clubId);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  // Only the club admin (or orgAdmin) may create events for this club
  if (!(req.user.role === "orgAdmin" || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const event = await Event.create({
    title,
    description,
    clubId,
    category,
    date,
    venue,
    maxAttendees: maxAttendees || null,
    image: image || null,
    createdBy: req.user.id,
  });

  res.status(201).json({ success: true, data: event });
};

// Get events with filters
export const getEvents = async (req, res) => {
  const { clubId, category, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (clubId) filter.clubId = clubId;
  if (category) filter.category = category;
  if (q) filter.title = { $regex: q, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const events = await Event.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit));
  const total = await Event.countDocuments(filter);
  res.json({ success: true, data: events, meta: { total, page: Number(page), limit: Number(limit) } });
};

// Get event details
export const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).populate("clubId", "name").lean();
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });
  res.json({ success: true, data: event });
};

// Update event (creator only)
export const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  if (event.createdBy.toString() !== req.user.id && req.user.role !== "orgAdmin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const fields = ["title", "description", "date", "venue", "maxAttendees", "image", "status", "category"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) event[f] = req.body[f];
  });

  event.updatedAt = Date.now();
  await event.save();
  res.json({ success: true, data: event });
};

// Delete event (creator or admin)
export const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  if (event.createdBy.toString() !== req.user.id && req.user.role !== "orgAdmin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  await event.remove();
  res.json({ success: true, message: "Event deleted" });
};

// RSVP for event
export const rsvpEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const existing = event.attendees.find((a) => a.userId.toString() === req.user.id);
  if (existing && existing.status === "registered") return res.status(400).json({ success: false, message: "Already registered" });

  if (event.maxAttendees && event.attendees.filter((a) => a.status === "registered").length >= event.maxAttendees) {
    return res.status(400).json({ success: false, message: "Event is full" });
  }

  if (existing) {
    existing.status = "registered";
    existing.registeredAt = Date.now();
  } else {
    event.attendees.push({ userId: req.user.id, status: "registered" });
  }

  await event.save();
  res.json({ success: true, message: "Registered for event" });
};

// Cancel RSVP
export const cancelRsvp = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const attendee = event.attendees.find((a) => a.userId.toString() === req.user.id);
  if (!attendee || attendee.status !== "registered") return res.status(400).json({ success: false, message: "Not registered" });

  attendee.status = "cancelled";
  await event.save();
  res.json({ success: true, message: "Registration cancelled" });
};

// Get attendees
export const getAttendees = async (req, res) => {
  const event = await Event.findById(req.params.id).populate("attendees.userId", "name email role");
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });
  res.json({ success: true, data: event.attendees });
};

// Volunteer for event
export const volunteerForEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  if (event.volunteers.find((v) => v.toString() === req.user.id)) {
    return res.status(400).json({ success: false, message: "Already a volunteer" });
  }

  event.volunteers.push(req.user.id);
  await event.save();
  res.json({ success: true, message: "Signed up as volunteer" });
};

export default {};
