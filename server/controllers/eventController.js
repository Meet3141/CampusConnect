import Event from "../models/Event.js";
import Club from "../models/Club.js";
import Membership from "../models/Membership.js";
import RSVP from "../models/RSVP.js";
import VolunteerApplication from "../models/VolunteerApplication.js";

const syncExpiredUpcomingEvents = async () => {
  await Event.updateMany(
    {
      status: "upcoming",
      date: { $lt: new Date() },
    },
    {
      $set: { status: "completed" },
    }
  );
};

const loadEventAttendees = async (eventId) => {
  const attendees = await RSVP.find({ eventId })
    .populate("userId", "name email roles")
    .sort({ registeredAt: 1 })
    .lean();

  return attendees;
};

const loadEventVolunteers = async (eventId) => {
  const volunteers = await VolunteerApplication.find({ eventId })
    .populate("userId", "name email bio interests profilePicture")
    .sort({ appliedAt: 1 })
    .lean();

  return volunteers;
};

const attachEventRelations = async (event) => {
  const [attendees, volunteers] = await Promise.all([
    loadEventAttendees(event._id),
    loadEventVolunteers(event._id),
  ]);

  return {
    ...event,
    attendees,
    volunteers,
  };
};

// Create internal event (clubAdmin or approved coordinator)
export const createEvent = async (req, res) => {
  const {
    title, description, clubId, category, date, venue, maxAttendees, image,
    showOnVolunteerHub, volunteerLimit, volunteerSkillsNeeded,
  } = req.body;

  const club = await Club.findById(clubId);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  const userRoles = req.user.roles || [];
  const isOrgAdmin  = userRoles.includes("orgAdmin");
  const isClubAdmin = club.adminId.toString() === req.user.id;

  const membership = isOrgAdmin || isClubAdmin ? null
    : await Membership.findOne({ userId: req.user.id, clubId, status: "approved", clubRole: "coordinator" }).lean();

  if (!isOrgAdmin && !isClubAdmin && !membership) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const initialStatus = (isOrgAdmin || isClubAdmin) ? "upcoming" : "draft";

  const event = await Event.create({
    title,
    description,
    clubId,
    category,
    date,
    venue,
    maxAttendees:          maxAttendees || null,
    image:                 image || null,
    createdBy:             req.user.id,
    status:                initialStatus,
    showOnVolunteerHub:    showOnVolunteerHub === true,
    volunteerLimit:        volunteerLimit ? Number(volunteerLimit) : null,
    volunteerSkillsNeeded: Array.isArray(volunteerSkillsNeeded)
      ? volunteerSkillsNeeded.map(String).filter(Boolean)
      : [],
  });

  res.status(201).json({ success: true, data: event });
};

// Get events with filters (hide drafts from public; only show to creator/admin/coordinator)
export const getEvents = async (req, res) => {
  await syncExpiredUpcomingEvents();

  const { clubId, category, q, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (clubId) filter.clubId = clubId;
  if (category) filter.category = category;
  if (q) filter.title = { $regex: q, $options: "i" };

  // By default exclude drafts from public listing
  if (status) {
    filter.status = status;
  } else {
    filter.status = { $nin: ["draft", "pending_approval"] };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const events = await Event.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit));
  const total = await Event.countDocuments(filter);
  res.json({ success: true, data: events, meta: { total, page: Number(page), limit: Number(limit) } });
};

// Get event details
export const getEventById = async (req, res) => {
  await syncExpiredUpcomingEvents();

  const event = await Event.findById(req.params.id)
    .populate("clubId", "name adminId")
    .lean();
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const hydrated = await attachEventRelations(event);
  res.json({ success: true, data: hydrated });
};

// Update event — creator (own draft/non-published), coordinator (own draft), or admin
export const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const userRoles = req.user.roles || [];
  const isOrgAdmin  = userRoles.includes("orgAdmin");
  const isCreator   = event.createdBy.toString() === req.user.id;

  if (!isOrgAdmin && !isCreator) {
    const club = await Club.findById(event.clubId).lean();
    const isClubAdmin = club && club.adminId.toString() === req.user.id;
    if (!isClubAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  }

  const isAdminLevel = isOrgAdmin || (
    await Club.findById(event.clubId).lean().then(c => c && c.adminId.toString() === req.user.id)
  );

  const editableFields = [
    "title", "description", "date", "venue", "maxAttendees", "image", "category",
    "showOnVolunteerHub", "volunteerLimit", "volunteerSkillsNeeded",
  ];
  if (isAdminLevel) editableFields.push("status");

  editableFields.forEach((f) => {
    if (req.body[f] !== undefined) event[f] = req.body[f];
  });

  if (!isAdminLevel && req.body.submitForApproval) {
    event.status = "pending_approval";
  }

  event.updatedAt = Date.now();
  await event.save();
  res.json({ success: true, data: event });
};

