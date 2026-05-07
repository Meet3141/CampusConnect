import Event from "../models/Event.js";
import Club from "../models/Club.js";
import Membership from "../models/Membership.js";

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
    .populate("volunteers.userId", "name email profilePicture")
    .lean();
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });
  res.json({ success: true, data: event });
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
  res.json({ success: true, message: "Event deleted" });
};

// RSVP for event
export const rsvpEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  // Backward compatibility for legacy documents created before attendees existed.
  if (!Array.isArray(event.attendees)) {
    event.attendees = [];
  }

  // A2: Block RSVP on non-upcoming or past events
  if (event.status === "cancelled" || event.status === "completed") {
    return res.status(400).json({ success: false, message: `Cannot RSVP: event is ${event.status}` });
  }
  if (new Date(event.date) < new Date()) {
    return res.status(400).json({ success: false, message: "Cannot RSVP: event has already passed" });
  }

  const existing = event.attendees.find((a) => a.userId.toString() === req.user.id);
  if (existing && existing.status === "registered") return res.status(400).json({ success: false, message: "Already registered" });

  // OrgAdmin and clubAdmin are auto-approved (no limit checks)
  const userRoles = req.user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === req.user.id;
  const isHandler = isOrgAdmin || isClubAdmin;

  // Only enforce capacity limits for regular attendees
  if (!isHandler && event.maxAttendees && event.attendees.filter((a) => a.status === "registered").length >= event.maxAttendees) {
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

  if (!Array.isArray(event.attendees)) {
    event.attendees = [];
  }

  const attendee = event.attendees.find((a) => a.userId.toString() === req.user.id);
  if (!attendee || attendee.status !== "registered") return res.status(400).json({ success: false, message: "Not registered" });

  attendee.status = "cancelled";
  await event.save();
  res.json({ success: true, message: "Registration cancelled" });
};

// Get attendees
export const getAttendees = async (req, res) => {
  const event = await Event.findById(req.params.id).populate("attendees.userId", "name email roles");
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });
  res.json({ success: true, data: Array.isArray(event.attendees) ? event.attendees : [] });
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
  const acceptedCount = event.volunteers.filter((v) => v.status === "accepted").length;
  if (event.volunteerLimit && acceptedCount >= event.volunteerLimit) {
    return res.status(400).json({ success: false, message: "Volunteer slots are full" });
  }

  // Prevent duplicate applications
  const existing = event.volunteers.find((v) => v.userId.toString() === req.user.id);
  if (existing) {
    return res.status(400).json({ success: false, message: `You have already applied (status: ${existing.status})` });
  }

  const skills = Array.isArray(req.body.skills)
    ? req.body.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 10)
    : [];

  event.volunteers.push({ userId: req.user.id, skills, status: "pending" });
  await event.save();
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

  const volunteer = event.volunteers.find((v) => v.userId.toString() === userId);
  if (!volunteer) return res.status(404).json({ success: false, message: "Application not found" });

  // If accepting, check limit
  if (action === "accept" && event.volunteerLimit) {
    const acceptedCount = event.volunteers.filter((v) => v.status === "accepted" && v.userId.toString() !== userId).length;
    if (acceptedCount >= event.volunteerLimit) {
      return res.status(400).json({ success: false, message: "Volunteer limit already reached" });
    }
  }

  volunteer.status     = action === "accept" ? "accepted" : "rejected";
  volunteer.reviewedAt = new Date();
  await event.save();

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

  const idx = event.volunteers.findIndex((v) => v.userId.toString() === targetUserId);
  if (idx === -1) return res.status(404).json({ success: false, message: "Volunteer not found" });

  event.volunteers.splice(idx, 1);
  await event.save();
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
    .populate("volunteers.userId", "name email")
    .sort({ date: 1 })
    .limit(Number(limit))
    .lean();

  // Only return events that still have open accepted slots
  const open = events.filter((e) => {
    const accepted = e.volunteers.filter((v) => v.status === "accepted").length;
    return accepted < e.volunteerLimit;
  });

  res.json({ success: true, data: open });
};


// Get volunteers list (event creator or orgAdmin only)
export const getVolunteers = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("volunteers.userId", "name email bio interests profilePicture")
    .lean();
  if (!event) return res.status(404).json({ success: false, message: "Event not found" });

  const userRoles = req.user.roles || [];
  const isCreator = event.createdBy.toString() === req.user.id;
  if (!isCreator && !userRoles.includes("orgAdmin")) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  res.json({ success: true, data: event.volunteers });
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

  if (!Array.isArray(event.attendees)) {
    event.attendees = [];
  }

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
  let updatedCount = 0;
  event.attendees.forEach((a) => {
    if (idSet.has(a.userId.toString()) && a.status === "registered") {
      a.status = "attended";
      updatedCount++;
    }
  });

  await event.save();
  res.json({ success: true, message: `${updatedCount} attendance(s) marked`, data: event.attendees });
};
