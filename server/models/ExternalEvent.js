import mongoose from "mongoose";

const externalEventSchema = new mongoose.Schema(
  {
    
    title: {
      type: String,
      required: [true, "Event title is required"],
      maxlength: 200,
    },

    description: {
      type: String,
      maxlength: 2000,
    },

  
    universityName: {
      type: String,
      required: [true, "University name is required"],
    },

    venue: String,


    category: {
      type: String,
      enum: [
        "hackathon",
        "workshop",
        "webinar",
        "cultural",
        "sports",
        "conference",
        "competition",
      ],
      required: true,
    },

 
    date: {
      type: Date,
      required: true,
    },

   
    registrationLink: {
      type: String,
      required: [true, "Registration link is required"],
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: "Must be a valid URL",
      },
    },

    registrationDeadline: Date,

  
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verificationDate: Date,


    image: {
      type: String,
      default: null,
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

externalEventSchema.index({ isVerified: 1 });
externalEventSchema.index({ category: 1 });
externalEventSchema.index({ createdBy: 1 });
externalEventSchema.index({ date: 1 });
externalEventSchema.index({ universityName: 1 });

export default mongoose.model("ExternalEvent", externalEventSchema);
