/**
 * modules/clubs/club.controller.js
 * HTTP layer for clubs and announcements.
 * All business logic (cache, membership ops) is preserved inline — no service
 * layer added for clubs yet as the logic is tightly coupled with cache.
 */
import Club from "./club.model.js";
import Membership from "./membership.model.js";
import Announcement from "./announcement.model.js";
import { getOrSet, invalidate } from "../../utils/cache.js";

const CLUB_CACHE_TTL = 60;

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

const isOrgAdmin   = (req) => (req.user?.roles || []).includes("orgAdmin");
const canManageClub = (req, club) => !(!club || !req.user) && (isOrgAdmin(req) || String(club.adminId) === String(req.user.id));

// ── Club CRUD ──────────────────────────────────────────────────────────────────

export const getClubs = async (req, res) => {
  const { q, category, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (q) filter.name = { $regex: q, $options: "i" };
  if (category) filter.category = category;
  const skip = (Number(page) - 1) * Number(limit);
  const [clubs, total] = await Promise.all([
    Club.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Club.countDocuments(filter),
  ]);
  res.json({ success: true, data: clubs, meta: { total, page: Number(page), limit: Number(limit) } });
};

export const getMyClubs = async (req, res) => {
  const memberships = await Membership.find({ userId: req.user.id }).select("clubId clubRole joinedAt status").lean();
  const clubIds = [...new Set(memberships.map((m) => String(m.clubId)))];
  const memberClubs = clubIds.length ? await Club.find({ _id: { $in: clubIds } }).sort({ createdAt: -1 }).lean() : [];
  const ownedClubs  = await Club.find({ adminId: req.user.id }).sort({ createdAt: -1 }).lean();

  const membershipByClubId = new Map(memberships.map((m) => [String(m.clubId), m]));
  const clubsById = new Map();

  for (const club of memberClubs) {
    const m = membershipByClubId.get(String(club._id));
    clubsById.set(String(club._id), {
      ...club, myStatus: m?.status === "approved" ? "active" : (m?.status || "pending"),
      myClubRole: m?.clubRole || "member", joinedAt: m?.joinedAt || null,
    });
  }
  for (const club of ownedClubs) {
    clubsById.set(String(club._id), { ...club, myStatus: "admin", myClubRole: "admin" });
  }
  const data = [...clubsById.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data });
};

export const getClubById = async (req, res) => {
  const club = await getOrSet(`club:${req.params.id}`, CLUB_CACHE_TTL, () =>
    Club.findById(req.params.id).populate("adminId", "name email").lean()
  );
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  res.json({ success: true, data: club });
};

export const createClub = async (req, res) => {
  const { name, description, category, coverImage } = req.body || {};
  if (!name || !description || !category) {
    return res.status(400).json({ success: false, message: "Name, description, and category are required" });
  }
  const club = await Club.create({
    name: String(name).trim(), description: String(description).trim(),
    category, coverImage: coverImage || null, adminId: req.user.id, memberCount: 0,
  });
  res.status(201).json({ success: true, data: club });
};

export const updateClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  if (!canManageClub(req, club)) return res.status(403).json({ success: false, message: "Forbidden" });
  const { name, description, category, coverImage } = req.body || {};
  if (name !== undefined) club.name = String(name).trim();
  if (description !== undefined) club.description = String(description).trim();
  if (category !== undefined) club.category = category;
  if (coverImage !== undefined) club.coverImage = coverImage || null;
  await club.save();
  invalidate(`club:${req.params.id}`);
  res.json({ success: true, data: club });
};

export const deleteClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  if (!canManageClub(req, club)) return res.status(403).json({ success: false, message: "Forbidden" });
  await Membership.deleteMany({ clubId: club._id });
  await club.deleteOne();
  invalidate(`club:${req.params.id}`);
  res.json({ success: true, message: "Club deleted" });
};

// ── Membership ─────────────────────────────────────────────────────────────────

