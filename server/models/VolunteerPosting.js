import mongoose from "mongoose";

/**
 * VolunteerPosting — a dedicated model for volunteering opportunities.
 * These are separate from Event volunteers (event.volunteers[]) and represent
 * standalone opportunities that may or may not be tied to a specific event.
 */
const volunteerPostingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 3000,
    },

    // Who posted this opportunity
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Optional — tie to an event or a club
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },

    // Logistics
    venue: {
      type: String,
      default: "TBD",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    duration: {
      type: String,
      default: null,   // e.g. "3 hours", "full day"
    },

    // Skill requirements  (optional tags)
    skillsNeeded: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      enum: ["teaching", "tech", "logistics", "design", "outreach", "management", "other"],
      default: "other",
    },

    // How many slots are open
    slots: {
      type: Number,
      default: null,   // null = unlimited
      min: 1,
    },

    status: {
      type: String,
      enum: ["open", "filled", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

// Indexes
volunteerPostingSchema.index({ status: 1, date: 1 });
volunteerPostingSchema.index({ postedBy: 1 });
volunteerPostingSchema.index({ clubId: 1 });
volunteerPostingSchema.index({ category: 1 });

export default mongoose.model("VolunteerPosting", volunteerPostingSchema);
