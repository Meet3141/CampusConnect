import Event from "./event.model.js";
import Club from "../clubs/club.model.js";
import Membership from "../clubs/membership.model.js";
import RSVP from "./rsvp.model.js";
import User from "../users/user.model.js";
import GraceRequest from "./grace-request.model.js";
import ReviewHistory from "./review-history.model.js";
import CorrectionRequest from "./correction-request.model.js";
import VolunteerApplication from "./volunteer-application.model.js";
import Notification from "../notifications/notification.model.js";
import { createHttpError } from "../../utils/httpError.js";
import { getOrSet, invalidate } from "../../utils/cache.js";
import { processNoShows } from "../../utils/processNoShows.js";
import { recalculateDisciplineState } from "../../utils/governanceUtils.js";
import { getAttendanceStats } from "../../../utils/attendanceStats.js";

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

export const cleanupExpiredBlocks = async () => {
  const usersToUnblock = await User.find({
    isBlocked: true,
    blockedUntil: { $lt: new Date() },
  });

  let count = 0;
  for (const user of usersToUnblock) {
    user.archivedMissedEvents.push(...user.missedEvents);
    user.missedEvents = [];
    user.warningCount = 0;
    user.isBlocked = false;
    user.blockedUntil = null;
    user.reviewRequired = false;
    user.disciplineStatus = "probation";
    user.probationUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await user.save();

    await ReviewHistory.create({
      eventId: null, // General governance action
      userId: user._id,
      action: "BLOCK_EXPIRED_PROBATION_STARTED",
      performedBy: user._id, // System
      role: "system",
      reason: "Block expired naturally. Probation period started.",
    });

    count++;
  }

  return { modifiedCount: count };
};

