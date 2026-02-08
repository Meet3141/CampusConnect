import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    role: {
      type: String,
      enum: ["member", "moderator"],
      default: "member",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });
membershipSchema.index({ clubId: 1 });
membershipSchema.index({ status: 1 });
membershipSchema.index({ userId: 1 });

export default mongoose.model("Membership", membershipSchema);
