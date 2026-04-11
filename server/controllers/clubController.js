import Club from "../models/Club.js";
import Membership from "../models/Membership.js";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Recalculate and persist the approved member count on a club */
const syncMemberCount = async (clubId) => {
  const count = await Membership.countDocuments({ clubId, status: "approved" });
  await Club.findByIdAndUpdate(clubId, { memberCount: count });
  return count;
};

// ── Create a new club ─────────────────────────────────────────────────────────
export const createClub = async (req, res) => {
  const { name, description, category, coverImage } = req.body;

  const club = await Club.create({
    name,
    description,
    category,
    coverImage: coverImage || null,
    adminId: req.user.id,
  });

  res.status(201).json({ success: true, data: club });
};

// ── Get clubs with basic filters ───────────────────────────────────────────
export const getClubs = async (req, res) => {
  const { category, q, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (q) filter.name = { $regex: q, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const clubs = await Club.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  const total = await Club.countDocuments(filter);

  res.json({
    success: true,
    data: clubs,
    meta: { total, page: Number(page), limit: Number(limit) },
  });
};

// ── Get clubs for the authenticated user ───────────────────────────────────
export const getMyClubs = async (req, res) => {
  const memberships = await Membership.find({ userId: req.user.id })
    .populate("clubId")
    .lean();

  const result = memberships
    .filter((m) => m.clubId)   // guard against orphan memberships
    .map((m) => ({
      ...m.clubId,
      myStatus: m.status,
      membershipId: m._id,
    }));

  // Also include clubs where the user is the admin (they're not a Membership entry)
  const adminClubs = await Club.find({ adminId: req.user.id }).lean();
  const memberClubIds = new Set(result.map((c) => String(c._id)));

  for (const club of adminClubs) {
    if (!memberClubIds.has(String(club._id))) {
      result.push({ ...club, myStatus: "admin" });
    }
  }

  res.json({ success: true, data: result });
};

// ── Get club details ────────────────────────────────────────────────────────
export const getClubById = async (req, res) => {
  const club = await Club.findById(req.params.id)
    .populate("adminId", "name email")
    .lean();
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  res.json({ success: true, data: club });
};

// ── Update club (clubAdmin or orgAdmin only) ────────────────────────────────
export const updateClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  // S3.C1 — scope check
  const userRoles = req.user.roles || [];
  if (!(userRoles.includes("orgAdmin") || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const allowed = ["name", "description", "category", "coverImage"];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) club[f] = req.body[f];
  });

  await club.save();
  res.json({ success: true, data: club });
};

// ── Delete club (orgAdmin only) ─────────────────────────────────────────────
export const deleteClub = async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes("orgAdmin"))
    return res.status(403).json({ success: false, message: "Forbidden" });

  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  // Cascade-delete all memberships for this club
  await Membership.deleteMany({ clubId: req.params.id });
  await Club.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: "Club deleted" });
};

// ── Request to join club ────────────────────────────────────────────────────
export const joinClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  // Club admin cannot join their own club
  if (club.adminId.toString() === req.user.id) {
    return res
      .status(400)
      .json({ success: false, message: "Club admin cannot join their own club" });
  }

  // Compound unique index on Membership prevents duplicates at DB level
  // but we surface a friendly error here
  const existing = await Membership.findOne({
    userId: req.user.id,
    clubId: req.params.id,
  });
  if (existing) {
    return res
      .status(400)
      .json({ success: false, message: "Already requested or a member" });
  }

  const membership = await Membership.create({
    userId: req.user.id,
    clubId: req.params.id,
    status: "pending",
  });

  res.status(201).json({ success: true, message: "Join request submitted", data: membership });
};

