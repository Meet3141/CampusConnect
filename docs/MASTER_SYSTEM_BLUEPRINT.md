# CampusConnect — Master System Blueprint

> **Generated:** 2026-05-21  
> **Source of truth:** Live repository scan (`client/`, `server/`, `docs/`)  
> **Purpose:** Production-grade SRS, technical manifest, and implementation specification reverse-engineered from code — not placeholders.

---

## Document Map

| Section | Contents |
|---------|----------|
| §1 | Stack, topology, Axios/cookie auth, Vite resolution |
| §2 | Frontend boot, routing, guards, global state |
| §3 | Backend boot, middleware pipeline, security |
| §4 | Domain registry, all Mongoose schemas, dead-code matrix |
| §5 | Cron jobs, reconciliation, integrity rules |
| §6 | Design tokens, spacing, layout migration |

---

## §1. Technical Stack & Core Architecture Topology

### 1.1 Runtime platforms and pinned dependency versions

| Layer | Technology | Version (`package.json`) | Role |
|-------|------------|--------------------------|------|
| UI runtime | React | `^19.2.0` | Component tree, Context API |
| UI DOM | react-dom | `^19.2.0` | `createRoot` mount |
| Router | react-router-dom | `^7.13.0` | `BrowserRouter`, nested routes, guards |
| HTTP client | axios | `^1.13.5` | REST + interceptors |
| Realtime client | socket.io-client | `^4.8.1` | Chat rooms (`chatSocket.js`) |
| Build | Vite | `^7.2.4` | Dev server, HMR, production bundle |
| React plugin | @vitejs/plugin-react | `^5.1.1` | Fast Refresh |
| Compiler | babel-plugin-react-compiler | `^1.0.0` | Automatic memoization (enabled in `vite.config.js`) |
| CSS | Tailwind CSS | `^4.2.2` | Utility classes via `@tailwindcss/vite` `^4.2.1` |
| API server | Express | `^5.2.1` | HTTP API, middleware chain |
| ODM | Mongoose | `^9.1.5` | Schemas, validation, indexes |
| Database | MongoDB (Atlas URI via `MONGO_URI`) | — | Document store |
| Realtime server | socket.io | `^4.8.1` | JWT handshake, chat rooms |
| Auth | jsonwebtoken `^9.0.3`, bcryptjs `^3.0.3`, cookie-parser `^1.4.7` | — | JWT access + refresh rotation |
| Scheduling | node-cron `^4.2.1` | — | Background reconciliation |
| Cache | node-cache `^5.1.2` | — | Club/event response cache (`server/utils/cache.js`) |
| Logging | winston `^3.19.0`, morgan `^1.10.1` | — | Structured logs |
| Hardening | express-mongo-sanitize, express-rate-limit, compression, cors | — | Security + performance |

**Module system:** Both `client/` and `server/` use ES modules (`"type": "module"`).

**Docker:** `server/Dockerfile` uses `node:20-alpine` for production images.

