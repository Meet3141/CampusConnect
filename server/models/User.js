import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
      // No regex match here — raw password is validated in the controller,
      // this field stores the bcrypt hash after the pre-save hook.
    },

    // DB stores an array of role strings (e.g. ["member"], ["clubAdmin","editor"])
    roles: {
      type: [String],
      enum: ["member", "clubAdmin", "editor", "orgAdmin"],
      default: ["member"],
    },

    interests: {
      type: [String],
      default: [],
    },

    joinedClubs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],
      default: [],
    },

    profilePicture: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },

    phone: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});


userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};


userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);
