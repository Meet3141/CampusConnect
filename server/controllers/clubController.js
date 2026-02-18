import Club from "../models/Club.js";
import User from "../models/User.js";

// Create a new club
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

// Get clubs with basic filters
export const getClubs = async (req, res) => {
  const { category, q, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (q) filter.name = { $regex: q, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const clubs = await Club.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
  const total = await Club.countDocuments(filter);

  res.json({ success: true, data: clubs, meta: { total, page: Number(page), limit: Number(limit) } });
};

// Get club details
export const getClubById = async (req, res) => {
  const club = await Club.findById(req.params.id).populate("adminId", "name email").lean();
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  res.json({ success: true, data: club });
};

// Update club (admin only)
export const updateClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  // allow orgAdmin or the club admin
  if (!(req.user.role === "orgAdmin" || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const updates = ["name", "description", "category", "coverImage"];
  updates.forEach((f) => {
    if (req.body[f] !== undefined) club[f] = req.body[f];
  });

  club.updatedAt = Date.now();
  await club.save();
  res.json({ success: true, data: club });
};

// Delete club (orgAdmin only)
export const deleteClub = async (req, res) => {
  if (req.user.role !== "orgAdmin")
    return res.status(403).json({ success: false, message: "Forbidden" });

  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  await club.remove();
  res.json({ success: true, message: "Club deleted" });
};

// Request to join club
export const joinClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  const existing = club.members.find((m) => m.userId.toString() === req.user.id);
  if (existing) return res.status(400).json({ success: false, message: "Already requested or member" });

  club.members.push({ userId: req.user.id, status: "pending" });
  await club.save();
  res.status(201).json({ success: true, message: "Join request submitted" });
};

// Leave club
export const leaveClub = async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  const idx = club.members.findIndex((m) => m.userId.toString() === req.user.id);
  if (idx === -1) return res.status(400).json({ success: false, message: "Not a member" });

  const member = club.members[idx];
  if (member.status === "active") club.memberCount = Math.max(0, club.memberCount - 1);

  club.members.splice(idx, 1);
  await club.save();
  res.json({ success: true, message: "Left club" });
};

// Get members with their approval status
export const getMembers = async (req, res) => {
  const club = await Club.findById(req.params.id).populate("members.userId", "name email role");
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });
  res.json({ success: true, data: club.members });
};

// Approve member (admin)
export const approveMember = async (req, res) => {
  const { memberId } = req.body; // user id to approve
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  if (!(req.user.role === "orgAdmin" || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const member = club.members.find((m) => m.userId.toString() === memberId);
  if (!member) return res.status(404).json({ success: false, message: "Member request not found" });
  if (member.status === "active") return res.status(400).json({ success: false, message: "Already active" });

  member.status = "active";
  member.approvedBy = req.user.id;
  member.approvedAt = Date.now();
  club.memberCount = (club.memberCount || 0) + 1;

  await club.save();
  res.json({ success: true, message: "Member approved" });
};

// Reject member (admin)
export const rejectMember = async (req, res) => {
  const { memberId } = req.body; // user id to reject
  const club = await Club.findById(req.params.id);
  if (!club) return res.status(404).json({ success: false, message: "Club not found" });

  if (!(req.user.role === "orgAdmin" || club.adminId.toString() === req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const member = club.members.find((m) => m.userId.toString() === memberId);
  if (!member) return res.status(404).json({ success: false, message: "Member request not found" });

  member.status = "rejected";
  await club.save();
  res.json({ success: true, message: "Member rejected" });
};

export default {};
