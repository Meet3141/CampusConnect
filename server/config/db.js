import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MongoDB connection failed: MONGO_URI is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (error?.message?.includes("querySrv ENOTFOUND")) {
      console.error(
        "Tip: Your Atlas hostname is invalid. Use the full host from Atlas, e.g. mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/campusDB?retryWrites=true&w=majority"
      );
    }
    process.exit(1);
  }
};

export default connectDB;
