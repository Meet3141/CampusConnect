import VolunteerPosting from "../models/VolunteerPosting.js";
import VolunteerPostingApplication from "../models/VolunteerPostingApplication.js";

const hydratePostingApplications = async (posting) => {
  const applications = await VolunteerPostingApplication.find({ postingId: posting._id })
    .populate("userId", "name email")
    .sort({ appliedAt: 1 })
    .lean();

  const legacyApplications = Array.isArray(posting.applications)
    ? posting.applications.map((app) => ({
        ...app,
        userId: app.userId,
      }))
    : [];

  return {
    ...posting,
    applications: applications.length > 0 ? applications : legacyApplications,
  };
};

const syncPostingStatus = async (posting) => {
  if (posting.slots === null) return posting;

  const accepted = await VolunteerPostingApplication.countDocuments({
    postingId: posting._id,
    status: "accepted",
  });

  const nextStatus = accepted >= posting.slots ? "filled" : "open";
  if (posting.status !== "closed") {
    posting.status = nextStatus;
    await posting.save();
  }

  return posting;
};

// ─── List postings (public / filterable) ──────────────────────────────────────
export const getPostings = async (req, res) => {
  const { category, status = "open", q, page = 1, limit = 20 } = req.query;
  const filter = { status };

  if (category) filter.category = category;
  if (q) filter.title = { $regex: q, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);

  const [postings, total] = await Promise.all([
    VolunteerPosting.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("postedBy", "name")
      .populate("clubId", "name")
      .populate("eventId", "title")
      .lean(),
    VolunteerPosting.countDocuments(filter),
  ]);

  const hydrated = await Promise.all(postings.map((posting) => hydratePostingApplications(posting)));

  res.json({
    success: true,
    data: hydrated,
    meta: { total, page: Number(page), limit: Number(limit) },
  });
};

// ─── Get single posting ────────────────────────────────────────────────────────
export const getPostingById = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id)
    .populate("postedBy", "name email")
    .populate("clubId", "name")
    .populate("eventId", "title date venue")
    .lean();

  if (!posting) {
    const err = new Error("Posting not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ success: true, data: await hydratePostingApplications(posting) });
};

// ─── Create posting (clubAdmin / orgAdmin) ─────────────────────────────────────
export const createPosting = async (req, res) => {
  const {
    title, description, venue, date, duration,
    skillsNeeded, category, slots, clubId, eventId,
  } = req.body;

  if (!title || !description || !date) {
    const err = new Error("title, description, and date are required");
    err.statusCode = 400;
    throw err;
  }

  const posting = await VolunteerPosting.create({
    title,
    description,
    venue: venue || "TBD",
    date,
    duration: duration || null,
    skillsNeeded: Array.isArray(skillsNeeded) ? skillsNeeded : [],
    category: category || "other",
    slots: slots ? Number(slots) : null,
    clubId: clubId || null,
    eventId: eventId || null,
    postedBy: req.user.id,
  });

  res.status(201).json({ success: true, data: posting });
};

// ─── Update posting (poster or orgAdmin) ──────────────────────────────────────
export const updatePosting = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) {
    const err = new Error("Posting not found");
    err.statusCode = 404;
    throw err;
  }

  const isOwner = String(posting.postedBy) === req.user.id;
  const isAdmin = req.user.roles?.includes("orgAdmin");
  if (!isOwner && !isAdmin) {
    const err = new Error("Forbidden"); err.statusCode = 403; throw err;
  }

  const allowed = ["title", "description", "venue", "date", "duration", "skillsNeeded", "category", "slots", "status"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) posting[f] = req.body[f]; });

  await posting.save();
  res.json({ success: true, data: posting });
};