// Delete event (creator or admin)
export const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const userRoles = req.user.roles || [];
  if (event.createdBy.toString() !== req.user.id && !userRoles.includes("orgAdmin")) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  await Event.findByIdAndDelete(req.params.id);
  await RSVP.deleteMany({ eventId: req.params.id });
  await VolunteerApplication.deleteMany({ eventId: req.params.id });
  res.json({ success: true, message: "Event deleted" });
};

// RSVP for event
export const rsvpEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  // A2: Block RSVP on non-upcoming or past events
  if (event.status === "cancelled" || event.status === "completed") {
    return res.status(400).json({ success: false, message: `Cannot RSVP: event is ${event.status}` });
  }
  if (new Date(event.date) < new Date()) {
    return res.status(400).json({ success: false, message: "Cannot RSVP: event has already passed" });
  }

  // OrgAdmin and clubAdmin are auto-approved (no limit checks)
  const userRoles = req.user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === req.user.id;
  const isHandler = isOrgAdmin || isClubAdmin;

  const existing = await RSVP.findOne({ eventId: event._id, userId: req.user.id });
  if (existing?.status === "registered") {
    return res.status(400).json({ success: false, message: "Already registered" });
  }

  // Only enforce capacity limits for regular attendees
  const registeredCount = await RSVP.countDocuments({ eventId: event._id, status: "registered" });
  if (!isHandler && event.maxAttendees && registeredCount >= event.maxAttendees) {
    return res.status(400).json({ success: false, message: "Event is full" });
  }

  if (existing) {
    existing.status = "registered";
    existing.registeredAt = new Date();
    await existing.save();
  } else {
    await RSVP.create({
      eventId: event._id,
      userId: req.user.id,
      status: "registered",
      registeredAt: new Date(),
    });
  }

  res.json({ success: true, message: "Registered for event" });
};

// Cancel RSVP
export const cancelRsvp = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const attendee = await RSVP.findOne({ eventId: event._id, userId: req.user.id });
  if (!attendee || attendee.status !== "registered") return res.status(400).json({ success: false, message: "Not registered" });

  attendee.status = "cancelled";
  await attendee.save();
  res.json({ success: true, message: "Registration cancelled" });
};

// Get attendees
export const getAttendees = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const attendees = await loadEventAttendees(event._id);
  res.json({ success: true, data: attendees });
};

// Apply to volunteer for an event (creates a PENDING application)
export const volunteerForEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const userRoles = req.user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const isEditor = userRoles.includes("editor");
  const club = await Club.findById(event.clubId).select("adminId").lean();
  const isClubAdmin = club && String(club.adminId) === req.user.id;
  const isEventCreator = event.createdBy && String(event.createdBy) === req.user.id;

  const coordinatorMembership = await Membership.findOne({
    userId: req.user.id,
    clubId: event.clubId,
    status: "approved",
    clubRole: "coordinator",
  }).lean();

  if (isOrgAdmin || isEditor || isClubAdmin || isEventCreator || coordinatorMembership) {
    return res.status(403).json({
      success: false,
      message: "Event admins/coordinators cannot apply as volunteers for this event",
    });
  }

  if (event.status !== "upcoming") {
    return res.status(400).json({ success: false, message: `Cannot volunteer: event is ${event.status}` });
  }

  if (!event.showOnVolunteerHub) {
    return res.status(400).json({ success: false, message: "This event is not accepting volunteer applications" });
  }

  // Check if accepted slots are already full
  const acceptedCount = await VolunteerApplication.countDocuments({ eventId: event._id, status: "accepted" });
  if (event.volunteerLimit && acceptedCount >= event.volunteerLimit) {
    return res.status(400).json({ success: false, message: "Volunteer slots are full" });
  }

  // Prevent duplicate applications
  const existing = await VolunteerApplication.findOne({ eventId: event._id, userId: req.user.id });
  if (existing) {
    return res.status(400).json({ success: false, message: `You have already applied (status: ${existing.status})` });
  }

  const skills = Array.isArray(req.body.skills)
    ? req.body.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 10)
    : [];

  await VolunteerApplication.create({
    eventId: event._id,
    userId: req.user.id,
    skills,
    status: "pending",
    appliedAt: new Date(),
  });
  res.json({ success: true, message: "Application submitted — awaiting admin review" });
};

