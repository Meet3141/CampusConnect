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
          // Only validate future date for NEW documents.
          return this.isNew ? v > new Date() : true;
        },
        message: "Event date must be in the future",
      },
    },

    venue: {
      type: String,
      required: [true, "Event venue is required"],
    },


    maxAttendees: {
      type: Number,
      default: null,
    },

    // ── Volunteer Programme ────────────────────────────────────────────────
    // Set by admin/coordinator when creating/editing the event.
    // When showOnVolunteerHub=true and volunteerLimit>0,
    // the event appears on the Volunteer Hub until accepted count >= limit.

    showOnVolunteerHub: {
      type: Boolean,
      default: false,      // admin must explicitly opt-in
    },

    volunteerLimit: {
      type: Number,
      default: null,       // null or 0 = no limit defined
    },

    volunteerSkillsNeeded: {
      type: [String],
      default: [],         // e.g. ["Photography", "Stage Setup", "MCing"]
    },

    // Application-based volunteer list
    volunteers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        skills: {
          type: [String],
          default: [],
        },
        // pending → waiting for admin review
        // accepted → confirmed volunteer
        // rejected → declined
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
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
    ],
    // ── End Volunteer Programme ────────────────────────────────────────────

    image: {
      type: String,
      default: null,
    },

    
    // draft          → created by coordinator, awaiting admin approval
    // pending_approval → coordinator explicitly submitted for review
    // upcoming      → approved and public
    status: {
      type: String,
      enum: ["draft", "pending_approval", "upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
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


eventSchema.index({ clubId: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ "attendees.userId": 1 });
eventSchema.index({ date: 1, clubId: 1 });
eventSchema.index({ showOnVolunteerHub: 1, status: 1 });

export default mongoose.model("Event", eventSchema);
