import mongoose from "mongoose";

const rsvpSchema = new mongoose.Schema(
  {
    eventId:      { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status:       { type: String, enum: ["registered", "attended", "cancelled"], default: "registered", required: true },
    registeredAt: { type: Date, default: Date.now },

    // Attendance tracking object
    attendance: {
      type: {
        attended: { type: Boolean, default: false },
        attendanceType: {
          type: String,
          enum: ["rsvp", "onSpot"],
          default: "rsvp",
        },
        attendanceMethod: {
          type: String,
          enum: ["qr", "manual", "api"],
          default: null,
        },
        manualOverride: {
          type: Boolean,
          default: false,
        },
        entryTime: { type: Date, default: null },
        exitTime: { type: Date, default: null },
        attendancePercentage: {
          type: Number,
          default: null,
          min: 0,
          max: 100,
        },
      },
      default: {},
    },
  },
  { timestamps: true }
);

rsvpSchema.index({ userId: 1, eventId: 1 }, { unique: true });
rsvpSchema.index({ eventId: 1, status: 1 });
rsvpSchema.index({ eventId: 1, registeredAt: -1 });

export default mongoose.model("RSVP", rsvpSchema);