export const joinClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  if (String(club.adminId) === String(req.user.id))
    return res.status(400).json({ success: false, message: "Club admins cannot join their own club" });

  const existing = await Membership.findOne({ userId: req.user.id, clubId: club._id });
  const roles = req.user?.roles || [];

  if (roles.includes("orgAdmin") || roles.includes("editor")) {
    const autoApprovedRole = roles.includes("orgAdmin") ? "org admin" : "editor";
    if (existing?.status === "approved") return res.status(400).json({ success: false, message: "Already a member" });
    if (existing) {
      const wasApproved = existing.status === "approved";
      Object.assign(existing, { status: "approved", clubRole: "member", coordinatorCategory: "none",
        approvedBy: req.user.id, approvedAt: new Date(), updatedAt: new Date() });
      await existing.save();
      if (!wasApproved) await Club.findByIdAndUpdate(club._id, { $inc: { memberCount: 1 } });
    } else {
      await Membership.create({ userId: req.user.id, clubId: club._id, status: "approved", clubRole: "member",
        approvedBy: req.user.id, approvedAt: new Date() });
      await Club.findByIdAndUpdate(club._id, { $inc: { memberCount: 1 } });
    }
    invalidate(`club:${club._id}`);
    return res.json({ success: true, message: `Added as member (${autoApprovedRole})` });
  }

  if (existing?.status === "approved") return res.status(400).json({ success: false, message: "Already a member" });
  if (existing) {
    Object.assign(existing, { status: "pending", clubRole: "member", coordinatorCategory: "none", updatedAt: new Date() });
    await existing.save();
  } else {
    await Membership.create({ userId: req.user.id, clubId: club._id, status: "pending", clubRole: "member" });
  }
  res.json({ success: true, message: "Join request submitted" });
};

export const leaveClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  if (String(club.adminId) === String(req.user.id))
    return res.status(400).json({ success: false, message: "Club admins cannot leave their own club" });
  const membership = await Membership.findOne({ userId: req.user.id, clubId: club._id });
  if (!membership) return res.status(404).json({ success: false, message: "Membership not found" });
  const wasApproved = membership.status === "approved";
  await membership.deleteOne();
  if (wasApproved) {
    await Club.findByIdAndUpdate(club._id,
      [{ $set: { memberCount: { $max: [0, { $subtract: ["$memberCount", 1] }] } } }],
      { updatePipeline: true }
    );
    invalidate(`club:${club._id}`);
  }
  res.json({ success: true, message: "Left club" });
};

export const getMembers = async (req, res) => {
  const club = await Club.findById(req.params.id).lean();
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  const pagination = parsePagination(req.query);
  const query = Membership.find({ clubId: club._id }).populate("userId", "name email profilePicture roles").sort({ createdAt: 1 });
  if (pagination) query.skip(pagination.skip).limit(pagination.limit);
  const members = await query.lean();
  const response = { success: true, data: members };
  if (pagination) {
    const total = await Membership.countDocuments({ clubId: club._id });
    response.meta = { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / pagination.limit) };
  }
  res.json(response);
};

export const approveMember = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  if (!canManageClub(req, club)) return res.status(403).json({ success: false, message: "Forbidden" });
  const targetUserId = req.body.memberId || req.body.userId || req.params.userId;
  const membership = await Membership.findOne({ userId: targetUserId, clubId: club._id });
  if (!membership) return res.status(404).json({ success: false, message: "Membership not found" });
  const wasApproved = membership.status === "approved";
  Object.assign(membership, { status: "approved", approvedBy: req.user.id, approvedAt: new Date(), updatedAt: new Date() });
  await membership.save();
  if (!wasApproved) { await Club.findByIdAndUpdate(club._id, { $inc: { memberCount: 1 } }); invalidate(`club:${club._id}`); }
  res.json({ success: true, data: membership, message: "Member approved" });
};