### 1.2 End-to-end communication topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Browser (Vite dev :5173 or static build)                                     │
│  index.html → main.jsx → App.jsx                                             │
│    ToastProvider → AuthProvider → BrowserRouter                              │
│    api.js (axios, baseURL /api, withCredentials: true)                     │
│    chatSocket.js (socket.io, withCredentials: true)                          │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTPS/HTTP
                                │ Cookies: token (access JWT), refreshToken
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Express 5 (server/index.js, default PORT 5000)                               │
│  compression → cors(credentials) → cookieParser → json → mongoSanitize       │
│  morgan→winston → rate limits → /api/* routers → errorHandler (last)         │
│  http.Server + Socket.IO (same port, CORS origin = ALLOWED_ORIGIN)           │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ Mongoose
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ MongoDB Atlas (MONGO_URI) — 18 collections via Mongoose models               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Environment variables (operational):**

| Variable | Consumer | Purpose |
|----------|----------|---------|
| `MONGO_URI` | `config/db.js` | MongoDB connection; process exits if unset |
| `JWT_SECRET` | `auth.js`, Socket.IO, `generateToken.js` | Sign/verify access tokens |
| `PORT` | `index.js` | HTTP listen port (default `5000`) |
| `NODE_ENV` | cookies, error stack, logger | `production` → `Secure`/`Strict` cookies |
| `CORS_ORIGIN` / `ALLOWED_ORIGIN` | CORS + Socket.IO | Default `http://localhost:5173` |
| `TRUST_PROXY` | `index.js` | `1` or `true` → `app.set("trust proxy", 1)` |
| `RATE_LIMIT_WHITELIST` | rate limiters | Comma-separated IPs skip limits |
| `VITE_API_BASE_URL` | `client/src/services/api.js` | API host (default `http://localhost:5000`) |
| `VITE_SOCKET_URL` | `client/src/services/chatSocket.js` | Socket host (default `http://localhost:5000`) |

### 1.3 Axios client (`client/src/services/api.js`)

**Instance configuration:**

```javascript
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});
```

- Every request automatically sends HttpOnly cookies (`token`, `refreshToken` on refresh path).
- No manual `Authorization` header in normal browser flows; backend `auth.js` reads `req.cookies.token` first, then `Authorization: Bearer` as fallback.

**401 silent refresh queue (exact behavior):**

| State variable | Purpose |
|----------------|---------|
| `isRefreshing` | Mutex: only one refresh runs at a time |
| `failedQueue` | Array of `{ resolve, reject }` for requests that arrived during refresh |
| `originalRequest._retry` | Prevents infinite retry loops on the same config |

**Algorithm:**

1. Response interceptor receives error; proceeds only if `error.response?.status === 401`, `!originalRequest._retry`, and URL is not in skip list.
2. **Skip list** (no refresh attempt): `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh-token`.
3. **`/auth/verify` is intentionally not skipped** — session check can trigger refresh like any other API call.
4. If `isRefreshing === true`: push promise onto `failedQueue`; on `processQueue(null)` resolve, retry `api(originalRequest)`.
5. If not refreshing: set `_retry = true`, `isRefreshing = true`, `POST ${API_BASE_URL}/api/auth/refresh-token` with `{ withCredentials: true }` (standalone axios, not `api` instance — avoids interceptor recursion).
6. On success: `processQueue(null)`, retry original request (new access cookie set by server).
7. On failure: `processQueue(refreshError)`, `window.location.href = "/login"`, reject.
8. `finally`: `isRefreshing = false`.

**Backend alignment (`server/modules/auth/auth.service.js`):**

| Cookie | Name | Path | maxAge | Payload |
|--------|------|------|--------|---------|
| Access JWT | `token` | `/` (default) | 15 minutes | `{ id, roles }` via `generateToken` |
| Refresh token | `refreshToken` | `/api/auth/refresh-token` | 30 days | Opaque hex string in `RefreshToken` collection |

Refresh rotation: mark old token `used: true`, issue new refresh; **reuse detection** deletes all refresh tokens for user and clears cookies.

### 1.4 Vite compile-time path resolution

**Current `client/vite.config.js` (verified):**

- Plugins: `@vitejs/plugin-react` (with React Compiler babel plugin), `@tailwindcss/vite`.
- `server.fs.allow`: `[path.resolve(__dirname, '..')]` — allows reading assets one level above `client/` (monorepo root).
- **No `resolve.alias` entries** for `@app`, `@features`, `@components`, or `@services`.

**Actual import convention:** Relative paths from feature modules, e.g. `../../../context/AuthContext`, `../../services/api`.

**Note:** The scope document references alias-based path breaking prevention; that system is **not implemented** in the current Vite config. Adding aliases would require:

```javascript
resolve: {
  alias: {
    '@app': path.resolve(__dirname, 'src/app'),
    '@features': path.resolve(__dirname, 'src/features'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@services': path.resolve(__dirname, 'src/services'),
  },
},
```

`client/src/app/` directory does not exist; features live under `client/src/features/`.

---

## §2. Comprehensive Frontend Specifications & Working

### 2.1 Runtime startup execution vector

| Step | File | Action |
|------|------|--------|
| 1 | `client/index.html` | Loads `#root`, meta viewport, favicon `/depstar_svg.svg`, title `CampusConnect` |
| 2 | `<script type="module" src="/src/main.jsx">` | ES module entry |
| 3 | `client/src/main.jsx` | Imports `./index.css` (Tailwind + tokens + components), `App.jsx`; `createRoot(#root).render(<StrictMode><App /></StrictMode>)` |
| 4 | `client/src/App.jsx` | Mounts providers and router (see §2.2) |

**CSS load order in `index.css`:**

```css
@import "tailwindcss";
@import "./styles/tokens.css";
@import "./styles/components.css";
```

### 2.2 Routing hierarchy and provider composition (`App.jsx`)

**Provider nesting (outer → inner):**

```
ToastProvider
  └── AuthProvider
        └── BrowserRouter
              ├── ToastViewport (fixed toast UI)
              └── Routes
```

**Route table:**

| Path | Guard | Layout / Page |
|------|-------|----------------|
| `/` | — | `<Navigate to="/login" replace />` |
| `/login` | — | `Login` |
| `/register` | — | `Register` |
| *authenticated shell* | `ProtectedRoute` → `AppLayout` (`<Outlet />`) | See below |
| `*` | — | `NotFound` |

**Inside `ProtectedRoute` + `AppLayout`:**

| Path | Extra guard | Component |
|------|-------------|-----------|
| `/dashboard` | — | `Dashboard` |
| `/my-clubs` | — | `MyClubs` |
| `/clubs` | — | `ClubList` |
| `/clubs/create` | `RoleRoute` `clubAdmin`, `orgAdmin` | `CreateClub` |
| `/clubs/:id/edit` | `RoleRoute` `clubAdmin`, `orgAdmin` | `EditClub` |
| `/clubs/:id` | — | `ClubDetail` |
| `/events/create` | `RoleRoute` `clubAdmin`, `orgAdmin` | `CreateEvent` |
| `/events` | — | `Events` |
| `/events/:id/edit` | `RoleRoute` `clubAdmin`, `orgAdmin` | `EditEvent` |
| `/events/:eventId/attendance` | `RoleRoute` `clubAdmin`, `orgAdmin` | `AttendanceManagement` |
| `/events/:id` | — | `EventDetail` |
| `/external-events/create` | — | `CreateExternalEvent` |
| `/external-events/:id/edit` | — | `CreateExternalEvent` (`editMode`) |
| `/external-events/:id` | — | `ExternalEventDetail` |
| `/external-events` | — | `ExternalEvents` |
| `/bookmarks` | — | `Bookmarks` |
| `/chats` | — | `ChatList` |
| `/chats/:id` | — | `ChatRoom` |
| `/volunteers` | — | `VolunteerHub` |
| `/profile` | — | `Profile` |
| `/users/:id` | — | `UserProfile` |
| `/admin/verify` | `RoleRoute` `editor`, `orgAdmin` | `VerifyEvents` |
| `/admin/reviews` | `RoleRoute` `clubAdmin`, `orgAdmin` | `ReviewDashboard` |
| `/admin/stats` | `RoleRoute` `orgAdmin` | `AdminStats` |
| `/admin` | `AdminRoute` | `AdminPanel` |

**Route ordering rule:** Static paths (`/clubs/create`, `/events/create`, `/external-events/create`) are registered **before** dynamic `:id` routes to prevent param capture.

### 2.3 Route guards — programmatic behavior

#### `ProtectedRoute.jsx`

1. Reads `{ user, loading, error }` from `useAuth()`.
2. `loading === true` → full-screen indigo spinner (`min-h-screen`).
3. `error && !user` → session error card with message and button → `window.location.href = "/login"`.
4. `user` truthy → render `children`.
5. Else → `<Navigate to="/login" replace />`.

Does **not** check roles; only authenticated session.

#### `AdminRoute.jsx`

1. `loading` → amber spinner (`py-20`).
2. No `user` → `/login`.
3. `!user.roles?.includes("orgAdmin")` → silent redirect `/dashboard` (prevents admin UI flash).
4. Else → `children`.

Used only for `/admin` (`AdminPanel`). `/admin/stats` uses `RoleRoute` with `orgAdmin` instead.

#### `RoleRoute.jsx`

1. `loading` → indigo spinner.
2. No `user` → `/login`.
3. `hasRole(user, ...roles)` from `utils/roles.js` — true if **any** role in `user.roles` matches **any** passed role.
4. Fail → `/dashboard`.
5. Else → `children`.

**`hasRole` implementation:**

```javascript
export const hasRole = (user, ...roles) =>
  roles.some((r) => user?.roles?.includes(r));
```

### 2.4 Global state mechanisms

#### `AuthContext.jsx`

| Property / method | Type | Behavior |
|-------------------|------|----------|
| `user` | `object \| null` | Populated from login/verify; `user.toJSON()` shape from API (no password) |
| `setUser` | function | Direct state update (rare use) |
| `loading` | boolean | `true` until initial `verify()` completes |
| `error` | string \| null | Set on verify failure |
| `login(email, password)` | async | `POST /auth/login` → `setUser(res.data.user)` |
| `logout()` | async | `POST /auth/logout` (errors swallowed) → `setUser(null)` |
| `verify()` | async | `GET /auth/verify` on mount — drives session restore |

**Mount effect:** `useEffect(() => { verify(); }, [])` — triggers cookie-based session restore; may chain through Axios 401 interceptor → refresh → retry verify.

#### `ToastContext.jsx`

| API | Behavior |
|-----|----------|
| `toasts` | Array `{ id, type, message }` |
| `success/error/info(message)` | `push(type, message)` |
| `dismiss(id)` | Filter out toast |
| Auto-dismiss | `setTimeout(..., 3500)` per toast |

`ToastViewport` subscribes via `useToast()` and renders stacked notifications.

#### `AppLayout.jsx` (layout state)

- Sidebar navigation from `navigationConfig.js` + `getAdminNav({ isAdmin, isEditor, isClubAdmin })`.
- Notification dropdown: `fetchNotifications(6)`, `markNotificationRead`, `markAllNotificationsRead` from `features/admin/api.js`.
- Theme toggle in header (`ThemeToggle`).
- Main content: React Router `<Outlet />`.

### 2.5 Frontend directory structure (actual)

There is **no** `client/src/app/` folder. Code is organized as:

```
client/src/
├── App.jsx, main.jsx, index.css
├── components/     layout/, ui/
├── context/        AuthContext, ToastContext
├── features/       auth, clubs, events, chat, users, volunteers, admin, dashboard, common
├── hooks/          useParticleCanvas.js
├── routes/         ProtectedRoute, AdminRoute, RoleRoute
├── services/       api.js, chatSocket.js
├── styles/         tokens.css, components.css
├── theme/          clubs.js, events.js, index.js, themeUtils.js
└── utils/          roles.js, inputCls.js
```

Each feature typically contains `pages/`, `api.js`, and optional `hooks.js`, `ui/`.

---

## §3. Comprehensive Backend Specifications & Working

### 3.1 Server runtime initialization (`server/index.js`)

**Sequential boot:**

1. `dotenv.config()` — load `.env`.
2. `connectDB()` — async Mongoose connect; exit(1) on failure.
3. `express()` + `http.createServer(app)`.
4. Optional `trust proxy` if `TRUST_PROXY` set.
5. `Socket.IO` attached to same HTTP server; `app.set("io", io)`.
6. Global middleware (order fixed):
   - `compression()`
   - `cors({ origin: ALLOWED_ORIGIN, credentials: true })`
   - `cookieParser()`
   - `express.json()`
   - Custom `mongoSanitize` on `req.body` and `req.params` only (Express 5 `req.query` is read-only)
   - `morgan` → winston stream; skip `GET /`
7. Rate limiters: `authLimiter` (10/min), `eventsLimiter` (60/min), `chatLimiter` (30/min) with optional IP whitelist.
8. `GET /` health string.
9. Mount API routers (see §4).
10. Socket.IO middleware: JWT from cookie `token=`, or `handshake.auth.token`, or `Authorization: Bearer`.
11. Socket events: `chat:join`, `chat:leave` → rooms `chat:${chatId}`.
12. **`errorHandler`** — must be last Express middleware.
13. `startScheduler()` — cron jobs (§5).
14. `server.listen(PORT)`.

**Important:** Socket.IO connection handler does **not** emit chat messages itself; message emits happen in `chat.controller.js` via `req.app.get("io")`.

### 3.2 Express HTTP request pipeline

For a typical authenticated API call:

```
Incoming request
  → compression
  → cors (may short-circuit preflight)
  → cookieParser (populates req.cookies)
  → express.json() (req.body)
  → mongoSanitize(body, params)
  → morgan log
  → route-level rate limiter (auth/events/chat only on mount path)
  → module router
       → auth middleware (if required) → req.user = { id, roles }
       → authorize(...) roleCheck (if required)
       → requireClubPermission(...) coordinatorCheck (if required)
       → asyncHandler(controller) → try/catch → next(err)
  → errorHandler (if error thrown)
```

### 3.3 Middleware reference

#### `auth.js`

- Token sources (priority): `req.cookies.token`, then `Authorization: Bearer <token>`.
- `jwt.verify(token, JWT_SECRET)` → `req.user = { id: decoded.id, roles: decoded.roles || [] }`.
- 401 responses: missing token, `TokenExpiredError`, other JWT errors.

#### `roleCheck.js` (`authorize`)

- Factory: `authorize("clubAdmin", "orgAdmin")` returns middleware.
- Requires `req.user`; 401 if missing.
- 403 if no overlap between `req.user.roles` and `allowedRoles`.

#### `coordinatorCheck.js` (`requireClubPermission`)

- Permission constants in `COORDINATOR_PERMISSIONS` set: `event.create`, `event.edit`, `event.manage_registrations`, `event.mark_attendance`, `announcement.create`, `member.view`.
- **Bypass order:** `orgAdmin` → club `adminId === req.user.id` → coordinator membership (`status: approved`, `clubRole: coordinator`) for allowed permissions only.
- Admin-only permissions (coordinator blocked): e.g. `event.publish`, `coordinator.assign`.
- On success attaches `req.membership`, `req.resolvedClubId`, `req.resolvedClub`.

#### `optionalAuth.js`

- Only parses `Authorization: Bearer` — **does not read cookies**.
- Invalid token ignored; request continues without `req.user`.
- Used on `GET /api/external-events/:id` for role-aware responses.

#### `asyncHandler.js`

```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

Forwards async rejections to `errorHandler`.

#### `errorHandler.js`

| Condition | statusCode | message shaping |
|-----------|------------|-----------------|
| `err.statusCode` | as set | `err.message` |
| `ValidationError` | 400 | joined Mongoose field messages |
| `code === 11000` | 409 | duplicate key field name |
| `CastError` | 400 | invalid ObjectId path |
| `JsonWebTokenError` | 401 | Invalid token |
| `TokenExpiredError` | 401 | Token expired |
| default | 500 | Internal Server Error |
| `NODE_ENV === development` | — | includes `stack` in JSON |

Response shape: `{ success: false, message, stack? }`.

### 3.4 Database connection (`config/db.js`)

- Requires `process.env.MONGO_URI`.
- `mongoose.connect(MONGO_URI)`; logs success or exits with Atlas SRV troubleshooting hint on `querySrv ENOTFOUND`.

---

## §4. Granular Domain Module Registry & Implementation Schemas

### 4.1 Domain-to-frontend-to-backend mapping

#### Auth

| Frontend | API wrapper | Backend route | Controller / service |
|----------|-------------|---------------|------------------------|
| `Login.jsx`, `Register.jsx` | `auth/api.js`, `AuthContext` | `POST /api/auth/register` | `auth.controller` → `auth.service.register` |
| | | `POST /api/auth/login` | `auth.service.login` |
| | | `POST /api/auth/logout` | `auth.service.logout` |
| | | `GET /api/auth/verify` | `auth` + `verify` |
| | | `POST /api/auth/refresh-token` | `rotateRefreshToken` |
| `api.js` interceptor | direct axios POST | same refresh route | |

#### Users

| Frontend | API | Backend |
|----------|-----|---------|
| `Profile.jsx` | `GET/PATCH /users/profile` | `user.controller` → `user.service` |
| `UserProfile.jsx` | `GET /users/:id` | `getPublicProfile` |
| — *(no UI)* | `PATCH /users/:id/roles` | `updateRoles` (orgAdmin only) |

#### Clubs

| Frontend | API (`features/clubs/api.js`) | Backend (`/api/clubs`) |
|----------|-------------------------------|------------------------|
| `ClubList.jsx` | `GET /clubs` | `getClubs` |
| `MyClubs.jsx` | `GET /clubs/mine` | `getMyClubs` |
| `ClubDetail.jsx` | `GET /clubs/:id`, members, announcements, join/leave, coordinator, events | matching controller exports |
| `CreateClub.jsx` | `POST /clubs` | `createClub` + `authorize(clubAdmin, orgAdmin)` |
| `EditClub.jsx` | `PUT /clubs/:id` | `updateClub` |
| `AdminPanel.jsx` | `DELETE /clubs/:id` | `deleteClub` (orgAdmin) |

#### Events (internal)

| Frontend | API (`features/events/api.js`) | Backend (`/api/events`) |
|----------|-------------------------------|-------------------------|
| `Events.jsx`, `Dashboard` | `GET /events` | `getEvents` |
| `EventDetail.jsx` | RSVP, volunteer, grace, publish, lifecycle | full `event.controller` surface |
| `CreateEvent.jsx`, `EditEvent.jsx` | `POST/PUT /events` | `createEvent`, `updateEvent` |
| `AttendanceManagement.jsx` | `GET attendees`, `POST attendance` | `getAttendees`, `markAttendance` |
| `ReviewDashboard.jsx` | `GET /events/reviews`, review/grace endpoints | `getReviewDashboard`, `reviewGraceRequest`, etc. |
| `VolunteerHub.jsx` | `GET /events/volunteer-feed` | `getVolunteerEvents` |

#### External events

| Frontend | API | Backend (`/api/external-events`) |
|----------|-----|--------------------------------|
| `ExternalEvents.jsx`, `ExternalEventDetail.jsx` | CRUD + list | `getExternalEvents`, `getExternalEventById`, etc. |
| `CreateExternalEvent.jsx` | `POST /`, `POST /ocr/extract` | `createExternalEvent`, `extractFromPoster` |
| `VerifyEvents.jsx`, `AdminPanel` tabs | `PATCH /:id/verify` | `verifyExternalEvent` + `authorize(editor, orgAdmin)` |

#### Bookmarks

| Frontend | API | Backend (`/api/bookmarks`) |
|----------|-----|----------------------------|
| `Bookmarks.jsx`, `Dashboard` | `GET/POST/DELETE` | `listBookmarks`, `addBookmark`, `removeBookmark` |

#### Chat & messages

| Frontend | API | Backend |
|----------|-----|---------|
| `ChatList.jsx` | `/api/chats` | `chat.controller` chat handlers |
| `ChatRoom.jsx` | `/api/messages/*` + Socket.IO | `sendMessage` emits `message:new`, etc. |

**Socket events (server → client):** `message:new`, `message:updated`, `message:deleted`, `message:reacted` to room `chat:${chatId}`.

**Client socket:** `connectChatSocket()`, `joinChatRoom(chatId)`, `onChatEvent(name, handler)`.

#### Volunteers (two subsystems)

| Subsystem | Frontend | Backend |
|-----------|----------|---------|
| **Event-embedded volunteers** | `VolunteerHub.jsx`, `EventDetail` volunteer panel | `/api/events/:id/volunteer*`, `VolunteerApplication` model |
| **Volunteer postings** | *No frontend consumer* | `/api/volunteers/*`, `VolunteerPosting`, `VolunteerPostingApplication` models |

#### Admin (composite — no `server/modules/admin`)

| Frontend page | APIs used |
|---------------|-----------|
| `AdminPanel.jsx` | `/clubs`, `/clubs/:id/members`, `DELETE /clubs/:id` |
| `AdminStats.jsx` | Parallel stats fetches in `admin/api.js` |
| `VerifyEvents.jsx` | `/external-events` + verify patch |
| `ReviewDashboard.jsx` | `/events/reviews`, grace/attendance review posts |
| `AppLayout` notifications | `/notifications` |

#### Notifications

| Frontend | Backend (`/api/notifications`, all routes `auth`) |
|----------|---------------------------------------------------|
| `AppLayout` dropdown | `GET /`, `PATCH /:id/read`, `PATCH /read-all` |

### 4.2 Mongoose schema registry (all 18 models)

#### `User` — `server/modules/users/user.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | String | required, trim, min 2, max 50 |
| `email` | String | required, unique, lowercase, regex email |
| `password` | String | required, min 8, `select: false`, bcrypt pre-save |
| `roles` | [String] | enum: `member`, `clubAdmin`, `editor`, `orgAdmin`; default `["member"]` |
| `interests` | [String] | default `[]` |
| `profilePicture` | String | default null |
| `bio` | String | max 500 |
| `phone` | String | default null |
| `isVerified` | Boolean | default false |
| `missedEvents` | [ObjectId] | ref Event |
| `warningCount` | Number | min 0, default 0 |
| `graceUsed` | Boolean | default false |
| `isBlocked` | Boolean | default false |
| `blockedUntil` | Date | default null |
| `reviewRequired` | Boolean | default false |
| `disciplineStatus` | String | enum: `normal`, `warning`, `review`, `blocked` |
| timestamps | — | `createdAt`, `updatedAt` |

**Indexes:** `{ createdAt: -1 }`, `{ isBlocked: 1 }`  
**Methods:** `comparePassword`, `toJSON` (strips password)

#### `RefreshToken` — `server/modules/auth/refresh-token.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `token` | String | required, unique |
| `userId` | ObjectId | ref User, required |
| `expiresAt` | Date | required |
| `used` | Boolean | default false |

**Indexes:** TTL on `expiresAt` (`expireAfterSeconds: 0`), `{ userId: 1 }`  
**Static:** `generateTokenString()` → 64-byte hex

#### `Club` — `server/modules/clubs/club.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | String | required, unique, trim, max 100 |
| `description` | String | required, max 1000 |
| `category` | String | enum: technical, cultural, sports, academic, arts, other |
| `adminId` | ObjectId | ref User, required |
| `coverImage` | String | default null |
| `memberCount` | Number | default 0, min 0 (denormalized) |

**Indexes:** `adminId`, `category`, `createdAt`

#### `Membership` — `server/modules/clubs/membership.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `userId`, `clubId` | ObjectId | required |
| `status` | String | enum: pending, approved, rejected; default pending |
| `joinedAt` | Date | default now |
| `approvedBy`, `approvedAt` | ObjectId / Date | optional |
| `clubRole` | String | enum: member, coordinator; default member |
| `coordinatorCategory` | String | enum: event, content, technical, none; default none |
| `rejectCount` | Number | default 0 |
| `lastRejectedAt`, `blockedUntil` | Date | optional |

**Indexes:** unique `{ userId, clubId }`, `clubId`, `status`, `userId`

#### `Announcement` — `server/modules/clubs/announcement.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `clubId` | ObjectId | required |
| `title` | String | required, trim, max 120 |
| `body` | String | required, max 2000 |
| `postedBy` | ObjectId | required |
| `tag` | String | enum: general, event, reminder, urgent |
| `pinned` | Boolean | default false |

**Indexes:** `{ clubId, createdAt: -1 }`, `postedBy`

#### `Event` — `server/modules/events/event.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | String | required, max 200 |
| `description` | String | required, max 2000 |
| `clubId` | ObjectId | required |
| `category` | String | enum: hackathon, workshop, webinar, cultural, sports, meeting |
| `date` | Date | required; future-only on `isNew` |
| `endDate` | Date | optional |
| `venue` | String | required |
| `createdBy` | ObjectId | required |
| `maxAttendees` | Number | optional |
| `showOnVolunteerHub` | Boolean | default false |
| `volunteerLimit` | Number | optional |
| `volunteerSkillsNeeded` | [String] | default [] |
| `image` | String | optional |
| `status` | String | enum: draft, pending_approval, upcoming, ongoing, completed, cancelled |
| `rsvpCount` | Number | denormalized, min 0 |
| `registeredCount`, `attendedCount`, `noShowCount`, `onSpotCount` | Number | attendance counters |
| `attendancePolicy` | subdocument | countWarnings, allowGraceReview, strictAttendance, requiresQR, manualCheckIn, gracePeriodMinutes (15), noShowThreshold (2), warningLimit (3) |

**Indexes:** `clubId`, `date`, `category`, `createdBy`, `{ date, clubId }`, `{ showOnVolunteerHub, status }`

#### `RSVP` — `server/modules/events/rsvp.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `eventId`, `userId` | ObjectId | required |
| `status` | String | enum: registered, attended, cancelled |
| `registeredAt` | Date | default now |
| `attendance` | subdocument | attended, attendanceType (rsvp/onSpot), attendanceMethod (qr/manual/api), manualOverride, entryTime, exitTime, attendancePercentage 0–100 |

**Indexes:** unique `{ userId, eventId }`, `{ eventId, status }`, `{ eventId, registeredAt: -1 }`

#### `VolunteerApplication` (event-scoped) — `server/modules/events/volunteer-application.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `eventId`, `userId` | ObjectId | required |
| `skills` | [String] | default [] |
| `status` | String | enum: pending, accepted, rejected |
| `appliedAt`, `reviewedAt` | Date | — |

**Indexes:** unique `{ eventId, userId }`, `{ eventId, status }`, `{ userId, appliedAt: -1 }`

#### `GraceRequest` — `server/modules/events/grace-request.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `eventId`, `userId` | ObjectId | required |
| `reason` | String | required, max 1000 |
| `status` | String | enum: pending, approved, rejected |
| `reviewedBy`, `reviewedAt`, `facultyRemark` | — | optional |

**Indexes:** `{ eventId, userId, status }`, `{ status, createdAt: -1 }`

#### `ReviewHistory` — `server/modules/events/review-history.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `eventId`, `userId`, `performedBy` | ObjectId | required |
| `action` | String | enum: GRACE_APPROVED, GRACE_REJECTED, WARNING_REDUCED, STUDENT_BLOCKED |
| `role` | String | default orgAdmin |
| `reason` | String | default "" |

**Index:** `{ eventId, userId, createdAt: -1 }`

#### `ExternalEvent` — `server/modules/external-events/external-event.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | String | required, max 200 |
| `description` | String | max 2000 |
| `universityName` | String | required |
| `venue` | String | optional |
| `category` | String | enum includes conference, competition |
| `date` | Date | required |
| `registrationLink` | String | required, must match `^https?://` |
| `registrationDeadline` | Date | optional |
| `createdBy`, `verifiedBy` | ObjectId | — |
| `isVerified` | Boolean | default false |
| `verificationDate`, `image` | — | optional |

**Indexes:** `isVerified`, `category`, `createdBy`, `date`, `universityName`

#### `OCRCache` — `server/modules/external-events/ocr-cache.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `imageUrl` | String | required, unique |
| `imageHash` | String | unique |
| `extractedData` | object | title, date, venue, description, category, rawText |
| `confidence` | Number | default 0 |
| `processingTime` | Number | optional |
| `createdAt` | Date | TTL index 86400 seconds (24h) |

#### `Bookmark` — `server/modules/bookmarks/bookmark.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `userId` | ObjectId | required |
| `eventId` | ObjectId | required (no ref constraint) |
| `eventType` | String | enum: internal, external |
| `createdAt` | Date | indexed |

**Indexes:** unique `{ userId, eventId }`, `{ userId, createdAt: -1 }`

#### `Chat` — `server/modules/chat/chat.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `type` | String | enum: club, event |
| `referenceId` | ObjectId | required |
| `name` | String | required |
| `description` | String | optional |
| `participants` | [ObjectId] | ref User |
| `lastMessage`, `lastMessageTime`, `lastMessageSenderId` | — | denormalized preview |
| `isActive` | Boolean | default true |

**Indexes:** unique `{ type, referenceId }`, `participants`, `lastMessageTime`

#### `Message` — `server/modules/chat/message.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `chatId`, `senderId` | ObjectId | required |
| `message` | String | required, trim, max 5000 |
| `mediaUrl`, `mediaType` | String | enum image/video/file |
| `edited`, `editedAt`, `deleted` | — | soft edit/delete |
| `reactions` | [{ userId, emoji }] | — |
| `timestamp` | Date | indexed |

**Indexes:** `{ chatId, timestamp: -1 }`, `senderId`, `timestamp`, `chatId`

#### `Notification` — `server/modules/notifications/notification.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `userId` | ObjectId | required |
| `type` | String | enum: warning, review, grace_*, blocked, unblocked |
| `status` | String | enum: unread, read |
| `title` | String | max 120 |
| `message` | String | max 500 |
| `eventId` | ObjectId | optional |
| `readAt` | Date | optional |

**Indexes:** `{ userId, createdAt: -1 }`, `{ userId, readAt }`, `{ userId, status }`

#### `VolunteerPosting` — `server/modules/volunteers/volunteer-posting.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | String | required, max 150 |
| `description` | String | required, max 3000 |
| `postedBy` | ObjectId | required |
| `eventId`, `clubId` | ObjectId | optional links |
| `venue` | String | default TBD |
| `date` | Date | required |
| `duration` | String | optional |
| `skillsNeeded` | [String] | — |
| `category` | String | enum: teaching, tech, logistics, design, outreach, management, other |
| `slots` | Number | min 1 |
| `status` | String | enum: open, filled, closed |

**Indexes:** `{ status, date }`, `postedBy`, `clubId`, `category`

#### `VolunteerPostingApplication` — `server/modules/volunteers/volunteer-application.model.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `postingId`, `userId` | ObjectId | required |
| `message` | String | max 500 |
| `status` | String | enum: pending, accepted, rejected |
| `appliedAt`, `reviewedAt` | Date | — |

**Indexes:** unique `{ postingId, userId }`, `{ postingId, status }`, `{ userId, appliedAt: -1 }`

### 4.3 API response conventions

- Success: `{ success: true, data?, user?, message?, meta? }` where `meta` often holds pagination `{ total, page, limit, totalPages }`.
- Failure: `{ success: false, message }` via `errorHandler` or inline controller responses.

### 4.4 Dead Code Zone & Mismatch Matrix

| ID | Severity | Finding | Evidence | Recommended action |
|----|----------|---------|----------|-------------------|
| DC-01 | Medium | **Vite path aliases not configured** — `@app`, `@features`, `@components`, `@services` absent | `vite.config.js` has no `resolve.alias` | Add aliases or update docs/specs to match relative imports |
| DC-02 | Medium | **`client/src/app/` missing** — scope path unused | Directory does not exist | Use `client/src/features/` as canonical feature root |
| DC-03 | Low | **`docs/migration_guide.md` missing** | No file in repo | Layout migration guidance derived from `tokens.css`, `dashboard/ui/styles.js`, `AppLayout` (see §6) |
| DC-04 | Medium | **Pin announcement API unused in client** | Backend `PATCH /clubs/:id/announcements/:annId/pin`; `ClubDetail` displays `ann.pinned` but no client API/handler | Add `pinAnnouncement` to `clubs/api.js` + UI toggle for clubAdmin/orgAdmin |
| DC-05 | High | **`coordinatorCategory` sent but not persisted** | `clubs/api.js` POST body includes `coordinatorCategory`; `assignCoordinator` only sets `clubRole: "coordinator"` | Extend `assignCoordinator` to validate and save `coordinatorCategory` from body |
| DC-06 | High | **Volunteer Postings module has zero frontend** | Full `/api/volunteers` router + 2 models; `VolunteerHub` only uses `/events/volunteer-feed` | Build UI or remove/deprecate posting subsystem |
| DC-07 | Medium | **`PATCH /users/:id/roles` no admin UI** | `user.routes.js` + `updateRoles` service; no client call | Add role management to `AdminPanel` or document as API-only |
| DC-08 | Medium | **`optionalAuth` ignores cookies** | Only Bearer header parsed | Add cookie read for parity with `auth.js` on external event detail |
| DC-09 | Low | **`FormField` in CreateClub** — **resolved in current code** | `CreateClub.jsx` line 18 imports `FormField` correctly | Close; was historical defect |
| DC-10 | Low | **Announcements in ClubDetail** — **wired** | `fetchAnnouncements`, `createAnnouncement`, `deleteAnnouncement` used | Not dead; pin is the gap (DC-04) |
| DC-11 | Info | **`PROJECT_SPECIFICATIONS.md` stale** | States only auth is wired; app is fully feature-built | Prefer this blueprint over Feb 2026 auto-spec |
| DC-12 | Low | **Profile/UserProfile use inline styles** | Large `style={}` blocks vs Tailwind/`cc-*` tokens | Migrate to shared layout classes per §6 |
| DC-13 | Medium | **Root `package.json` legacy deps** | Express 4, Mongoose 7 at repo root vs Express 5/Mongoose 9 in `server/` | Clarify deploy path uses `server/package.json` only |

---

## §5. System Automation & Asynchronous Working Engines

### 5.1 Scheduler (`server/jobs/scheduler.js`)

**Library:** `node-cron` with `safeRun(name, fn)` wrapper — catches errors, logs via winston, does not crash process.

| Cron expression | Jobs executed | Frequency |
|-----------------|---------------|-----------|
| `*/10 * * * *` | `reconcileMemberCount`, `reconcileRsvpCount` | Every 10 minutes |
| `0 * * * *` | `cleanupExpiredEvents`, `cleanupExpiredBlocks` | Every hour at :00 |

Startup log: `[scheduler] started — reconcile every 10min, cleanup every 1hr`.

### 5.2 `cleanupExpiredEvents.js`

**Purpose:** Mark stale events completed without relying on read-path side effects.

**Query:**

```javascript
Event.updateMany(
  { status: { $in: ["upcoming", "ongoing"] }, date: { $lt: new Date() } },
  { $set: { status: "completed" } }
);
```

**Metrics logged:** `modifiedCount`, duration ms.

**Note:** `event.service.js` also runs `syncExpiredUpcomingEvents` on reads; job ensures DB consistency when routes are idle.

### 5.3 `reconcileMemberCount.js`

**Algorithm (per club, sequential loop):**

1. Load all club `_id` values (projection only).
2. For each club: `actual = Membership.countDocuments({ clubId, status: "approved" })`.
3. `Club.updateOne({ _id, memberCount: { $ne: actual } }, { $set: { memberCount: actual } })` — update only on drift.
4. Log: clubs checked, corrections applied.

**Integrity rules:**

- Source of truth: **Membership** collection, not denormalized counter.
- Conditional update avoids write lock storms when count is already correct.
- No multi-document transactions; eventual consistency within 10 minutes.
- Inline approve/reject/leave in `club.controller` also `$inc` / pipeline decrement `memberCount` + `invalidate('club:id')` cache — job corrects race/drift.

### 5.4 `reconcileRsvpCount.js`

**Algorithm:**

1. Load active events: `status` not in `completed`, `cancelled`.
2. Per event: `actual = RSVP.countDocuments({ eventId, status: "registered" })`.
3. Conditional `Event.updateOne` when `rsvpCount !== actual`.

**Integrity:** RSVP `registered` rows are authoritative; `rsvpCount` is denormalized for list performance.

### 5.5 `cleanupExpiredBlocks` (`event.service.js`)

**Schedule:** hourly via scheduler (not separate file).

**Query:**

```javascript
User.updateMany(
  { isBlocked: true, blockedUntil: { $lt: new Date() } },
  { $set: { isBlocked: false, blockedUntil: null, reviewRequired: false } }
);
```

**Purpose:** Auto-unblock users after timed discipline without manual admin action.

### 5.6 Multi-tenant safety

- All reconciliation keys include `clubId` or `eventId` — no cross-club bulk updates conflating tenants.
- Jobs use single-document `updateOne` / `updateMany` with indexed filters — no table locks; suitable for Atlas shared clusters.
- Failures isolated per `safeRun` — one job failure does not block the other in the same cron tick.

---

## §6. Design System, Sizing Scale & Style Manifest

> **Note:** `migration_guide.md` referenced in the generation spec **does not exist** in the repository. This section consolidates **`client/src/styles/tokens.css`**, **`components.css`**, **`features/dashboard/ui/styles.js`**, and **`AppLayout`** patterns as the authoritative migration target.

### 6.1 Color palette and semantic tokens

#### Raw palette (`tokens.css`)

| Token | Hex | Design name mapping |
|-------|-----|---------------------|
| `--steel-azure` | `#2563EB` | **Steel Azure** (primary brand) |
| `--sky-surge` | `#06B6D4` | **Sky Surge** (accent) |
| `--violet-royal` | `#7C3AED` | Secondary accent |
| `--indigo-600` | `#4F46E5` | Brand hover |
| `--slate-900` | `#0A0A12` | Dark background base |
| `--slate-800` | `#0D0D18` | Dark surface |
| `--text-light` | `#F8FAFC` | **Bright Snow** (dark theme text) |
| `--muted-light` | `#94A3B8` | Muted text (dark) |
| `--slate-50` | `#F7F9FC` | Light background |
| `--slate-0` | `#FFFFFF` | Light surface |
| `--text-dark` | `#0F172A` | **Graphite** (light theme text) |
| `--muted-dark` | `#475569` | Muted text (light) |

