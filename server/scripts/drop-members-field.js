import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);
const r = await mongoose.connection.db
  .collection("clubs")
  .updateMany({}, { $unset: { members: "" } });
console.log("Cleaned members[] from", r.modifiedCount, "clubs");
await mongoose.disconnect();
