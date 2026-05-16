import VolunteerPosting from "./volunteer-posting.model.js";
import VolunteerPostingApplication from "./volunteer-application.model.js";

const parsePagination = (query, defaultLimit = 10, maxLimit = 50) => {
  const hasPage = query.page !== undefined;
  const hasLimit = query.limit !== undefined;
  if (!hasPage && !hasLimit) return null;
  const pageRaw = Number(query.page);
  const limitRaw = Number(query.limit);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limitBase = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : defaultLimit;
  const limit = Math.min(limitBase, maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

const hydratePostingApplications = async (posting) => {
  const applications = await VolunteerPostingApplication.find({ postingId: posting._id })
    .populate("userId", "name email").sort({ appliedAt: 1 }).lean();
  const legacyApplications = Array.isArray(posting.applications)
    ? posting.applications.map((app) => ({ ...app, userId: app.userId }))
    : [];
  return { ...posting, applications: applications.length > 0 ? applications : legacyApplications };
};

const syncPostingStatus = async (posting) => {
  if (posting.slots === null) return posting;
  const accepted = await VolunteerPostingApplication.countDocuments({ postingId: posting._id, status: "accepted" });
  const nextStatus = accepted >= posting.slots ? "filled" : "open";
  if (posting.status !== "closed") { posting.status = nextStatus; await posting.save(); }
  return posting;
};

export const getPostings = async (req, res) => {
  const { category, status = "open", q, page = 1, limit = 20 } = req.query;
  const filter = { status };
  if (category) filter.category = category;
  if (q) filter.title = { $regex: q, $options: "i" };
  const pageNumber = Number(page);
  const limitNumber = Math.min(Number(limit) > 0 ? Number(limit) : 20, 50);
  const pageSafe = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const skip = (pageSafe - 1) * limitNumber;
  const [postings, total] = await Promise.all([
    VolunteerPosting.find(filter).sort({ date: 1 }).skip(skip).limit(limitNumber)
      .populate("postedBy", "name").populate("clubId", "name").populate("eventId", "title").lean(),
    VolunteerPosting.countDocuments(filter),
  ]);
  const hydrated = await Promise.all(postings.map(hydratePostingApplications));
  res.json({ success: true, data: hydrated, meta: { total, page: pageSafe, limit: limitNumber } });
};

export const getPostingById = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id)
    .populate("postedBy", "name email").populate("clubId", "name").populate("eventId", "title date venue").lean();
  if (!posting) { const err = new Error("Posting not found"); err.statusCode = 404; throw err; }
  res.json({ success: true, data: await hydratePostingApplications(posting) });
};

export const createPosting = async (req, res) => {
  const { title, description, venue, date, duration, skillsNeeded, category, slots, clubId, eventId } = req.body;
  if (!title || !description || !date) {
    const err = new Error("title, description, and date are required"); err.statusCode = 400; throw err;
  }
  const posting = await VolunteerPosting.create({
    title, description, venue: venue || "TBD", date, duration: duration || null,
    skillsNeeded: Array.isArray(skillsNeeded) ? skillsNeeded : [], category: category || "other",
    slots: slots ? Number(slots) : null, clubId: clubId || null, eventId: eventId || null, postedBy: req.user.id,
  });
  res.status(201).json({ success: true, data: posting });
};

export const updatePosting = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) { const err = new Error("Posting not found"); err.statusCode = 404; throw err; }
  const isOwner = String(posting.postedBy) === req.user.id;
  const isAdmin = req.user.roles?.includes("orgAdmin");
  if (!isOwner && !isAdmin) { const err = new Error("Forbidden"); err.statusCode = 403; throw err; }
  const allowed = ["title", "description", "venue", "date", "duration", "skillsNeeded", "category", "slots", "status"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) posting[f] = req.body[f]; });
  await posting.save();
  res.json({ success: true, data: posting });
};

