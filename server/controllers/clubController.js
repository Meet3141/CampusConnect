import Club from "../models/Club.js";
import Membership from "../models/Membership.js";

const isOrgAdmin = (req) => (req.user?.roles || []).includes("orgAdmin");

const canManageClub = (req, club) => {
	if (!club || !req.user) return false;
	return isOrgAdmin(req) || String(club.adminId) === String(req.user.id);
};

const syncMemberCount = async (clubId) => {
	const memberCount = await Membership.countDocuments({
		clubId,
		status: "approved",
	});

	await Club.findByIdAndUpdate(clubId, { memberCount });
	return memberCount;
};

export const getClubs = async (req, res) => {
	const { q, category, page = 1, limit = 20 } = req.query;
	const filter = {};

	if (q) {
		filter.name = { $regex: q, $options: "i" };
	}

	if (category) {
		filter.category = category;
	}

	const skip = (Number(page) - 1) * Number(limit);

	const [clubs, total] = await Promise.all([
		Club.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
		Club.countDocuments(filter),
	]);

	res.json({
		success: true,
		data: clubs,
		meta: {
			total,
			page: Number(page),
			limit: Number(limit),
		},
	});
};

export const getMyClubs = async (req, res) => {
	const memberships = await Membership.find({
		userId: req.user.id,
	}).select("clubId clubRole joinedAt status").lean();

	const clubIds = [...new Set(memberships.map((membership) => String(membership.clubId)))];
	const memberClubs = clubIds.length
		? await Club.find({ _id: { $in: clubIds } }).sort({ createdAt: -1 }).lean()
		: [];

	const ownedClubs = await Club.find({ adminId: req.user.id }).sort({ createdAt: -1 }).lean();

	const membershipByClubId = new Map();
	for (const membership of memberships) {
		membershipByClubId.set(String(membership.clubId), membership);
	}

	const clubsById = new Map();

	for (const club of memberClubs) {
		const membership = membershipByClubId.get(String(club._id));
		const normalizedStatus = membership?.status === "approved"
			? "active"
			: (membership?.status || "pending");

		clubsById.set(String(club._id), {
			...club,
			myStatus: normalizedStatus,
			myClubRole: membership?.clubRole || "member",
			joinedAt: membership?.joinedAt || null,
		});
	}

	for (const club of ownedClubs) {
		clubsById.set(String(club._id), {
			...club,
			myStatus: "admin",
			myClubRole: "admin",
		});
	}

	const data = [...clubsById.values()].sort(
		(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
	);

	res.json({ success: true, data });
};

export const getClubById = async (req, res) => {
	const club = await Club.findById(req.params.id)
		.populate("adminId", "name email")
		.lean();

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	res.json({ success: true, data: club });
};

export const createClub = async (req, res) => {
	const { name, description, category, coverImage } = req.body || {};

	if (!name || !description || !category) {
		return res.status(400).json({
			success: false,
			message: "Name, description, and category are required",
		});
	}

	const club = await Club.create({
		name: String(name).trim(),
		description: String(description).trim(),
		category,
		coverImage: coverImage || null,
		adminId: req.user.id,
		memberCount: 0,
	});

	res.status(201).json({ success: true, data: club });
};

export const updateClub = async (req, res) => {
	const club = await Club.findById(req.params.id);

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	if (!canManageClub(req, club)) {
		return res.status(403).json({ success: false, message: "Forbidden" });
	}

	const { name, description, category, coverImage } = req.body || {};

	if (name !== undefined) club.name = String(name).trim();
	if (description !== undefined) club.description = String(description).trim();
	if (category !== undefined) club.category = category;
	if (coverImage !== undefined) club.coverImage = coverImage || null;

	await club.save();
	res.json({ success: true, data: club });
};

export const deleteClub = async (req, res) => {
	const club = await Club.findById(req.params.id);

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	if (!canManageClub(req, club)) {
		return res.status(403).json({ success: false, message: "Forbidden" });
	}

	await Membership.deleteMany({ clubId: club._id });
	await club.deleteOne();

	res.json({ success: true, message: "Club deleted" });
};

export const joinClub = async (req, res) => {
	const club = await Club.findById(req.params.id);

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	if (String(club.adminId) === String(req.user.id)) {
		return res.status(400).json({ success: false, message: "Club admins cannot join their own club" });
	}

	const existing = await Membership.findOne({
		userId: req.user.id,
		clubId: club._id,
	});

	// Org admins and editors are implicitly members — auto-approve their join requests
	const roles = req.user?.roles || [];
	if (roles.includes("orgAdmin") || roles.includes("editor")) {
		const autoApprovedRole = roles.includes("orgAdmin") ? "org admin" : "editor";
		if (existing && existing.status === "approved") {
			return res.status(400).json({ success: false, message: "Already a member" });
		}

		if (existing) {
			existing.status = "approved";
			existing.clubRole = "member";
			existing.coordinatorCategory = "none";
			existing.approvedBy = req.user.id;
			existing.approvedAt = new Date();
			existing.updatedAt = new Date();
			await existing.save();
		} else {
			await Membership.create({
				userId: req.user.id,
				clubId: club._id,
				status: "approved",
				clubRole: "member",
				approvedBy: req.user.id,
				approvedAt: new Date(),
			});
		}

		// Ensure club.memberCount is in sync
		await syncMemberCount(club._id);

		return res.json({ success: true, message: `Added as member (${autoApprovedRole})` });
	}

	if (existing && existing.status === "approved") {
		return res.status(400).json({ success: false, message: "Already a member" });
	}

	if (existing) {
		existing.status = "pending";
		existing.clubRole = "member";
		existing.coordinatorCategory = "none";
		existing.updatedAt = new Date();
		await existing.save();
	} else {
		await Membership.create({
			userId: req.user.id,
			clubId: club._id,
			status: "pending",
			clubRole: "member",
		});
	}

	res.json({ success: true, message: "Join request submitted" });
};

export const leaveClub = async (req, res) => {
	const club = await Club.findById(req.params.id);

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	if (String(club.adminId) === String(req.user.id)) {
		return res.status(400).json({ success: false, message: "Club admins cannot leave their own club" });
	}

	const membership = await Membership.findOne({
		userId: req.user.id,
		clubId: club._id,
	});

	if (!membership) {
		return res.status(404).json({ success: false, message: "Membership not found" });
	}

	const wasApproved = membership.status === "approved";
	await membership.deleteOne();

	if (wasApproved) {
		await syncMemberCount(club._id);
	}

	res.json({ success: true, message: "Left club" });
};

export const getMembers = async (req, res) => {
	const club = await Club.findById(req.params.id).lean();

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	const members = await Membership.find({ clubId: club._id })
		.populate("userId", "name email profilePicture roles")
		.sort({ createdAt: 1 })
		.lean();

	res.json({ success: true, data: members });
};

export const approveMember = async (req, res) => {
	const club = await Club.findById(req.params.id);

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	if (!canManageClub(req, club)) {
		return res.status(403).json({ success: false, message: "Forbidden" });
	}

	const targetUserId = req.body.memberId || req.body.userId || req.params.userId;
	const membership = await Membership.findOne({
		userId: targetUserId,
		clubId: club._id,
	});

	if (!membership) {
		return res.status(404).json({ success: false, message: "Membership not found" });
	}

	const wasApproved = membership.status === "approved";
	membership.status = "approved";
	membership.approvedBy = req.user.id;
	membership.approvedAt = new Date();
	membership.updatedAt = new Date();
	await membership.save();

	if (!wasApproved) {
		await syncMemberCount(club._id);
	}

	res.json({ success: true, data: membership, message: "Member approved" });
};

export const rejectMember = async (req, res) => {
	const club = await Club.findById(req.params.id);

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	if (!canManageClub(req, club)) {
		return res.status(403).json({ success: false, message: "Forbidden" });
	}

	const targetUserId = req.body.memberId || req.body.userId || req.params.userId;
	const membership = await Membership.findOne({
		userId: targetUserId,
		clubId: club._id,
	});

	if (!membership) {
		return res.status(404).json({ success: false, message: "Membership not found" });
	}

	const wasApproved = membership.status === "approved";
	membership.status = "rejected";
	membership.clubRole = "member";
	membership.coordinatorCategory = "none";
	membership.updatedAt = new Date();
	await membership.save();

	if (wasApproved) {
		await syncMemberCount(club._id);
	}

	res.json({ success: true, data: membership, message: "Member rejected" });
};

export const assignCoordinator = async (req, res) => {
	const club = await Club.findById(req.params.id);

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	if (!canManageClub(req, club)) {
		return res.status(403).json({ success: false, message: "Forbidden" });
	}

	const userId = req.body.memberId || req.body.userId || req.params.userId;
	const membership = await Membership.findOne({ userId, clubId: club._id });

	if (!membership) {
		return res.status(404).json({ success: false, message: "Membership not found" });
	}

	if (membership.status !== "approved") {
		return res.status(400).json({ success: false, message: "Only approved members can be coordinators" });
	}

	membership.clubRole = "coordinator";
	membership.updatedAt = new Date();
	await membership.save();

	res.json({ success: true, data: membership, message: "Coordinator assigned" });
};

export const removeCoordinator = async (req, res) => {
	const club = await Club.findById(req.params.id);

	if (!club) {
		return res.status(404).json({ success: false, message: "Club not found" });
	}

	if (!canManageClub(req, club)) {
		return res.status(403).json({ success: false, message: "Forbidden" });
	}

	const membership = await Membership.findOne({
		userId: req.params.userId,
		clubId: club._id,
	});

	if (!membership) {
		return res.status(404).json({ success: false, message: "Membership not found" });
	}

	membership.clubRole = "member";
	membership.coordinatorCategory = "none";
	membership.updatedAt = new Date();
	await membership.save();

	res.json({ success: true, data: membership, message: "Coordinator removed" });
};