#### Semantic aliases (theme-aware)

| CSS variable | Dark source | Light source | Usage |
|--------------|-------------|--------------|-------|
| `--cc-bg` | slate-900 | slate-50 | Page background |
| `--cc-surface` | slate-800 | slate-0 | Cards, sidebar |
| `--cc-text` | text-light | text-dark | Primary text |
| `--cc-muted` | muted-light | muted-dark | Secondary text |
| `--cc-border-soft` | white 8% alpha | slate 8% alpha | Borders |
| `--cc-border-strong` | white 16% alpha | slate 16% alpha | Hover borders |
| `--cc-brand` | steel-azure | steel-azure | Primary buttons |
| `--cc-brand-hover` | indigo-600 | indigo-600 | Button hover |
| `--cc-accent` | sky-surge | sky-surge | Highlights |
| `--cc-surface-weak` | translucent | translucent | Nested panels |
| `--cc-surface-hover` | translucent | translucent | Hover states |
| `--cc-surface-overlay` | dark overlay | light overlay | Top bar blur |

**Theme switch:** `ThemeToggle` sets `document.documentElement.dataset.theme` to `dark` | `light`; persisted in `localStorage` key `cc_theme`.

### 6.2 Utility classes (`components.css`)

| Class | Maps to |
|-------|---------|
| `.bg-cc-surface`, `.bg-cc-bg`, `.bg-cc-surface-weak`, `.bg-cc-surface-overlay` | Background semantics |
| `.text-cc`, `.text-cc-muted` | Text semantics |
| `.border-cc-soft`, `.border-cc-strong` | Borders |
| `.hover-bg-cc-surface`, `.hover-border-cc-strong` | Hover |
| `.btn-cc-primary` | Brand button (padding `0.5rem 0.9rem`, radius `0.75rem`) |
| `.badge-cc` | `padding: 0.15rem 0.5rem`, `font-size: 10px`, pill radius |
| `.animate-fade-in` | `cc-fade-in` 0.3s ease |
| `.cc-card` | `border-radius: 1rem`, soft border |

