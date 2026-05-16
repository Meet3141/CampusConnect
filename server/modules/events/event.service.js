import Event from "./event.model.js";
import Club from "../clubs/club.model.js";
import Membership from "../clubs/membership.model.js";
import RSVP from "./rsvp.model.js";
import VolunteerApplication from "./volunteer-application.model.js";
import { createHttpError } from "../../utils/httpError.js";
import { getOrSet, invalidate } from "../../utils/cache.js";

const EVENT_CACHE_TTL = 60; // seconds

const parsePagination = (query, defaultLimit = 10, maxLimit = 50) => {
  const hasPage = query?.page !== undefined;
  const hasLimit = query?.limit !== undefined;
  if (!hasPage && !hasLimit) return null;

  const pageRaw = Number(query.page);
  const limitRaw = Number(query.limit);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limitBase = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : defaultLimit;
  const limit = Math.min(limitBase, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

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

const loadEventAttendees = async (eventId, pagination) => {
  const query = RSVP.find({ eventId })
    .populate("userId", "name email roles")
    .sort({ registeredAt: 1 });

  if (pagination) {
    query.skip(pagination.skip).limit(pagination.limit);
  }

  return query.lean();
};

const loadEventVolunteers = async (eventId, pagination) => {
  const query = VolunteerApplication.find({ eventId })
    .populate("userId", "name email bio interests profilePicture")
    .sort({ appliedAt: 1 });

  if (pagination) {
    query.skip(pagination.skip).limit(pagination.limit);
  }

  return query.lean();
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

export const createEvent = async ({ body, user }) => {
  const {
    title,
    description,
    clubId,
    category,
    date,
    venue,
    maxAttendees,
    image,
    showOnVolunteerHub,
    volunteerLimit,
    volunteerSkillsNeeded,
  } = body;

  const club = await Club.findById(clubId);
  if (!club) throw createHttpError(404, "Club not found");

  const userRoles = user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const isClubAdmin = club.adminId.toString() === user.id;

  const membership = isOrgAdmin || isClubAdmin
    ? null
    : await Membership.findOne({
        userId: user.id,
        clubId,
        status: "approved",
        clubRole: "coordinator",
      }).lean();

  if (!isOrgAdmin && !isClubAdmin && !membership) {
    throw createHttpError(403, "Forbidden");
  }

  const initialStatus = isOrgAdmin || isClubAdmin ? "upcoming" : "draft";

  const event = await Event.create({
    title,
    description,
    clubId,
    category,
    date,
    venue,
    maxAttendees: maxAttendees || null,
    image: image || null,
    createdBy: user.id,
    status: initialStatus,
    showOnVolunteerHub: showOnVolunteerHub === true,
    volunteerLimit: volunteerLimit ? Number(volunteerLimit) : null,
    volunteerSkillsNeeded: Array.isArray(volunteerSkillsNeeded)
      ? volunteerSkillsNeeded.map(String).filter(Boolean)
      : [],
  });

  return event;
};

export const getEvents = async ({ query }) => {
  await syncExpiredUpcomingEvents();

  const { clubId, category, q, status, page = 1, limit = 20 } = query;
  const filter = {};

  if (clubId) filter.clubId = clubId;
  if (category) filter.category = category;
  if (q) filter.title = { $regex: q, $options: "i" };

  if (status) {
    filter.status = status;
  } else {
    filter.status = { $nin: ["draft", "pending_approval"] };
  }

  const pageNumber = Number(page);
  const limitNumber = Math.min(Number(limit) > 0 ? Number(limit) : 20, 50);
  const pageSafe = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const skip = (pageSafe - 1) * limitNumber;
  const events = await Event.find(filter)
    .sort({ date: 1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();
  const total = await Event.countDocuments(filter);

  return {
    events,
    meta: { total, page: pageSafe, limit: limitNumber },
  };
};

export const getEventById = async ({ id }) => {
  await syncExpiredUpcomingEvents();

  // Cache the base event doc (without attendees/volunteers — those are dynamic)
  const event = await getOrSet(`event:${id}`, EVENT_CACHE_TTL, () =>
    Event.findById(id).populate("clubId", "name adminId").lean()
  );
  if (!event) throw createHttpError(404, "Event not found");

  return attachEventRelations(event);
};

export const updateEvent = async ({ id, body, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const userRoles = user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const isCreator = event.createdBy.toString() === user.id;

  let club = null;
  let isClubAdmin = false;

  if (!isOrgAdmin) {
    club = await Club.findById(event.clubId).lean();
    isClubAdmin = club && club.adminId.toString() === user.id;
  }

  if (!isOrgAdmin && !isCreator && !isClubAdmin) {
    throw createHttpError(403, "Forbidden");
  }

  const isAdminLevel = isOrgAdmin || isClubAdmin;

  const editableFields = [
    "title",
    "description",
    "date",
    "venue",
    "maxAttendees",
    "image",
    "category",
    "showOnVolunteerHub",
    "volunteerLimit",
    "volunteerSkillsNeeded",
  ];

  if (isAdminLevel) editableFields.push("status");

  editableFields.forEach((field) => {
    if (body[field] !== undefined) event[field] = body[field];
  });

  if (!isAdminLevel && body.submitForApproval) {
    event.status = "pending_approval";
  }

  event.updatedAt = Date.now();
  await event.save();

  // Invalidate cache so next read gets fresh data
  invalidate(`event:${id}`);

  return event;
};

export const deleteEvent = async ({ id, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const userRoles = user.roles || [];
  if (event.createdBy.toString() !== user.id && !userRoles.includes("orgAdmin")) {
    throw createHttpError(403, "Forbidden");
  }

  await Event.findByIdAndDelete(id);
  await RSVP.deleteMany({ eventId: id });
  await VolunteerApplication.deleteMany({ eventId: id });

  invalidate(`event:${id}`);
};

export const rsvpEvent = async ({ id, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  if (event.status === "cancelled" || event.status === "completed") {
    throw createHttpError(400, `Cannot RSVP: event is ${event.status}`);
  }

  if (new Date(event.date) < new Date()) {
    throw createHttpError(400, "Cannot RSVP: event has already passed");
  }

  const userRoles = user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === user.id;
  const isHandler = isOrgAdmin || isClubAdmin;

  const existing = await RSVP.findOne({ eventId: event._id, userId: user.id });
  if (existing?.status === "registered") {
    throw createHttpError(400, "Already registered");
  }

  const registeredCount = await RSVP.countDocuments({ eventId: event._id, status: "registered" });
  if (!isHandler && event.maxAttendees && registeredCount >= event.maxAttendees) {
    throw createHttpError(400, "Event is full");
  }

  if (existing) {
    existing.status = "registered";
    existing.registeredAt = new Date();
    await existing.save();
    await Event.findByIdAndUpdate(event._id, { $inc: { rsvpCount: 1 } });
  } else {
    await RSVP.create({
      eventId: event._id,
      userId: user.id,
      status: "registered",
      registeredAt: new Date(),
    });
    // Increment denormalized counter atomically
    await Event.findByIdAndUpdate(event._id, { $inc: { rsvpCount: 1 } });
  }
};

export const cancelRsvp = async ({ id, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const attendee = await RSVP.findOne({ eventId: event._id, userId: user.id });
  if (!attendee || attendee.status !== "registered") {
    throw createHttpError(400, "Not registered");
  }

  attendee.status = "cancelled";
  await attendee.save();

  // Decrement counter (floor at 0)
  await Event.findByIdAndUpdate(
    event._id,
    [{ $set: { rsvpCount: { $max: [0, { $subtract: ["$rsvpCount", 1] }] } } }],
    { updatePipeline: true }
  );
};

export const getAttendees = async ({ id, query }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const pagination = parsePagination(query);
  const attendees = await loadEventAttendees(event._id, pagination);

  if (!pagination) {
    return { attendees };
  }

  const total = await RSVP.countDocuments({ eventId: event._id });
  return {
    attendees,
    meta: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

export const volunteerForEvent = async ({ id, body, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const userRoles = user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const isEditor = userRoles.includes("editor");
  const club = await Club.findById(event.clubId).select("adminId").lean();
  const isClubAdmin = club && String(club.adminId) === user.id;
  const isEventCreator = event.createdBy && String(event.createdBy) === user.id;

  const coordinatorMembership = await Membership.findOne({
    userId: user.id,
    clubId: event.clubId,
    status: "approved",
    clubRole: "coordinator",
  }).lean();

  if (isOrgAdmin || isEditor || isClubAdmin || isEventCreator || coordinatorMembership) {
    throw createHttpError(
      403,
      "Event admins/coordinators cannot apply as volunteers for this event"
    );
  }

  if (event.status !== "upcoming") {
    throw createHttpError(400, `Cannot volunteer: event is ${event.status}`);
  }

  if (!event.showOnVolunteerHub) {
    throw createHttpError(400, "This event is not accepting volunteer applications");
  }

  const acceptedCount = await VolunteerApplication.countDocuments({
    eventId: event._id,
    status: "accepted",
  });
  if (event.volunteerLimit && acceptedCount >= event.volunteerLimit) {
    throw createHttpError(400, "Volunteer slots are full");
  }

  const existing = await VolunteerApplication.findOne({ eventId: event._id, userId: user.id });
  if (existing) {
    throw createHttpError(400, `You have already applied (status: ${existing.status})`);
  }

  const skills = Array.isArray(body.skills)
    ? body.skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 10)
    : [];

  await VolunteerApplication.create({
    eventId: event._id,
    userId: user.id,
    skills,
    status: "pending",
    appliedAt: new Date(),
  });
};

export const reviewVolunteer = async ({ id, userId, body, user }) => {
  const { action } = body;
  if (!["accept", "reject"].includes(action)) {
    throw createHttpError(400, "action must be 'accept' or 'reject'");
  }

  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const userRoles = user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === user.id;

  if (!isOrgAdmin && !isClubAdmin) {
    const membership = await Membership.findOne({
      userId: user.id,
      clubId: event.clubId,
      status: "approved",
      clubRole: "coordinator",
    }).lean();
    if (!membership) throw createHttpError(403, "Forbidden");
  }

  const volunteer = await VolunteerApplication.findOne({ eventId: event._id, userId });
  if (!volunteer) throw createHttpError(404, "Application not found");

  if (action === "accept" && event.volunteerLimit) {
    const acceptedCount = await VolunteerApplication.countDocuments({
      eventId: event._id,
      status: "accepted",
      userId: { $ne: userId },
    });
    if (acceptedCount >= event.volunteerLimit) {
      throw createHttpError(400, "Volunteer limit already reached");
    }
  }

  volunteer.status = action === "accept" ? "accepted" : "rejected";
  volunteer.reviewedAt = new Date();
  await volunteer.save();

  return { action, volunteer };
};

export const removeVolunteer = async ({ id, userId, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const isSelf = userId === user.id;

  if (!isSelf) {
    const userRoles = user.roles || [];
    const isOrgAdmin = userRoles.includes("orgAdmin");
    const club = await Club.findById(event.clubId).lean();
    const isClubAdmin = club && club.adminId.toString() === user.id;
    if (!isOrgAdmin && !isClubAdmin) {
      const membership = await Membership.findOne({
        userId: user.id,
        clubId: event.clubId,
        status: "approved",
        clubRole: "coordinator",
      }).lean();
      if (!membership) throw createHttpError(403, "Forbidden");
    }
  }

  const removed = await VolunteerApplication.findOneAndDelete({
    eventId: event._id,
    userId,
  });
  if (!removed) throw createHttpError(404, "Volunteer not found");
};

export const getVolunteerEvents = async ({ query }) => {
  const { limit = 50 } = query;
  const limitNumber = Math.min(Number(limit) > 0 ? Number(limit) : 50, 50);

  const events = await Event.find({
    status: "upcoming",
    showOnVolunteerHub: true,
    volunteerLimit: { $gt: 0 },
  })
    .populate("clubId", "name category adminId")
    .sort({ date: 1 })
    .limit(limitNumber)
    .lean();

  const eventIds = events.map((event) => event._id);
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

  const open = events
    .map((event) => ({
      ...event,
      volunteers: applicationsByEvent.get(String(event._id)) || [],
    }))
    .filter((event) => {
      const accepted = event.volunteers.filter((v) => v.status === "accepted").length;
      return accepted < event.volunteerLimit;
    });

  return open;
};

export const getVolunteers = async ({ id, user, query }) => {
  const event = await Event.findById(id).lean();
  if (!event) throw createHttpError(404, "Event not found");

  const userRoles = user.roles || [];
  const isCreator = event.createdBy.toString() === user.id;
  if (!isCreator && !userRoles.includes("orgAdmin")) {
    throw createHttpError(403, "Forbidden");
  }

  const pagination = parsePagination(query);
  const volunteers = await loadEventVolunteers(event._id, pagination);

  if (!pagination) {
    return { volunteers };
  }

  const total = await VolunteerApplication.countDocuments({ eventId: event._id });
  return {
    volunteers,
    meta: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

export const publishEvent = async ({ id, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const userRoles = user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === user.id;

  if (!isOrgAdmin && !isClubAdmin) {
    throw createHttpError(403, "Only the club admin can publish events");
  }

  if (!["draft", "pending_approval"].includes(event.status)) {
    throw createHttpError(400, `Cannot publish: event is already '${event.status}'`);
  }

  event.status = "upcoming";
  await event.save();

  return event;
};

export const markAttendance = async ({ id, body, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const userRoles = user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(event.clubId).lean();
  const isClubAdmin = club && club.adminId.toString() === user.id;

  if (!isOrgAdmin && !isClubAdmin) {
    const membership = await Membership.findOne({
      userId: user.id,
      clubId: event.clubId,
      status: "approved",
      clubRole: "coordinator",
    }).lean();
    if (!membership) throw createHttpError(403, "Forbidden");
  }

  const { attendeeIds } = body;
  if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
    throw createHttpError(400, "attendeeIds must be a non-empty array");
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

  return {
    modifiedCount: result.modifiedCount,
    attendees,
  };
};