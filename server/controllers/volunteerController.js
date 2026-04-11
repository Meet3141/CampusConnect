import VolunteerPosting from "../models/VolunteerPosting.js";

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

  res.json({
    success: true,
    data: postings,
    meta: { total, page: Number(page), limit: Number(limit) },
  });
};

// ─── Get single posting ────────────────────────────────────────────────────────
export const getPostingById = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id)
    .populate("postedBy", "name email")
    .populate("clubId", "name")
    .populate("eventId", "title date venue")
    .populate("applications.userId", "name email")
    .lean();

  if (!posting) {
    const err = new Error("Posting not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({ success: true, data: posting });
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

  const already = posting.applications.find(
    (a) => String(a.userId) === req.user.id
  );
  if (already) {
    const err = new Error("You have already applied"); err.statusCode = 400; throw err;
  }

  posting.applications.push({
    userId: req.user.id,
    message: req.body.message || "",
    status: "pending",
  });

  // Auto-fill: if slots are now all taken, mark posting as filled
  if (posting.slots !== null) {
    const accepted = posting.applications.filter((a) => a.status === "accepted").length;
    if (accepted >= posting.slots) posting.status = "filled";
  }

  await posting.save();
  res.status(201).json({ success: true, message: "Application submitted" });
};

// ─── Withdraw application ──────────────────────────────────────────────────────
export const withdrawApplication = async (req, res) => {
  const posting = await VolunteerPosting.findById(req.params.id);
  if (!posting) {
    const err = new Error("Posting not found"); err.statusCode = 404; throw err;
  }

  const idx = posting.applications.findIndex(
    (a) => String(a.userId) === req.user.id
  );
  if (idx === -1) {
    const err = new Error("No application found"); err.statusCode = 404; throw err;
  }

  posting.applications.splice(idx, 1);
  await posting.save();
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

  const app = posting.applications.id(applicationId);
  if (!app) {
    const err = new Error("Application not found"); err.statusCode = 404; throw err;
  }

  app.status = status;
  app.reviewedAt = new Date();

  // Auto-fill check
  if (posting.slots !== null) {
    const accepted = posting.applications.filter((a) => a.status === "accepted").length;
    if (accepted >= posting.slots) posting.status = "filled";
  }

  await posting.save();
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
  const postings = await VolunteerPosting.find({
    "applications.userId": req.user.id,
  })
    .sort({ date: 1 })
    .populate("postedBy", "name")
    .populate("clubId", "name")
    .lean();

  // Attach my application status to each result
  const result = postings.map((p) => {
    const myApp = p.applications.find(
      (a) => String(a.userId) === req.user.id
    );
    return { ...p, myApplication: myApp };
  });

  res.json({ success: true, data: result });
};