// ─── Delete posting (poster or orgAdmin) ──────────────────────────────────────
export const deletePosting = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) {
    const err = new Error("Posting not found");
    err.statusCode = 404;
    throw err;
  }

  const isOwner = String(posting.postedBy) === req.user.id;
  const isAdmin = req.user.roles?.includes("orgAdmin");
  if (!isOwner && !isAdmin) {
    const err = new Error("Forbidden"); err.statusCode = 403; throw err;
  }

  await posting.deleteOne();
  await VolunteerPostingApplication.deleteMany({ postingId: posting._id });
  res.json({ success: true, message: "Posting deleted" });
};

// ─── Apply to posting ──────────────────────────────────────────────────────────
export const applyToPosting = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) {
    const err = new Error("Posting not found"); err.statusCode = 404; throw err;
  }
  if (posting.status !== "open") {
    const err = new Error("This posting is no longer accepting applications");
    err.statusCode = 400; throw err;
  }

  const already = await VolunteerPostingApplication.findOne({ postingId: posting._id, userId: req.user.id });
  if (already) {
    const err = new Error("You have already applied"); err.statusCode = 400; throw err;
  }

  await VolunteerPostingApplication.create({
    postingId: posting._id,
    userId: req.user.id,
    message: req.body.message || "",
    status: "pending",
  });

  // Auto-fill: if slots are now all taken, mark posting as filled
  await syncPostingStatus(posting);
  res.status(201).json({ success: true, message: "Application submitted" });
};

// ─── Withdraw application ──────────────────────────────────────────────────────
export const withdrawApplication = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) {
    const err = new Error("Posting not found"); err.statusCode = 404; throw err;
  }

  const app = await VolunteerPostingApplication.findOne({ postingId: posting._id, userId: req.user.id });
  if (!app) {
    const err = new Error("No application found"); err.statusCode = 404; throw err;
  }

  await app.deleteOne();
  await syncPostingStatus(posting);
  res.json({ success: true, message: "Application withdrawn" });
};

// ─── Review application (poster or orgAdmin) ──────────────────────────────────
export const reviewApplication = async (req, res) => {
  const { applicationId, status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    const err = new Error("status must be 'accepted' or 'rejected'");
    err.statusCode = 400; throw err;
  }

  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) {
    const err = new Error("Posting not found"); err.statusCode = 404; throw err;
  }

  const isOwner = String(posting.postedBy) === req.user.id;
  const isAdmin = req.user.roles?.includes("orgAdmin");
  if (!isOwner && !isAdmin) {
    const err = new Error("Forbidden"); err.statusCode = 403; throw err;
  }

  const app = await VolunteerPostingApplication.findOne({ _id: applicationId, postingId: posting._id });
  if (!app) {
    const err = new Error("Application not found"); err.statusCode = 404; throw err;
  }

  app.status = status;
  app.reviewedAt = new Date();
  await app.save();

  // Auto-fill check
  await syncPostingStatus(posting);
  res.json({ success: true, message: `Application ${status}` });
};

// ─── Get all postings by current user (my postings) ───────────────────────────
export const getMyPostings = async (req, res) => {
  const postings = await VolunteerPosting.find({ postedBy: req.user.id })
    .sort({ createdAt: -1 })
    .populate("clubId", "name")
    .lean();

  res.json({ success: true, data: postings });
};

// ─── Get postings where I have applied ────────────────────────────────────────
export const getMyApplications = async (req, res) => {
  const applications = await VolunteerPostingApplication.find({ userId: req.user.id })
    .sort({ appliedAt: -1 })
    .populate({
      path: "postingId",
      populate: [
        { path: "postedBy", select: "name" },
        { path: "clubId", select: "name" },
      ],
    })
    .lean();

  const result = applications
    .filter((app) => app.postingId)
    .map((app) => ({
      ...app.postingId,
      myApplication: {
        _id: app._id,
        userId: app.userId,
        message: app.message,
        status: app.status,
        appliedAt: app.appliedAt,
        reviewedAt: app.reviewedAt,
      },
    }));

  res.json({ success: true, data: result });
};
