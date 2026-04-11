import Announcement from "../models/Announcement.js";
import Membership from "../models/Membership.js";
import Club from "../models/Club.js";

// ── Helper: check if caller can read this club's announcements ─────────────────
const canRead = async (userId, clubId) => {
  const club = await Club.findById(clubId).lean();
  if (!club) return false;
  if (club.adminId.toString() === userId) return true;
  const m = await Membership.findOne({ userId, clubId, status: "approved" }).lean();
  return !!m;
};

// ── GET /api/clubs/:id/announcements ──────────────────────────────────────────
export const getAnnouncements = async (req, res) => {
  const clubId = req.params.id;
  const allowed = await canRead(req.user.id, clubId);
  if (!allowed) {
    return res.status(403).json({ success: false, message: "Join the club to see announcements" });
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [announcements, total] = await Promise.all([
    Announcement.find({ clubId })
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("postedBy", "name profilePicture")
      .lean(),
    Announcement.countDocuments({ clubId }),
  ]);

  res.json({ success: true, data: announcements, meta: { total } });
};

// ── POST /api/clubs/:id/announcements ─────────────────────────────────────────
// Allowed: club admin (scope-checked in middleware) or coordinator (via requireClubPermission)
export const createAnnouncement = async (req, res) => {
  const { title, body, tag = "general", pinned = false } = req.body;

  if (!title || !body) {
    return res.status(400).json({ success: false, message: "Title and body are required" });
  }

  const ann = await Announcement.create({
    clubId:   req.params.id,
    title:    title.trim(),
    body:     body.trim(),
    tag,
    pinned:   Boolean(pinned),
    postedBy: req.user.id,
  });

  await ann.populate("postedBy", "name profilePicture");
  res.status(201).json({ success: true, data: ann });
};

// ── DELETE /api/clubs/:id/announcements/:annId ────────────────────────────────
// Allowed: original poster OR club admin OR orgAdmin
export const deleteAnnouncement = async (req, res) => {
  const ann = await Announcement.findById(req.params.annId);
  if (!ann) {
    return res.status(404).json({ success: false, message: "Announcement not found" });
  }
  if (ann.clubId.toString() !== req.params.id) {
    return res.status(400).json({ success: false, message: "Announcement does not belong to this club" });
  }

  const userRoles = req.user.roles || [];
  const isOrgAdmin = userRoles.includes("orgAdmin");
  const club = await Club.findById(req.params.id).lean();
  const isClubAdmin = club && club.adminId.toString() === req.user.id;
  const isAuthor = ann.postedBy.toString() === req.user.id;

  if (!isOrgAdmin && !isClubAdmin && !isAuthor) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  await ann.deleteOne();
  res.json({ success: true, message: "Announcement deleted" });
};

// ── PATCH /api/clubs/:id/announcements/:annId/pin ─────────────────────────────
// Only club admin or orgAdmin can pin
export const pinAnnouncement = async (req, res) => {
  const ann = await Announcement.findById(req.params.annId);
  if (!ann || ann.clubId.toString() !== req.params.id) {
    return res.status(404).json({ success: false, message: "Announcement not found" });
  }

  ann.pinned = !ann.pinned;
  await ann.save();
  res.json({ success: true, data: ann });
};