// Admin/coordinator: accept or reject a volunteer application
export const reviewVolunteer = async (req, res) => {
  const { id, userId } = req.params;
  const { action } = req.body; // "accept" | "reject"

  if (!["accept", "reject"].includes(action)) {
    return res.status(400).json({ success: false, message: "action must be 'accept' or 'reject'" });
  }

  const event = await Event.findById(id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  // Auth: club admin, orgAdmin, or coordinator of this club
  const userRoles = req.user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === req.user.id;

  if (!isOrgAdmin && !isClubAdmin) {
    const membership = await Membership.findOne({
      userId: req.user.id, clubId: event.clubId, status: "approved", clubRole: "coordinator",
    }).lean();
    if (!membership) return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const volunteer = await VolunteerApplication.findOne({ eventId: event._id, userId });
  if (!volunteer) return res.status(404).json({ success: false, message: "Application not found" });

  // If accepting, check limit
  if (action === "accept" && event.volunteerLimit) {
    const acceptedCount = await VolunteerApplication.countDocuments({
      eventId: event._id,
      status: "accepted",
      userId: { $ne: userId },
    });
    if (acceptedCount >= event.volunteerLimit) {
      return res.status(400).json({ success: false, message: "Volunteer limit already reached" });
    }
  }

  volunteer.status     = action === "accept" ? "accepted" : "rejected";
  volunteer.reviewedAt = new Date();
  await volunteer.save();

  res.json({ success: true, message: `Volunteer ${action}ed`, data: volunteer });
};

// Remove a volunteer application (admin/coordinator or the applicant themselves)
export const removeVolunteer = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const targetUserId = req.params.userId;
  const isSelf = targetUserId === req.user.id;

  if (!isSelf) {
    const userRoles = req.user.roles || [];
    const isOrgAdmin = userRoles.includes("orgAdmin");
    const club = await Club.findById(event.clubId).lean();
    const isClubAdmin = club && club.adminId.toString() === req.user.id;
    if (!isOrgAdmin && !isClubAdmin) {
      const membership = await Membership.findOne({
        userId: req.user.id, clubId: event.clubId, status: "approved", clubRole: "coordinator",
      }).lean();
      if (!membership) return res.status(403).json({ success: false, message: "Forbidden" });
    }
  }

  const removed = await VolunteerApplication.findOneAndDelete({ eventId: event._id, userId: targetUserId });
  if (!removed) return res.status(404).json({ success: false, message: "Volunteer not found" });

  res.json({ success: true, message: "Volunteer removed" });
};

// Public feed: upcoming events with showOnVolunteerHub=true and open accepted slots
export const getVolunteerEvents = async (req, res) => {
  const { limit = 50 } = req.query;

  const events = await Event.find({
    status: "upcoming",
    showOnVolunteerHub: true,
    volunteerLimit: { $gt: 0 },
  })
    .populate("clubId", "name category adminId")
    .sort({ date: 1 })
    .limit(Number(limit))
    .lean();

  const eventIds = events.map((e) => e._id);
  const applications = eventIds.length
    ? await VolunteerApplication.find({ eventId: { $in: eventIds } })
        .populate("userId", "name email")
        .sort({ appliedAt: 1 })
        .lean()
    : [];

  const applicationsByEvent = new Map();
  for (const application of applications) {
    const key = String(application.eventId);
    if (!applicationsByEvent.has(key)) {
      applicationsByEvent.set(key, []);
    }
    applicationsByEvent.get(key).push(application);
  }

  // Only return events that still have open accepted slots
  const open = events
    .map((e) => ({ ...e, volunteers: applicationsByEvent.get(String(e._id)) || [] }))
    .filter((e) => {
      const accepted = e.volunteers.filter((v) => v.status === "accepted").length;
      return accepted < e.volunteerLimit;
    });

  res.json({ success: true, data: open });
};


// Get volunteers list (event creator or orgAdmin only)
export const getVolunteers = async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const userRoles = req.user.roles || [];
  const isCreator = event.createdBy.toString() === req.user.id;
  if (!isCreator && !userRoles.includes("orgAdmin")) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const volunteers = await loadEventVolunteers(event._id);
  res.json({ success: true, data: volunteers });
};

// ── Publish event (clubAdmin or orgAdmin ONLY) ─────────────────────────────────
// Moves a draft or pending_approval event to upcoming
export const publishEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const userRoles = req.user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === req.user.id;

  if (!isOrgAdmin && !isClubAdmin) {
    return res.status(403).json({ success: false, message: "Only the club admin can publish events" });
  }

  if (!["draft", "pending_approval"].includes(event.status)) {
    return res.status(400).json({ success: false, message: `Cannot publish: event is already '${event.status}'` });
  }

  event.status = "upcoming";
  await event.save();
  res.json({ success: true, message: "Event published", data: event });
};

// ── Mark attendance (coordinator or admin) ──────────────────────────────────────
// Body: { attendeeIds: [userId, ...] }  → marks those attendees as 'attended'
export const markAttendance = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const userRoles = req.user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === req.user.id;

  if (!isOrgAdmin && !isClubAdmin) {
    // Check if coordinator of this club
    const membership = await Membership.findOne({
      userId: req.user.id,
      clubId: event.clubId,
      status: "approved",
      clubRole: "coordinator",
    }).lean();
    if (!membership) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  }

  const { attendeeIds } = req.body;
  if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
    return res.status(400).json({ success: false, message: "attendeeIds must be a non-empty array" });
  }

  const idSet = new Set(attendeeIds.map(String));
  const result = await RSVP.updateMany(
    {
      eventId: event._id,
      userId: { $in: [...idSet] },
      status: "registered",
    },
    {
      $set: { status: "attended" },
    }
  );

  const attendees = await loadEventAttendees(event._id);
  res.json({ success: true, message: `${result.modifiedCount} attendance(s) marked`, data: attendees });
};