**Light theme fixes:** `html[data-theme="light"]` overrides legacy `bg-white/[…]` and `border-white/[…]` Tailwind utilities to map onto semantic tokens.

### 6.3 Typography scale (observed conventions)

| Role | Typical classes | Size |
|------|-----------------|------|
| Page title | `text-3xl font-bold tracking-tight` | 30px |
| Section title | `text-base font-semibold` | 16px |
| Body | `text-sm` | 14px |
| Micro label | `text-[11px] uppercase tracking-widest` | 11px |
| Stat value | `text-3xl font-semibold tabular-nums` | 30px |
| Mono badge | `text-[10px] font-mono` | 10px |

**Font stack (global):** `system-ui, Avenir, Helvetica, Arial, sans-serif` in `:root` (`index.css`). Auth/Profile pages additionally load **Syne** + **DM Mono** via Google Fonts inline.

### 6.4 Spacing and layout metrics

Derived from `dashboard/ui/styles.js` and repeated across migrated pages:

| Token name | Tailwind / value | Use |
|------------|------------------|-----|
| **page gutter** | `px-5 lg:px-6 py-6` | Standard authenticated page padding |
| **xs** | `gap-2`, `p-2`, `py-2` | Tight inline spacing |
| **sm** | `gap-3`, `p-3`, `py-2.5`, `text-sm` | List rows, compact cards |
| **md** | `gap-4`, `p-4`, `py-3` | Default card interior |
| **base** | `gap-5`, `p-5`, `space-y-5` | Section separation |
| **lg** | `gap-6`, `p-6`, `lg:px-6` | Page sections, hero |
| **xl** | `rounded-2xl`, `rounded-3xl`, `max-w-6xl` | Large cards, attendance page |