export const cleanupExpiredProbation = async () => {
  const usersToEndProbation = await User.find({
    disciplineStatus: "probation",
    probationUntil: { $lt: new Date() },
  });

  let count = 0;
  for (const user of usersToEndProbation) {
    user.disciplineStatus = "normal";
    user.probationUntil = null;
    await user.save();

    await ReviewHistory.create({
      eventId: null,
      userId: user._id,
      action: "PROBATION_EXPIRED",
      performedBy: user._id,
      role: "system",
      reason: "Probation period naturally expired. Student restored to normal status.",
    });

    count++;
  }

  return { modifiedCount: count };
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

const canManageEvent = async (event, user) => {
  const userRoles = user.roles || [];
  if (userRoles.includes("orgAdmin")) return true;
  if (event.createdBy.toString() === user.id) return true;

  const club = await Club.findById(event.clubId).lean();
  return Boolean(club && club.adminId.toString() === user.id);
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
    endDate,
    attendancePolicy,
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

  if (endDate && new Date(endDate) <= new Date(date)) {
    throw createHttpError(400, "End time must be after start time");
  }

  if (attendancePolicy) {
    const threshold = Number(attendancePolicy.noShowThreshold) || 2;
    const limit = Number(attendancePolicy.warningLimit) || 3;
    if (limit < threshold + 2) {
      throw createHttpError(400, "Warning limit must be at least no-show threshold + 2");
    }
  }

  const event = await Event.create({
    title,
    description,
    clubId,
    category,
    date,
    endDate: endDate || null,
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
    attendancePolicy: attendancePolicy || {},
  });

  return event;
};

const parseDateParam = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const getEvents = async ({ query }) => {
  await syncExpiredUpcomingEvents();

  const {
    clubId,
    category,
    q,
    status,
    page = 1,
    limit = 20,
    startDate,
    endDate,
    includeClub,
  } = query;
  const filter = {};

  if (clubId) filter.clubId = clubId;
  if (category) filter.category = category;
  if (q) filter.title = { $regex: q, $options: "i" };

  if (status) {
    filter.status = status;
  } else {
    filter.status = { $nin: ["draft", "pending_approval"] };
  }

  const start = parseDateParam(startDate);
  const end = parseDateParam(endDate);
  if (start || end) {
    filter.date = {};
    if (start) filter.date.$gte = start;
    if (end) filter.date.$lte = end;
  }

  const pageNumber = Number(page);
  const limitNumber = Math.min(Number(limit) > 0 ? Number(limit) : 20, 50);
  const pageSafe = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const skip = (pageSafe - 1) * limitNumber;
  let queryBuilder = Event.find(filter)
    .sort({ date: 1 })
    .skip(skip)
    .limit(limitNumber);

  if (String(includeClub) === "true") {
    queryBuilder = queryBuilder.populate("clubId", "name category adminId");
  }

  const events = await queryBuilder.lean();
  const total = await Event.countDocuments(filter);

  return {
    events,
    meta: { total, page: pageSafe, limit: limitNumber },
  };
};

export const getEventAnalytics = async ({ id }) => {
  await syncExpiredUpcomingEvents();
  const event = await Event.findById(id).lean();
  if (!event) throw createHttpError(404, "Event not found");

  const attendanceStats = getAttendanceStats(event);

  const [graceRequests, reviewRequiredUsers] = await Promise.all([
    GraceRequest.find({ eventId: event._id, status: "pending" }).populate("userId", "name email warningCount missedEvents graceUsed isBlocked blockedUntil reviewRequired").sort({ createdAt: -1 }).lean(),
    User.find({ reviewRequired: true, missedEvents: event._id }).select("name email warningCount missedEvents graceUsed isBlocked blockedUntil reviewRequired").lean(),
  ]);

  return { ...attendanceStats, graceRequests, reviewRequiredUsers, attendancePolicy: event.attendancePolicy || {} };
};

export const getReviewDashboard = async () => {
  const [pendingGraceRequests, reviewRequiredUsers, blockedUsers] = await Promise.all([
    GraceRequest.find({ status: "pending" })
      .populate({ path: "eventId", select: "title date status clubId", populate: { path: "clubId", select: "name" } })
      .populate("userId", "name email warningCount missedEvents disciplineStatus reviewRequired blockedUntil")
      .sort({ createdAt: -1 })
      .lean(),
    User.find({ disciplineStatus: { $in: ["warning", "review"] } })
      .select("name email warningCount missedEvents disciplineStatus reviewRequired blockedUntil isBlocked")
      .populate({ path: "missedEvents", select: "title date status clubId", populate: { path: "clubId", select: "name" } })
      .sort({ warningCount: -1, updatedAt: -1 })
      .lean(),
    User.find({ isBlocked: true })
      .select("name email warningCount missedEvents disciplineStatus reviewRequired blockedUntil isBlocked")
      .populate({ path: "missedEvents", select: "title date status clubId", populate: { path: "clubId", select: "name" } })
      .sort({ blockedUntil: 1 })
      .lean(),
  ]);

  return {
    pendingGraceRequests,
    reviewRequiredUsers,
    blockedUsers,
    summary: {
      pendingGraceRequests: pendingGraceRequests.length,
      reviewRequiredUsers: reviewRequiredUsers.length,
      blockedUsers: blockedUsers.length,
    },
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
    "endDate",
    "venue",
    "maxAttendees",
    "image",
    "category",
    "showOnVolunteerHub",
    "volunteerLimit",
    "volunteerSkillsNeeded",
    "attendancePolicy",
  ];

  if (isAdminLevel) editableFields.push("status");

  editableFields.forEach((field) => {
    if (body[field] !== undefined) event[field] = body[field];
  });

  if (body.attendancePolicy) {
    const threshold = Number(body.attendancePolicy.noShowThreshold) || 2;
    const limit = Number(body.attendancePolicy.warningLimit) || 3;
    if (limit < threshold + 2) {
      throw createHttpError(400, "Warning limit must be at least no-show threshold + 2");
    }
  }

  if (!isAdminLevel && body.submitForApproval) {
    event.status = "pending_approval";
  }

  if (body.endDate !== undefined) {
    const nextEndDate = body.endDate ? new Date(body.endDate) : null;
    if (nextEndDate && new Date(event.date) >= nextEndDate) {
      throw createHttpError(400, "End time must be after start time");
    }
    event.endDate = nextEndDate;
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

  // CHECK IF USER IS BLOCKED
  if (user.isBlocked && user.blockedUntil && new Date(user.blockedUntil) > new Date()) {
    throw createHttpError(403, `You are blocked from registering until ${user.blockedUntil}`);
  }

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
    // Increment both rsvpCount and registeredCount
    await Event.findByIdAndUpdate(event._id, {
      $inc: { rsvpCount: 1, registeredCount: 1 },
    });
  } else {
    await RSVP.create({
      eventId: event._id,
      userId: user.id,
      status: "registered",
      registeredAt: new Date(),
    });
    // Increment denormalized counters atomically
    await Event.findByIdAndUpdate(event._id, {
      $inc: { rsvpCount: 1, registeredCount: 1 },
    });
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

  if (!(await canManageEvent(event, user))) {
    throw createHttpError(403, "Only the club admin can publish events");
  }

  if (!["draft", "pending_approval"].includes(event.status)) {
    throw createHttpError(400, `Cannot publish: event is already '${event.status}'`);
  }

  event.status = "upcoming";
  await event.save();

  return event;
};

export const submitGraceRequest = async ({ id, user, body }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  const reason = String(body?.reason || "").trim();
  if (!reason) throw createHttpError(400, "Reason is required");

  const rsvp = await RSVP.findOne({ eventId: event._id, userId: user.id }).lean();
  if (!rsvp) throw createHttpError(400, "You must be registered for this event to submit a grace request");

  const existingRequest = await GraceRequest.findOne({ eventId: event._id, userId: user.id }).lean();
  if (existingRequest) {
    throw createHttpError(400, "You have already submitted a grace request for this event.");
  }

  const request = await GraceRequest.create({ eventId: event._id, userId: user.id, reason });
  await Notification.create({
    userId: user.id,
    type: "grace_submitted",
    title: "Grace request submitted",
    message: "Your grace request was submitted and is waiting for faculty review.",
    eventId: event._id,
  });

  return request;
};

export const reviewGraceRequest = async ({ requestId, user, body }) => {
  const request = await GraceRequest.findById(requestId);
  if (!request) throw createHttpError(404, "Grace request not found");

  if (request.status !== "pending") {
    throw createHttpError(400, "Grace request already reviewed");
  }

  const event = await Event.findById(request.eventId);
  if (!event) throw createHttpError(404, "Event not found");
  if (!(await canManageEvent(event, user))) throw createHttpError(403, "Forbidden");

  const action = String(body?.action || "").trim();
  if (!["approveGrace", "reduceWarning", "blockStudent", "reject"].includes(action)) {
    throw createHttpError(400, "Invalid action");
  }

  const target = await User.findById(request.userId);
  if (!target) throw createHttpError(404, "Student not found");

  if (action === "approveGrace") {
    target.graceUsed = true;
    target.warningCount = Math.max(0, (target.warningCount || 0) - 1);
    target.reviewRequired = false;
    target.disciplineStatus = target.isBlocked ? "blocked" : "normal";
    request.status = "approved";
  } else if (action === "reduceWarning") {
    target.warningCount = Math.max(0, (target.warningCount || 0) - 1);
    target.reviewRequired = false;
    target.disciplineStatus = target.isBlocked ? "blocked" : "normal";
    request.status = "approved";
  } else if (action === "blockStudent") {
    target.isBlocked = true;
    target.blockedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    target.reviewRequired = false;
    target.disciplineStatus = "blocked";
    request.status = "approved";
  } else if (action === "reject") {
    request.status = "rejected";
    target.reviewRequired = false;
    if (!target.isBlocked) {
      target.disciplineStatus = (target.warningCount || 0) > 0 ? "warning" : "normal";
    }
  }

  request.reviewedBy = user.id;
  request.reviewedAt = new Date();
  request.facultyRemark = String(body?.reason || "").trim();

  await Promise.all([request.save(), target.save()]);

  const notificationType = action === "approveGrace"
    ? "grace_approved"
    : action === "reduceWarning"
      ? "warning"
      : action === "blockStudent"
        ? "blocked"
        : "grace_rejected";

  await Notification.create({
    userId: target._id,
    type: notificationType,
    title: action === "approveGrace"
      ? "Grace approved"
      : action === "reduceWarning"
        ? "Warning reduced"
        : action === "blockStudent"
          ? "Attendance blocked"
          : "Grace request rejected",
    message: action === "approveGrace"
      ? "Your grace request was approved."
      : action === "reduceWarning"
        ? "Your warning count was reduced after faculty review."
        : action === "blockStudent"
          ? "Your attendance access has been temporarily blocked."
          : "Your grace request was rejected.",
    eventId: event._id,
  });

  await ReviewHistory.create({
    eventId: event._id,
    userId: target._id,
    action: action === "approveGrace"
      ? "GRACE_APPROVED"
      : action === "reduceWarning"
        ? "WARNING_REDUCED"
        : action === "blockStudent"
          ? "STUDENT_BLOCKED"
          : "GRACE_REJECTED",
    performedBy: user.id,
    role: user.roles?.includes("orgAdmin") ? "orgAdmin" : "clubAdmin",
    reason: String(body?.reason || "").trim(),
  });

  return { request: request.toJSON(), student: target.toJSON() };
};

export const reviewAttendanceIssue = async ({ id, userId, body, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");
  if (!(await canManageEvent(event, user))) throw createHttpError(403, "Forbidden");

  const target = await User.findById(userId);
  if (!target) throw createHttpError(404, "Student not found");

  const action = String(body?.action || "").trim();
  if (!["approveGrace", "reduceWarning", "blockStudent"].includes(action)) {
    throw createHttpError(400, "Invalid action");
  }

  if (target.disciplineStatus !== "review" && action === "approveGrace") {
    throw createHttpError(400, "No review required for this student");
  }

  if (action === "approveGrace") {
    target.graceUsed = true;
    target.warningCount = Math.max(0, (target.warningCount || 0) - 1);
    target.reviewRequired = false;
    target.disciplineStatus = target.isBlocked ? "blocked" : "normal";
  } else if (action === "reduceWarning") {
    target.warningCount = Math.max(0, (target.warningCount || 0) - 1);
    target.reviewRequired = false;
    target.disciplineStatus = target.isBlocked ? "blocked" : "normal";
  } else if (action === "blockStudent") {
    target.isBlocked = true;
    target.blockedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    target.reviewRequired = false;
    target.disciplineStatus = "blocked";
  }

  await target.save();

  await ReviewHistory.create({
    eventId: event._id,
    userId: target._id,
    action: action === "approveGrace" ? "GRACE_APPROVED" : action === "reduceWarning" ? "WARNING_REDUCED" : "STUDENT_BLOCKED",
    performedBy: user.id,
    role: user.roles?.includes("orgAdmin") ? "orgAdmin" : "clubAdmin",
    reason: String(body?.reason || "").trim(),
  });

  const notificationType = action === "approveGrace"
    ? "grace_approved"
    : action === "reduceWarning"
      ? "warning"
      : "blocked";

  await Notification.create({
    userId: target._id,
    type: notificationType,
    title: action === "approveGrace"
      ? "Grace approved"
      : action === "reduceWarning"
        ? "Warning reduced"
        : "Attendance blocked",
    message: action === "approveGrace"
      ? "Your attendance review resulted in grace approval."
      : action === "reduceWarning"
        ? "Your warning count was reduced after faculty review."
        : "Your attendance access has been temporarily blocked.",
    eventId: event._id,
  });

  return target.toJSON();
};

export const startEvent = async ({ id, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  if (!(await canManageEvent(event, user))) {
    throw createHttpError(403, "Forbidden");
  }

  if (event.status !== "upcoming") {
    throw createHttpError(400, `Cannot start event while status is '${event.status}'`);
  }

  event.status = "ongoing";
  await event.save();
  invalidate(`event:${id}`);
  return event;
};

export const restartEvent = async ({ id, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  if (!(await canManageEvent(event, user))) {
    throw createHttpError(403, "Forbidden");
  }

  if (event.status !== "completed") {
    throw createHttpError(400, `Cannot restart event while status is '${event.status}'`);
  }

  await RSVP.updateMany(
    { eventId: event._id, status: "attended" },
    {
      $set: {
        status: "registered",
        "attendance.attended": false,
        "attendance.attendanceMethod": null,
        "attendance.manualOverride": false,
        "attendance.entryTime": null,
        "attendance.exitTime": null,
        "attendance.attendancePercentage": null,
      },
    }
  );

  event.attendedCount = 0;
  event.noShowCount = 0;
  event.onSpotCount = 0;
  event.status = "ongoing";
  await event.save();
  invalidate(`event:${id}`);
  return event;
};

export const endEvent = async ({ id, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  if (!(await canManageEvent(event, user))) {
    throw createHttpError(403, "Forbidden");
  }

  if (event.status !== "ongoing") {
    throw createHttpError(400, `Cannot end event while status is '${event.status}'`);
  }

  const noShowSummary = await processNoShows(event._id);
  event.status = "completed";
  await event.save();
  invalidate(`event:${id}`);

  return {
    event,
    noShowSummary,
  };
};

export const markAttendance = async ({ id, body, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  if (event.status !== "ongoing") {
    throw createHttpError(400, "Attendance can only be marked while the event is ongoing");
  }

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
  if (!Array.isArray(attendeeIds)) {
    throw createHttpError(400, "attendeeIds must be an array");
  }

  const idSet = new Set(attendeeIds.map(String));
  const now = new Date();

  const currentlyAttendedIds = await RSVP.find({ eventId: event._id, status: "attended" })
    .distinct("userId");
  const currentlyAttendedSet = new Set(currentlyAttendedIds.map(String));
  const selectedSet = new Set([...idSet]);

  const idsToAttend = [...selectedSet].filter((attendeeId) => !currentlyAttendedSet.has(attendeeId));
  const idsToRevert = [...currentlyAttendedSet].filter((attendeeId) => !selectedSet.has(attendeeId));

  let attendedModified = 0;
  let revertedModified = 0;

  if (idsToAttend.length > 0) {
    const result = await RSVP.updateMany(
      {
        eventId: event._id,
        userId: { $in: idsToAttend },
        status: "registered",
      },
      {
        $set: {
          status: "attended",
          "attendance.attended": true,
          "attendance.attendanceMethod": "manual",
          "attendance.entryTime": now,
        },
      }
    );
    attendedModified = result.modifiedCount || 0;
  }

  if (idsToRevert.length > 0) {
    const result = await RSVP.updateMany(
      {
        eventId: event._id,
        userId: { $in: idsToRevert },
        status: "attended",
      },
      {
        $set: {
          status: "registered",
          "attendance.attended": false,
          "attendance.attendanceMethod": null,
          "attendance.manualOverride": false,
          "attendance.entryTime": null,
          "attendance.exitTime": null,
          "attendance.attendancePercentage": null,
        },
      }
    );
    revertedModified = result.modifiedCount || 0;
  }

  if (attendedModified > 0 || revertedModified > 0) {
    await Event.findByIdAndUpdate(event._id, {
      $inc: {
        attendedCount: attendedModified - revertedModified,
      },
    });
  }

  const attendees = await loadEventAttendees(event._id);

  return {
    modifiedCount: attendedModified,
    revertedCount: revertedModified,
    attendees,
  };
};

export const amendAttendance = async ({ id, body, user }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  if (event.status !== "completed") {
    throw createHttpError(400, "Attendance correction is only allowed for completed events");
  }

  if (!(await canManageEvent(event, user))) {
    throw createHttpError(403, "Forbidden");
  }

  const { attendeeIds } = body;
  if (!Array.isArray(attendeeIds)) {
    throw createHttpError(400, "attendeeIds must be an array");
  }

  const existingRequest = await CorrectionRequest.findOne({
    eventId: event._id,
    status: "approved",
  });

  if (!existingRequest) {
    throw createHttpError(403, "Attendance amendment requires an approved Correction Request from the organization admin.");
  }

  const idSet = new Set(attendeeIds.map(String));
  const rsvps = await RSVP.find({ eventId: event._id }).lean();
  
  const idsToAttend = [];
  
  for (const rsvp of rsvps) {
    const attendeeId = rsvp.userId.toString();
    const currentlyAttended = rsvp.status === "attended";
    const desiredAttended = idSet.has(attendeeId);
    
    // We only support Amending No-Shows -> Attended (safest path for corrections)
    if (!currentlyAttended && desiredAttended) {
      idsToAttend.push(attendeeId);
    }
  }

  if (idsToAttend.length === 0) {
    return { message: "No attendance corrections needed", attendees: await loadEventAttendees(event._id) };
  }

  const now = new Date();
  const policy = event.attendancePolicy || {};
  const threshold = Number(policy.noShowThreshold) || 2;
  const limit = Number(policy.warningLimit) || 3;
  const reviewPoint = limit - 1;

  // 1. Mark RSVPs as attended
  const result = await RSVP.updateMany(
    {
      eventId: event._id,
      userId: { $in: idsToAttend },
      status: { $ne: "attended" }
    },
    {
      $set: {
        status: "attended",
        "attendance.attended": true,
        "attendance.attendanceMethod": "manual_amendment",
        "attendance.entryTime": now,
      },
    }
  );

  // 2. Adjust User Governance State for those whose penalty is being rolled back
  for (const uid of idsToAttend) {
    const targetUser = await User.findById(uid);
    if (!targetUser) continue;
    
    let changed = false;

    // Search missedEvents
    const initialMissed = targetUser.missedEvents.length;
    targetUser.missedEvents = targetUser.missedEvents.filter(eId => String(eId) !== String(event._id));
    if (targetUser.missedEvents.length < initialMissed) {
      changed = true;
    }

    // Search archivedMissedEvents
    const initialArchived = targetUser.archivedMissedEvents.length;
    targetUser.archivedMissedEvents = targetUser.archivedMissedEvents.filter(eId => String(eId) !== String(event._id));
    if (targetUser.archivedMissedEvents.length < initialArchived) {
      changed = true;
      // Historical Collapse (Fix 4)
      if (targetUser.archivedMissedEvents.length < limit) {
        targetUser.missedEvents.push(...targetUser.archivedMissedEvents);
        targetUser.archivedMissedEvents = [];
        targetUser.probationUntil = null;
      }
    }
    
    if (changed) {
      const newState = recalculateDisciplineState(targetUser, policy);
      
      targetUser.disciplineStatus = newState.disciplineStatus;
      targetUser.isBlocked = newState.isBlocked;
      targetUser.blockedUntil = newState.blockedUntil;
      targetUser.reviewRequired = newState.reviewRequired;
      
      await targetUser.save();
      
      // Create Audit Log
      await ReviewHistory.create({
        eventId: event._id,
        userId: targetUser._id,
        action: "ATTENDANCE_CORRECTION",
        performedBy: user.id,
        role: "system",
        reason: existingRequest.reason,
        correctionType: existingRequest.correctionType,
        justification: existingRequest.reason,
        approvedBy: existingRequest.reviewedBy,
        approvedAt: existingRequest.reviewedAt,
      });
    }
  }

  // 3. Update Event counts
  await Event.findByIdAndUpdate(event._id, {
    $inc: { 
      attendedCount: idsToAttend.length,
      noShowCount: -idsToAttend.length 
    }
  });

  // 4. Mark Correction Request as amended
  existingRequest.status = "amended";
  await existingRequest.save();

  return {
    message: `${idsToAttend.length} attendance records corrected and penalties reverted`,
    attendees: await loadEventAttendees(event._id)
  };
};

export const requestAttendanceCorrection = async ({ id, user, body }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  if (event.status !== "completed") {
    throw createHttpError(400, "Event must be completed to request correction");
  }

  if (!(await canManageEvent(event, user))) {
    throw createHttpError(403, "Forbidden");
  }

  // 24-hour window check
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const completionDate = event.endDate || event.updatedAt;
  
  let correctionType = "normal";
  
  if (completionDate < twentyFourHoursAgo) {
    if (user.roles?.includes("orgAdmin")) {
      correctionType = "late_correction";
    } else {
      throw createHttpError(400, "Correction window has closed (24 hours).");
    }
  }

  const existingRequest = await CorrectionRequest.findOne({
    eventId: event._id,
    status: { $in: ["pending", "approved"] },
  });

  if (existingRequest) {
    throw createHttpError(400, "An active correction request already exists for this event.");
  }

  const request = await CorrectionRequest.create({
    eventId: event._id,
    requestedBy: user.id,
    reason: String(body.reason || "").trim(),
    correctionType,
  });

  return request;
};

export const reviewCorrectionRequest = async ({ id, reqId, user, body }) => {
  const event = await Event.findById(id);
  if (!event) throw createHttpError(404, "Event not found");

  // Only orgAdmin can review correction requests
  if (!user.roles?.includes("orgAdmin")) {
    throw createHttpError(403, "Only organization admins can review correction requests");
  }

  const request = await CorrectionRequest.findById(reqId);
  if (!request) throw createHttpError(404, "Request not found");

  if (request.status !== "pending") {
    throw createHttpError(400, `Request is already ${request.status}`);
  }

  const action = String(body.action || "").trim();
  if (action === "approve") {
    request.status = "approved";
  } else if (action === "reject") {
    request.status = "rejected";
  } else {
    throw createHttpError(400, "Invalid action");
  }

  request.reviewedBy = user.id;
  request.reviewedAt = new Date();
  request.facultyRemark = String(body.reason || "").trim();

  await request.save();

  return request;
};

export const getCorrectionRequest = async ({ id }) => {
  return await CorrectionRequest.findOne({ eventId: id }).sort({ createdAt: -1 });
};