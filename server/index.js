import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import clubRoutes from "./routes/clubs.js";
import eventRoutes from "./routes/events.js";
import chatRoutes from "./routes/chats.js";
import messageRoutes from "./routes/messages.js";
import externalEventRoutes from "./routes/externalEvents.js";
import bookmarkRoutes from "./routes/bookmarks.js";
import userRoutes from "./routes/users.js";
import errorHandler from "./middleware/errorHandler.js";

// ── Must run before anything that depends on env vars ──
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.set("io", io);

// ── Middlewares ──
app.use(cors());
app.use(express.json());

// ── Health check ──
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ── API Routes ──
app.use("/api/auth",           authRoutes);
app.use("/api/clubs",          clubRoutes);
app.use("/api/events",         eventRoutes);
app.use("/api/chats",          chatRoutes);
app.use("/api/messages",       messageRoutes);
app.use("/api/external-events", externalEventRoutes);
app.use("/api/bookmarks",      bookmarkRoutes);
app.use("/api/users",          userRoutes);  // user profile routes

io.use((socket, next) => {
  try {
    const tokenFromAuth = socket.handshake.auth?.token;
    const bearer = socket.handshake.headers?.authorization;
    const tokenFromHeader = bearer?.startsWith("Bearer ")
      ? bearer.split(" ")[1]
      : null;
    const token = tokenFromAuth || tokenFromHeader;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id, roles: decoded.roles || [] };
    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("chat:join", (chatId) => {
    if (chatId) socket.join(`chat:${chatId}`);
  });

  socket.on("chat:leave", (chatId) => {
    if (chatId) socket.leave(`chat:${chatId}`);
  });
});

// Error handler (MUST BE LAST)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
