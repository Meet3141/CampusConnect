import mongoose from "mongoose";

const volunteerPostingSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, "Title is required"], trim: true, maxlength: 150 },
    description: { type: String, required: [true, "Description is required"], maxlength: 3000 },
    postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId:     { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    clubId:      { type: mongoose.Schema.Types.ObjectId, ref: "Club", default: null },
    venue:       { type: String, default: "TBD" },
    date:        { type: Date, required: [true, "Date is required"] },
    duration:    { type: String, default: null },
    skillsNeeded: { type: [String], default: [] },
    category:    { type: String, enum: ["teaching", "tech", "logistics", "design", "outreach", "management", "other"], default: "other" },
    slots:       { type: Number, default: null, min: 1 },
    status:      { type: String, enum: ["open", "filled", "closed"], default: "open" },
  },
  { timestamps: true }
);

volunteerPostingSchema.index({ status: 1, date: 1 });
volunteerPostingSchema.index({ postedBy: 1 });
volunteerPostingSchema.index({ clubId: 1 });
volunteerPostingSchema.index({ category: 1 });

export default mongoose.model("VolunteerPosting", volunteerPostingSchema);