**Grid patterns:**

- Stats: `grid-cols-2 lg:grid-cols-4 gap-3`
- Two-column content: `grid-cols-1 lg:grid-cols-5` or `lg:grid-cols-3`
- Sidebar layout: `AppLayout` — `flex h-screen`, sidebar `w-55`, main `flex-1 overflow-y-auto`

**Content width constraint (migration target):** Prefer `max-w-xl` (forms), `max-w-6xl mx-auto` (data-heavy pages) instead of unbounded full-width text lines.

### 6.5 Layout migration guidelines

**Problem:** Legacy pages (`Profile.jsx`, `UserProfile.jsx`, parts of `EventDetail.jsx`) use inline `width: "100%"` and style objects that stretch content edge-to-edge on ultra-wide displays.

**Target pattern (from Dashboard / AttendanceManagement / Bookmarks):**

1. **Page shell:** `className="w-full px-5 lg:px-6 py-6 space-y-6"` or `min-h-full px-5 lg:px-6 py-6 text-cc bg-cc-bg"`.
2. **Constrain readable width:** wrap primary forms in `max-w-xl mx-auto`; data tables in `max-w-6xl mx-auto`.
3. **Replace inline colors** with `text-cc`, `text-cc-muted`, `border-cc-soft`, `bg-cc-surface-weak`.
4. **Prefer semantic hover** (`hover-bg-cc-surface`) over raw `hover:bg-white/5`.
5. **Headers:** gradient blur orbs in `relative overflow-hidden border-b border-cc-soft` + inner `px-5 lg:px-6 pt-6 pb-5`.
6. **Do not use** viewport-breaking `w-screen` or unbounded `width: 100%` on inner text containers — use `w-full` inside padded parent only.

