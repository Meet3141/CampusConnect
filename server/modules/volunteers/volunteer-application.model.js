import mongoose from "mongoose";

const volunteerPostingApplicationSchema = new mongoose.Schema(
  {
    postingId: { type: mongoose.Schema.Types.ObjectId, ref: "VolunteerPosting", required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message:   { type: String, default: "", maxlength: 500 },
    status:    { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", required: true },
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

volunteerPostingApplicationSchema.index({ postingId: 1, userId: 1 }, { unique: true });
volunteerPostingApplicationSchema.index({ postingId: 1, status: 1 });
volunteerPostingApplicationSchema.index({ userId: 1, appliedAt: -1 });

export default mongoose.model("VolunteerPostingApplication", volunteerPostingApplicationSchema);
