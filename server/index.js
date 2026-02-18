import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import clubRoutes from "./routes/clubs.js";
import eventRoutes from "./routes/events.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();
connectDB();

const app = express();


app.use(cors());
app.use(express.json());

<<<<<<< HEAD
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use(errorHandler);

=======
>>>>>>> e95542e16a2f21754124c69c93057f396060942c
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/auth", authRoutes);

// Error handler must be LAST middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
