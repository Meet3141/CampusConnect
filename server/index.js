import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
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
import volunteerRoutes from "./routes/volunteers.js";
import errorHandler from "./middleware/errorHandler.js";

// ── Must run before anything that depends on env vars ──
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

// ── Security & Parsing Middlewares ──
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    credentials: true,            // allow cookies to be sent cross-origin
  })
);
app.use(cookieParser());           // Parse HttpOnly cookies before routes
app.use(express.json());
// Express 5 compatibility: req.query is a read-only getter in Express 5,
// so we cannot use app.use(mongoSanitize()) directly — it tries to reassign req.query.
// Instead, sanitize req.body and req.params manually (these remain writable).
app.use((req, res, next) => {
  if (req.body)   req.body   = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// ── Health check ──
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ── API Routes ──
app.use("/api/auth",            authRoutes);
app.use("/api/clubs",           clubRoutes);
app.use("/api/events",          eventRoutes);
app.use("/api/chats",           chatRoutes);
app.use("/api/messages",        messageRoutes);
app.use("/api/external-events", externalEventRoutes);
app.use("/api/bookmarks",       bookmarkRoutes);
app.use("/api/users",           userRoutes);
app.use("/api/volunteers",      volunteerRoutes);

// ── Socket.IO: Auth via cookie or Bearer header ──
io.use((socket, next) => {
  try {
    // Try cookie first (when browser client connects via polling)
    const cookieHeader = socket.handshake.headers?.cookie || "";
    const cookieToken = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    // Fallback: auth.token (Socket.IO handshake auth object)
    const bearer = socket.handshake.headers?.authorization;
    const bearerToken = bearer?.startsWith("Bearer ")
      ? bearer.split(" ")[1]
      : null;

    const authToken = socket.handshake.auth?.token;

    const token = cookieToken || authToken || bearerToken;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id, roles: decoded.roles || [] };
    return next();
  } catch {
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