// ── Leave club ──────────────────────────────────────────────────────────────
export const leaveClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  if (club.adminId.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "Club admin cannot leave their own club. Transfer ownership first.",
    });
  }

  const membership = await Membership.findOneAndDelete({
    userId: req.user.id,
    clubId: req.params.id,
  });

  if (!membership) {
    return res.status(400).json({ success: false, message: "Not a member" });
  }

  // If they were approved, decrement the counter
  if (membership.status === "approved") {
    await syncMemberCount(req.params.id);
  }

  res.json({ success: true, message: "Left club" });
};

// ── Get members (populated) ─────────────────────────────────────────────────
export const getMembers = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  const members = await Membership.find({ clubId: req.params.id })
    .populate("userId", "name email roles profilePicture")
    .sort({ createdAt: -1 })
    .select("userId clubId status clubRole coordinatorCategory joinedAt approvedAt approvedBy")
    .lean();

  res.json({ success: true, data: members });
};

// ── Approve member (clubAdmin or orgAdmin) ──────────────────────────────────
export const approveMember = async (req, res) => {
  const { memberId } = req.body;   // memberId = userId (not Membership._id)
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  // S3.C1 — scope check
  const userRoles = req.user.roles || [];
  if (!(userRoles.includes("orgAdmin") || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const membership = await Membership.findOne({
    userId: memberId,
    clubId: req.params.id,
  });
  if (!membership) {
    return res.status(404).json({ success: false, message: "Membership request not found" });
  }
  if (membership.status === "approved") {
    return res.status(400).json({ success: false, message: "Already approved" });
  }

  membership.status = "approved";
  membership.approvedBy = req.user.id;
  membership.approvedAt = new Date();
  await membership.save();

  await syncMemberCount(req.params.id);

  res.json({ success: true, message: "Member approved" });
};

// ── Reject member (clubAdmin or orgAdmin) ───────────────────────────────────
export const rejectMember = async (req, res) => {
  const { memberId } = req.body;
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  // S3.C1 — scope check
  const userRoles = req.user.roles || [];
  if (!(userRoles.includes("orgAdmin") || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const membership = await Membership.findOneAndUpdate(
    { userId: memberId, clubId: req.params.id },
    { status: "rejected" },
    { new: true }
  );

  if (!membership) {
    return res.status(404).json({ success: false, message: "Membership request not found" });
  }

  res.json({ success: true, message: "Member rejected" });
};

// ── Assign coordinator role (clubAdmin or orgAdmin) ─────────────────────────
export const assignCoordinator = async (req, res) => {
  const { memberId, coordinatorCategory = "none" } = req.body;

  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  // Only this club's admin or orgAdmin may promote
  const userRoles = req.user.roles || [];
  if (!(userRoles.includes("orgAdmin") || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const VALID_CATEGORIES = ["event", "content", "technical", "none"];
  if (!VALID_CATEGORIES.includes(coordinatorCategory)) {
    return res.status(400).json({ success: false, message: `Invalid category. Use: ${VALID_CATEGORIES.join(", ")}` });
  }

  const membership = await Membership.findOneAndUpdate(
    { userId: memberId, clubId: req.params.id, status: "approved" },
    { clubRole: "coordinator", coordinatorCategory },
    { new: true }
  ).populate("userId", "name email");

  if (!membership) {
    return res.status(404).json({ success: false, message: "Approved membership not found for this user" });
  }

  res.json({ success: true, message: "Coordinator role assigned", data: membership });
};

// ── Remove coordinator role (clubAdmin or orgAdmin) ──────────────────────────
export const removeCoordinator = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  const userRoles = req.user.roles || [];
  if (!(userRoles.includes("orgAdmin") || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const membership = await Membership.findOneAndUpdate(
    { userId: req.params.userId, clubId: req.params.id },
    { clubRole: "member", coordinatorCategory: "none" },
    { new: true }
  ).populate("userId", "name email");

  if (!membership) {
    return res.status(404).json({ success: false, message: "Membership not found" });
  }

  res.json({ success: true, message: "Coordinator role removed", data: membership });
};

export default {};
