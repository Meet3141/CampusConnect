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
          return v > new Date();
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    attendees: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["registered", "attended", "cancelled"],
          default: "registered",
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],


    volunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],


    image: {
      type: String,
      default: null,
    },

    
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
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

export default mongoose.model("Event", eventSchema);
