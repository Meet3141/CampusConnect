import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const RefreshToken = require("../models/RefreshToken.js").default;

mongoose.connect(process.env.MONGO_URI);

(async () => {
  try {
    console.log("🔄 Invalidating all refresh tokens...");
    const result = await RefreshToken.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} refresh tokens`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();