export const deletePosting = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) { const err = new Error("Posting not found"); err.statusCode = 404; throw err; }
  const isOwner = String(posting.postedBy) === req.user.id;
  const isAdmin = req.user.roles?.includes("orgAdmin");
  if (!isOwner && !isAdmin) { const err = new Error("Forbidden"); err.statusCode = 403; throw err; }
  await posting.deleteOne();
  await VolunteerPostingApplication.deleteMany({ postingId: posting._id });
  res.json({ success: true, message: "Posting deleted" });
};

export const applyToPosting = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) { const err = new Error("Posting not found"); err.statusCode = 404; throw err; }
  if (posting.status !== "open") { const err = new Error("This posting is no longer accepting applications"); err.statusCode = 400; throw err; }
  const already = await VolunteerPostingApplication.findOne({ postingId: posting._id, userId: req.user.id });
  if (already) { const err = new Error("You have already applied"); err.statusCode = 400; throw err; }
  await VolunteerPostingApplication.create({ postingId: posting._id, userId: req.user.id, message: req.body.message || "", status: "pending" });
  await syncPostingStatus(posting);
  res.status(201).json({ success: true, message: "Application submitted" });
};

export const withdrawApplication = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) { const err = new Error("Posting not found"); err.statusCode = 404; throw err; }
  const app = await VolunteerPostingApplication.findOne({ postingId: posting._id, userId: req.user.id });
  if (!app) { const err = new Error("No application found"); err.statusCode = 404; throw err; }
  await app.deleteOne();
  await syncPostingStatus(posting);
  res.json({ success: true, message: "Application withdrawn" });
};

export const reviewApplication = async (req, res) => {
  const { applicationId, status } = req.body;
  if (!["accepted", "rejected"].includes(status)) {
    const err = new Error("status must be 'accepted' or 'rejected'"); err.statusCode = 400; throw err;
  }
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) { const err = new Error("Posting not found"); err.statusCode = 404; throw err; }
  const isOwner = String(posting.postedBy) === req.user.id;
  const isAdmin = req.user.roles?.includes("orgAdmin");
  if (!isOwner && !isAdmin) { const err = new Error("Forbidden"); err.statusCode = 403; throw err; }
  const app = await VolunteerPostingApplication.findOne({ _id: applicationId, postingId: posting._id });
  if (!app) { const err = new Error("Application not found"); err.statusCode = 404; throw err; }
  app.status = status; app.reviewedAt = new Date(); await app.save();
  await syncPostingStatus(posting);
  res.json({ success: true, message: `Application ${status}` });
};

export const getMyPostings = async (req, res) => {
  const pagination = parsePagination(req.query);
  const query = VolunteerPosting.find({ postedBy: req.user.id }).sort({ createdAt: -1 }).populate("clubId", "name");
  if (pagination) query.skip(pagination.skip).limit(pagination.limit);
  const postings = await query.lean();
  const response = { success: true, data: postings };
  if (pagination) {
    const total = await VolunteerPosting.countDocuments({ postedBy: req.user.id });
    response.meta = { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / pagination.limit) };
  }
  res.json(response);
};

export const getMyApplications = async (req, res) => {
  const pagination = parsePagination(req.query);
  const query = VolunteerPostingApplication.find({ userId: req.user.id }).sort({ appliedAt: -1 })
    .populate({ path: "postingId", populate: [{ path: "postedBy", select: "name" }, { path: "clubId", select: "name" }] });
  if (pagination) query.skip(pagination.skip).limit(pagination.limit);
  const applications = await query.lean();
  const result = applications.filter((app) => app.postingId).map((app) => ({
    ...app.postingId,
    myApplication: { _id: app._id, userId: app.userId, message: app.message, status: app.status, appliedAt: app.appliedAt, reviewedAt: app.reviewedAt },
  }));
  const response = { success: true, data: result };
  if (pagination) {
    const total = await VolunteerPostingApplication.countDocuments({ userId: req.user.id });
    response.meta = { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / pagination.limit) };
  }
  res.json(response);
};
