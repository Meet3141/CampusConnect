import mongoose from "mongoose";

const rsvpSchema = new mongoose.Schema(
  {
    eventId:      { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status:       { type: String, enum: ["registered", "attended", "cancelled"], default: "registered", required: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

rsvpSchema.index({ userId: 1, eventId: 1 }, { unique: true });
rsvpSchema.index({ eventId: 1, status: 1 });
rsvpSchema.index({ eventId: 1, registeredAt: -1 });

export default mongoose.model("RSVP", rsvpSchema);
