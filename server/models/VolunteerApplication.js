import mongoose from "mongoose";

const volunteerApplicationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

volunteerApplicationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
volunteerApplicationSchema.index({ eventId: 1, status: 1 });
volunteerApplicationSchema.index({ userId: 1, appliedAt: -1 });

export default mongoose.model("VolunteerApplication", volunteerApplicationSchema);