**Form inputs:** migrate from `inputCls` (hardcoded `text-white`, `border-white/[0.08]`) to theme-aware variants:

```javascript
// Current inputCls — dark-biased
`w-full bg-white/[0.04] border ... text-white ...`
// Target — use placeholder-cc-muted + border-cc-soft + text-cc
```

### 6.6 Category metadata (feature tokens)

**Clubs** (`theme/clubs.js`): per-category `emoji`, `gradient`, `badge`, `heroBg`, `tabActive` Tailwind class strings.

**Events** (`theme/events.js`): `EVENT_CATEGORIES`, `EVENT_CATEGORY_META`, `EVENT_STATUSES`, `EVENT_STATUS_CLASS` for status badges.

---

## Appendix A — Complete HTTP API Surface

### `/api/auth` (rate limited)

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/register` | — | register |
| POST | `/login` | — | login |
| POST | `/logout` | — | logout |
| POST | `/refresh-token` | cookie refresh | refreshToken |
| GET | `/verify` | auth | verify |

### `/api/clubs`

| Method | Path | Auth / gate |
|--------|------|-------------|
| GET | `/` | public |
| GET | `/mine` | auth |
| GET | `/:id` | public |
| POST | `/` | auth + clubAdmin/orgAdmin |
| PUT | `/:id` | auth + clubAdmin/orgAdmin |
| DELETE | `/:id` | auth + orgAdmin |
| POST | `/:id/join`, `/leave` | auth |
| GET | `/:id/members` | auth |
| POST | `/:id/approve-member`, `/reject-member` | auth + clubAdmin/orgAdmin |
| POST | `/:id/coordinator/assign` | auth + canManageClub |
| DELETE | `/:id/coordinator/:userId` | auth + canManageClub |
| GET/POST | `/:id/announcements` | auth (+ coordinator for POST) |
| DELETE | `/:id/announcements/:annId` | auth |
| PATCH | `/:id/announcements/:annId/pin` | auth + clubAdmin/orgAdmin |

### `/api/events` (rate limited)

Includes: CRUD, RSVP, volunteers, lifecycle (`publish`, `start`, `restart`, `end`), analytics, grace requests, attendance, reviews dashboard, `GET /volunteer-feed`, `GET /reviews`.

### `/api/external-events`

CRUD, `POST /ocr/extract`, `PATCH /:id/verify` (editor/orgAdmin).

### `/api/bookmarks`, `/api/chats`, `/api/messages`, `/api/users`, `/api/volunteers`, `/api/notifications`

As routed in §4.1; all user-specific routes require `auth` except public listings noted above.

---

## Appendix B — Authentication alignment checklist

| Concern | Frontend | Backend | Aligned? |
|---------|----------|---------|----------|
| Access token transport | HttpOnly cookie via `withCredentials` | `auth.js` reads `req.cookies.token` | Yes |
| Refresh on 401 | Axios interceptor queue | `POST /refresh-token` + rotation | Yes |
| Verify on load | `AuthContext.verify()` | `GET /verify` + auth middleware | Yes |
| Skip refresh on login/register/logout/refresh | `SKIP_REFRESH_URLS` | N/A | Yes |
| Socket auth | `withCredentials` (cookie) | Cookie / auth.token / Bearer | Yes |
| Role in JWT | Not decoded client-side for security | `roles` in token payload | Yes — UI uses `user.roles` from API body |
| Refresh cookie path | Client posts to `/api/auth/refresh-token` | Cookie `path: /api/auth/refresh-token` | Yes |

---

## Appendix C — Related documentation files

| File | Status |
|------|--------|
| `docs/SRS_DOCUMENT.md` | Comprehensive SRS (May reference indexes/features; verify dates) |
| `docs/PROJECT_SPECIFICATIONS.md` | **Stale** — early-phase snapshot |
| `docs/frontendSpecs.json` | High-level frontend flow |
| `docs/MASTER_SYSTEM_BLUEPRINT.md` | **This document** — code-synced master reference |

---

*End of Master System Blueprint.*
