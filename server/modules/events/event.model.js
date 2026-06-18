import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
      maxlength: 2000,
    },

    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },

    category: {
      type: String,
      enum: ["hackathon", "workshop", "webinar", "cultural", "sports", "meeting"],
      required: true,
    },

    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: function (v) {
          return this.isNew ? v > new Date() : true;
        },
        message: "Event date must be in the future",
      },
    },

    endDate: {
      type: Date,
      default: null,
    },

    venue: {
      type: String,
      required: [true, "Event venue is required"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    maxAttendees: {
      type: Number,
      default: null,
    },

    showOnVolunteerHub: {
      type: Boolean,
      default: false,
    },

    volunteerLimit: {
      type: Number,
      default: null,
    },

    volunteerSkillsNeeded: {
      type: [String],
      default: [],
    },

    image: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "pending_approval", "upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },

    // Denormalized counter — updated via $inc on RSVP/cancel.
    // Source of truth: RSVP.countDocuments({ eventId, status: 'registered' })
    rsvpCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Attendance tracking counters
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    attendedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    noShowCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    onSpotCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Attendance policy configuration
    attendancePolicy: {
      type: {
        countWarnings: { type: Boolean, default: false },
        allowGraceReview: { type: Boolean, default: true },
        strictAttendance: { type: Boolean, default: false },
        requiresQR: { type: Boolean, default: false },
        manualCheckIn: { type: Boolean, default: true },
        gracePeriodMinutes: { type: Number, default: 15 },
        noShowThreshold: { type: Number, default: 2 },
        warningLimit: { type: Number, default: 3 },
      },
      default: {},
    },

    // Prevents duplicate Morning Digest emails (set atomically via findOneAndUpdate)
    remindersSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

eventSchema.index({ clubId: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ date: 1, clubId: 1 });
eventSchema.index({ showOnVolunteerHub: 1, status: 1 });
eventSchema.index({ date: 1, remindersSent: 1 });

export default mongoose.model("Event", eventSchema);