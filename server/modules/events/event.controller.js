import * as eventService from "./event.service.js";

export const createEvent = async (req, res) => {
  const event = await eventService.createEvent({ body: req.body, user: req.user });
  res.status(201).json({ success: true, data: event });
};

export const getEvents = async (req, res) => {
  const { events, meta } = await eventService.getEvents({ query: req.query });
  res.json({ success: true, data: events, meta });
};

export const getEventById = async (req, res) => {
  const event = await eventService.getEventById({ id: req.params.id });
  res.json({ success: true, data: event });
};

export const updateEvent = async (req, res) => {
  const event = await eventService.updateEvent({
    id: req.params.id,
    body: req.body,
    user: req.user,
  });
  res.json({ success: true, data: event });
};

export const deleteEvent = async (req, res) => {
  await eventService.deleteEvent({ id: req.params.id, user: req.user });
  res.json({ success: true, message: "Event deleted" });
};

export const rsvpEvent = async (req, res) => {
  await eventService.rsvpEvent({ id: req.params.id, user: req.user });
  res.json({ success: true, message: "Registered for event" });
};

export const cancelRsvp = async (req, res) => {
  await eventService.cancelRsvp({ id: req.params.id, user: req.user });
  res.json({ success: true, message: "Registration cancelled" });
};

export const getAttendees = async (req, res) => {
  const result = await eventService.getAttendees({ id: req.params.id, query: req.query });
  const response = { success: true, data: result.attendees };
  if (result.meta) response.meta = result.meta;
  res.json(response);
};

export const volunteerForEvent = async (req, res) => {
  await eventService.volunteerForEvent({
    id: req.params.id,
    body: req.body,
    user: req.user,
  });
  res.json({ success: true, message: "Application submitted — awaiting admin review" });
};

export const reviewVolunteer = async (req, res) => {
  const { action, volunteer } = await eventService.reviewVolunteer({
    id: req.params.id,
    userId: req.params.userId,
    body: req.body,
    user: req.user,
  });
  res.json({ success: true, message: `Volunteer ${action}ed`, data: volunteer });
};

export const removeVolunteer = async (req, res) => {
  await eventService.removeVolunteer({
    id: req.params.id,
    userId: req.params.userId,
    user: req.user,
  });
  res.json({ success: true, message: "Volunteer removed" });
};

export const getVolunteers = async (req, res) => {
  const result = await eventService.getVolunteers({
    id: req.params.id,
    user: req.user,
    query: req.query,
  });
  const response = { success: true, data: result.volunteers };
  if (result.meta) response.meta = result.meta;
  res.json(response);
};

export const getVolunteerEvents = async (req, res) => {
  const events = await eventService.getVolunteerEvents({ query: req.query });
  res.json({ success: true, data: events });
};

export const getEventAnalytics = async (req, res) => {
  const analytics = await eventService.getEventAnalytics({ id: req.params.id });
  res.json({ success: true, data: analytics });
};

export const publishEvent = async (req, res) => {
  const event = await eventService.publishEvent({ id: req.params.id, user: req.user });
  res.json({ success: true, message: "Event published", data: event });
};

export const submitGraceRequest = async (req, res) => {
  const request = await eventService.submitGraceRequest({ id: req.params.id, user: req.user, body: req.body });
  res.json({ success: true, message: "Grace request submitted", data: request });
};

export const reviewAttendanceIssue = async (req, res) => {
  const student = await eventService.reviewAttendanceIssue({
    id: req.params.id,
    userId: req.params.userId,
    body: req.body,
    user: req.user,
  });
  res.json({ success: true, message: "Attendance review updated", data: student });
};

export const startEvent = async (req, res) => {
  const event = await eventService.startEvent({ id: req.params.id, user: req.user });
  res.json({ success: true, message: "Event started", data: event });
};

export const restartEvent = async (req, res) => {
  const event = await eventService.restartEvent({ id: req.params.id, user: req.user });
  res.json({ success: true, message: "Event restarted", data: event });
};

export const endEvent = async (req, res) => {
  const result = await eventService.endEvent({ id: req.params.id, user: req.user });
  res.json({
    success: true,
    message: "Event ended",
    data: result.event,
    meta: result.noShowSummary,
  });
};

export const markAttendance = async (req, res) => {
  const { modifiedCount, attendees } = await eventService.markAttendance({
    id: req.params.id,
    body: req.body,
    user: req.user,
  });
  res.json({
    success: true,
    message: `${modifiedCount} attendance(s) marked`,
    data: attendees,
  });
};