export const rejectMember = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  if (!canManageClub(req, club)) return res.status(403).json({ success: false, message: "Forbidden" });
  const targetUserId = req.body.memberId || req.body.userId || req.params.userId;
  const membership = await Membership.findOne({ userId: targetUserId, clubId: club._id });
  if (!membership) return res.status(404).json({ success: false, message: "Membership not found" });
  const wasApproved = membership.status === "approved";
  Object.assign(membership, { status: "rejected", clubRole: "member", coordinatorCategory: "none", updatedAt: new Date() });
  await membership.save();
  if (wasApproved) {
    await Club.findByIdAndUpdate(club._id,
      [{ $set: { memberCount: { $max: [0, { $subtract: ["$memberCount", 1] }] } } }],
      { updatePipeline: true }
    );
    invalidate(`club:${club._id}`);
  }
  res.json({ success: true, data: membership, message: "Member rejected" });
};

export const assignCoordinator = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  if (!canManageClub(req, club)) return res.status(403).json({ success: false, message: "Forbidden" });
  const userId = req.body.memberId || req.body.userId || req.params.userId;
  const membership = await Membership.findOne({ userId, clubId: club._id });
  if (!membership) return res.status(404).json({ success: false, message: "Membership not found" });
  if (membership.status !== "approved") return res.status(400).json({ success: false, message: "Only approved members can be coordinators" });
  membership.clubRole = "coordinator";
  membership.updatedAt = new Date();
  await membership.save();
  res.json({ success: true, data: membership, message: "Coordinator assigned" });
};

export const removeCoordinator = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  if (!canManageClub(req, club)) return res.status(403).json({ success: false, message: "Forbidden" });
  const membership = await Membership.findOne({ userId: req.params.userId, clubId: club._id });
  if (!membership) return res.status(404).json({ success: false, message: "Membership not found" });
  membership.clubRole = "member";
  membership.coordinatorCategory = "none";
  membership.updatedAt = new Date();
  await membership.save();
  res.json({ success: true, data: membership, message: "Coordinator removed" });
};

// ── Announcements ──────────────────────────────────────────────────────────────

export const getAnnouncements = async (req, res) => {
  const clubId = req.params.id;
  const club = await Club.findById(clubId).lean();
  if (!club) return res.status(403).json({ success: false, message: "Join the club to see announcements" });
  const isAdmin = club.adminId.toString() === req.user.id;
  if (!isAdmin) {
    const m = await Membership.findOne({ userId: req.user.id, clubId, status: "approved" }).lean();
    if (!m) return res.status(403).json({ success: false, message: "Join the club to see announcements" });
  }
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [announcements, total] = await Promise.all([
    Announcement.find({ clubId }).sort({ pinned: -1, createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("postedBy", "name profilePicture").lean(),
    Announcement.countDocuments({ clubId }),
  ]);
  res.json({ success: true, data: announcements, meta: { total } });
};

export const createAnnouncement = async (req, res) => {
  const { title, body, tag = "general", pinned = false } = req.body;
  if (!title || !body) return res.status(400).json({ success: false, message: "Title and body are required" });
  const ann = await Announcement.create({ clubId: req.params.id, title: title.trim(), body: body.trim(),
    tag, pinned: Boolean(pinned), postedBy: req.user.id });
  await ann.populate("postedBy", "name profilePicture");
  res.status(201).json({ success: true, data: ann });
};

export const deleteAnnouncement = async (req, res) => {
  const ann = await Announcement.findById(req.params.annId);
  if (!ann) return res.status(404).json({ success: false, message: "Announcement not found" });
  if (ann.clubId.toString() !== req.params.id)
    return res.status(400).json({ success: false, message: "Announcement does not belong to this club" });
  const userRoles = req.user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(req.params.id).lean();
  const isClubAdmin = club && club.adminId.toString() === req.user.id;
  const isAuthor = ann.postedBy.toString() === req.user.id;
  if (!isOrgAdmin && !isClubAdmin && !isAuthor)
    return res.status(403).json({ success: false, message: "Forbidden" });
  await ann.deleteOne();
  res.json({ success: true, message: "Announcement deleted" });
};

export const pinAnnouncement = async (req, res) => {
  const ann = await Announcement.findById(req.params.annId);
  if (!ann || ann.clubId.toString() !== req.params.id)
    return res.status(404).json({ success: false, message: "Announcement not found" });
  ann.pinned = !ann.pinned;
  await ann.save();
  res.json({ success: true, data: ann });
};
