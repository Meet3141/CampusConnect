import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./modules/auth/auth.routes.js";
import clubRoutes from "./modules/clubs/club.routes.js";
import eventRoutes from "./modules/events/event.routes.js";
import { chatRouter as chatRoutes, messageRouter as messageRoutes } from "./modules/chat/chat.routes.js";
import externalEventRoutes from "./modules/external-events/external-event.routes.js";
import bookmarkRoutes from "./modules/bookmarks/bookmark.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import volunteerRoutes from "./modules/volunteers/volunteer.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./middleware/logger.js";
import { startScheduler } from "./jobs/scheduler.js";

// ── Must run before anything that depends on env vars ──
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGIN =
  process.env.CORS_ORIGIN ||
  process.env.ALLOWED_ORIGIN ||
  "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

// ── Compression (gzip all responses ≥ 1KB) ──
app.use(compression());

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

// ── Request Logging (morgan → winston) ──
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === "/",   // skip health-check noise
  })
);

// ── Rate Limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // max 10 auth requests/min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth requests — try again in a minute." },
});

const eventsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,               // 60 event requests/min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — slow down." },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,               // 30 chat requests/min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many chat requests — slow down." },
});

// ── Health check ──
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ── API Routes ──
app.use("/api/auth",            authLimiter,   authRoutes);
app.use("/api/clubs",                          clubRoutes);
app.use("/api/events",          eventsLimiter, eventRoutes);
app.use("/api/chats",           chatLimiter,   chatRoutes);
app.use("/api/messages",        chatLimiter,   messageRoutes);
app.use("/api/external-events",                externalEventRoutes);
app.use("/api/bookmarks",                      bookmarkRoutes);
app.use("/api/users",                          userRoutes);
app.use("/api/volunteers",                     volunteerRoutes);

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

// ── Background Jobs ──
startScheduler();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});
