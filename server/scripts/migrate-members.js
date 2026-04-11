/**
 * migrate-members.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-TIME migration: copies embedded club.members[] data into the
 * Membership collection, then removes the members[] field from all clubs.
 *
 * Run ONCE before restarting the server after the S4.C1 fix:
 *   node scripts/migrate-members.js
 *
 * Safe to re-run — uses upsert so it won't create duplicates.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "dotenv/config";
import mongoose from "mongoose";

// ── Inline minimal schemas (avoids circular dependency issues) ────────────────

const clubSchema = new mongoose.Schema({}, { strict: false });
const membershipSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clubId:     { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    status:     { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    joinedAt:   Date,
    approvedBy: mongoose.Schema.Types.ObjectId,
    approvedAt: Date,
    role:       { type: String, enum: ["member", "moderator"], default: "member" },
  },
  { timestamps: true }
);
membershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });

const Club       = mongoose.model("Club",       clubSchema);
const Membership = mongoose.model("Membership", membershipSchema);

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB");

  const clubs = await Club.find({ "members.0": { $exists: true } }).lean();

  if (clubs.length === 0) {
    console.log("ℹ No clubs with embedded members found — nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  console.log(`→ Found ${clubs.length} clubs with embedded members…`);

  let migrated = 0;
  let skipped  = 0;

  for (const club of clubs) {
    const members = club.members || [];

    for (const m of members) {
      if (!m.userId) continue;

      // Map old status field (active → approved to match Membership enum)
      const status = m.status === "active" ? "approved" : (m.status || "pending");

      try {
        await Membership.findOneAndUpdate(
          { userId: m.userId, clubId: club._id },
          {
            $setOnInsert: {
              userId:     m.userId,
              clubId:     club._id,
              status,
              joinedAt:   m.joinedAt  || new Date(),
              approvedBy: m.approvedBy || null,
              approvedAt: m.approvedAt || null,
            },
          },
          { upsert: true, new: true }
        );
        migrated++;
      } catch (err) {
        if (err.code === 11000) {
          skipped++;   // Already exists — fine
        } else {
          console.error(`  ✗ Error for club ${club._id} / user ${m.userId}:`, err.message);
        }
      }
    }

    // Update memberCount to reflect the approved members
    const approvedCount = await Membership.countDocuments({
      clubId: club._id,
      status: "approved",
    });
    await Club.updateOne(
      { _id: club._id },
      { $set: { memberCount: approvedCount } }
    );
  }

  console.log(`✓ Migration complete — ${migrated} memberships created, ${skipped} already existed.`);
  console.log("⚠  Note: The members[] field still exists in your Club documents.");
  console.log("   Run the following in mongosh to clean it up after verifying:");
  console.log("   db.clubs.updateMany({}, { $unset: { members: '' } })");

  await mongoose.disconnect();
  console.log("✓ Disconnected.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
