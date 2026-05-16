# CampusConnect — Project Specifications Document

> **Auto-generated**: February 17, 2026  
> **Purpose**: Comprehensive reference for AI-assisted and manual code generation against the current project state.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Backend Specifications](#4-backend-specifications)
   - 4.1 [Server Entry Point](#41-server-entry-point)
   - 4.2 [Environment Variables](#42-environment-variables)
   - 4.3 [Database Connection](#43-database-connection)
   - 4.4 [Mongoose Models (Schemas)](#44-mongoose-models-schemas)
   - 4.5 [API Routes (Implemented)](#45-api-routes-implemented)
   - 4.6 [API Routes (Not Yet Implemented)](#46-api-routes-not-yet-implemented)
   - 4.7 [Controllers](#47-controllers)
   - 4.8 [Middleware](#48-middleware)
   - 4.9 [Utilities](#49-utilities)
   - 4.10 [Error Response Format](#410-error-response-format)
5. [Frontend Specifications](#5-frontend-specifications)
   - 5.1 [Build & Dev Tooling](#51-build--dev-tooling)
   - 5.2 [Routing](#52-routing)
   - 5.3 [State Management (AuthContext)](#53-state-management-authcontext)
   - 5.4 [API Service Layer](#54-api-service-layer)
   - 5.5 [Implemented Pages](#55-implemented-pages)
   - 5.6 [Protected Route Guard](#56-protected-route-guard)
   - 5.7 [Styling](#57-styling)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Data Models — Full Schema Reference](#7-data-models--full-schema-reference)
8. [Conventions & Patterns](#8-conventions--patterns)
9. [What Is NOT Yet Built](#9-what-is-not-yet-built)
10. [Code Generation Guidelines](#10-code-generation-guidelines)

---

## 1. Project Overview

**CampusConnect** is a full-stack web application for campus/university community management. It is built around the following core concepts:

| Domain        | Description |
|---------------|-------------|
| **Users**     | Students/admins with role-based access (`member`, `clubAdmin`, `editor`, `orgAdmin`) |
| **Clubs**     | University clubs with membership management (pending/active/rejected) |
| **Events**    | Club-hosted internal events with RSVP/attendance tracking |
| **External Events** | Cross-university events scraped/OCR-parsed from poster images |
| **Chat & Messaging** | Real-time group chats tied to clubs or events |
| **Bookmarks** | Users can bookmark internal or external events |
| **Memberships** | Separate join-request tracking with approval workflow |
| **OCR Cache** | Caches OCR-extracted data from event poster images (TTL: 24 h) |

Currently, **only authentication (register/login/verify/refresh)** is fully wired end-to-end. All 9 Mongoose models are defined and ready. No controllers, routes, or frontend pages exist yet for clubs, events, chat, bookmarks, memberships, or external events.

---

## 2. Tech Stack

### Backend

| Layer        | Technology | Version (package.json) |
|--------------|-----------|----------------------|
| Runtime      | Node.js   | (not pinned)         |
| Framework    | Express   | ^5.2.1               |
| Database     | MongoDB (Atlas) | via Mongoose ^9.1.5 |
| Auth         | JWT       | jsonwebtoken ^9.0.3  |
| Password Hash| bcryptjs  | ^3.0.3               |
| Env Config   | dotenv    | ^17.2.3              |
| CORS         | cors      | ^2.8.6               |
| Module System| ES Modules (`"type": "module"`) | — |
| Dev Runner   | nodemon   | (devDependency implied by `dev` script) |

### Frontend

| Layer        | Technology | Version |
|--------------|-----------|---------|
| Framework    | React     | ^19.2.0 |
| Router       | react-router-dom | ^7.13.0 |
| HTTP Client  | axios     | ^1.13.5 |
| Build Tool   | Vite      | ^7.2.4  |
| Compiler     | babel-plugin-react-compiler ^1.0.0 (React Compiler) | — |
| Linting      | ESLint 9 + eslint-plugin-react-hooks + eslint-plugin-react-refresh | — |
| Module System| ES Modules (`"type": "module"`) | — |

---

## 3. Repository Structure

```
CampusConnect/
├── Mod1502.json                  # Change log (stages 1-4 fixes)
├── PROJECT_SPECIFICATIONS.md     # ← THIS FILE
│
├── server/
│   ├── .env                      # PORT, MONGO_URI, JWT_SECRET, NODE_ENV
│   ├── index.js                  # Express app entry point
│   ├── package.json
│   ├── config/
│   │   └── db.js                 # Mongoose connection helper
│   ├── controllers/
│   │   └── authController.js     # register, login, verify, refreshToken
│   ├── middleware/
│   │   ├── asyncHandler.js       # Promise-catch wrapper
│   │   ├── auth.js               # JWT verification middleware
│   │   ├── errorHandler.js       # Global error handler (last middleware)
│   │   └── roleCheck.js          # Role-based authorization middleware
│   ├── models/
│   │   ├── Bookmark.js
│   │   ├── Chat.js
│   │   ├── Club.js
│   │   ├── Event.js
│   │   ├── ExternalEvent.js
│   │   ├── Membership.js
│   │   ├── Message.js
│   │   ├── OCRCache.js
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js               # /api/auth/*
│   └── utils/
│       └── generateToken.js      # JWT sign helper
│
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx              # React root render
│       ├── App.jsx               # Router + AuthProvider
│       ├── App.css               # Default Vite CSS (mostly unused)
│       ├── index.css             # Global styles (dark/light)
│       ├── context/
│       │   └── AuthContext.jsx   # Auth state (user, login, logout, loading)
│       ├── pages/
│       │   ├── Dashboard.jsx     # Post-login landing (minimal)
│       │   ├── Login.jsx         # Email/password login form
│       │   └── Register.jsx      # Name/email/password registration form
│       ├── routes/
│       │   └── ProtectedRoute.jsx # Auth guard wrapper
│       └── services/
│           └── api.js            # Axios instance (baseURL + token interceptor)
```

---

## 4. Backend Specifications

### 4.1 Server Entry Point

**File**: `server/index.js`

```
Flow:
1. dotenv.config()
2. connectDB()               → MongoDB Atlas via Mongoose
3. app.use(cors())            → Allow all origins (no config)
4. app.use(express.json())    → Parse JSON bodies
5. GET "/"                    → Health check ("Backend is running")
6. app.use("/api/auth", authRoutes)
7. app.use(errorHandler)      → MUST be last middleware
8. Listen on PORT (default 5000)
```

**Important**: Express 5.x is used. The `errorHandler` must be the terminal middleware to catch thrown errors from `asyncHandler`.

### 4.2 Environment Variables

| Variable      | Example Value | Description |
|---------------|--------------|-------------|
| `PORT`        | `5000` | Server listen port |
| `MONGO_URI`   | `mongodb+srv://...@cluster0.../campusDB?retryWrites=true&w=majority` | MongoDB Atlas connection string |
| `JWT_SECRET`  | `campusconnect_jwt_secret_key_2026` | Secret for JWT signing |
| `NODE_ENV`    | `development` | Controls stack trace visibility in error responses |

### 4.3 Database Connection

**File**: `server/config/db.js`

- Uses `mongoose.connect(process.env.MONGO_URI)` (no options — Mongoose 9 defaults).
- Exits process on connection failure (`process.exit(1)`).
- Database name: `campusDB` (set in MONGO_URI).

### 4.4 Mongoose Models (Schemas)

See [Section 7](#7-data-models--full-schema-reference) for complete field-level reference.

| Model | Collection | Status |
|-------|-----------|--------|
| User | users | ✅ Active (auth wired) |
| Club | clubs | 🔲 Schema only |
| Event | events | 🔲 Schema only |
| ExternalEvent | externalevents | 🔲 Schema only |
| Chat | chats | 🔲 Schema only |
| Message | messages | 🔲 Schema only |
| Membership | memberships | 🔲 Schema only |
| Bookmark | bookmarks | 🔲 Schema only |
| OCRCache | ocrcaches | 🔲 Schema only |

### 4.5 API Routes (Implemented)

All routes are prefixed with `/api`.

#### Auth Routes — `/api/auth`

| Method | Path | Auth | Controller | Request Body | Success Response |
|--------|------|------|-----------|-------------|-----------------|
| `POST` | `/register` | No | `register` | `{ name, email, password }` | `201 { success, token, user }` |
| `POST` | `/login` | No | `login` | `{ email, password }` | `200 { success, token, user }` |
| `POST` | `/refresh-token` | No | `refreshToken` | `{ token }` | `200 { success, token }` |
| `GET`  | `/verify` | Yes (`auth`) | `verify` | — | `200 { success, user }` |

### 4.6 API Routes (Not Yet Implemented)

Based on the defined models, the following route groups are expected but **do not exist yet**:

| Route Group | Expected Prefix | Related Models |
|-------------|----------------|---------------|
| Clubs | `/api/clubs` | Club, Membership |
| Events | `/api/events` | Event |
| External Events | `/api/external-events` | ExternalEvent, OCRCache |
| Chat | `/api/chats` | Chat |
| Messages | `/api/messages` | Message |
| Bookmarks | `/api/bookmarks` | Bookmark |
| Users (profile) | `/api/users` | User |

### 4.7 Controllers

#### `authController.js`

| Function | Description | Error Codes |
|----------|------------|------------|
| `register` | Creates user with `roles: ["member"]`. Validates name/email/password presence & password strength regex. Checks for duplicate email. Returns JWT + user JSON (password excluded). | 400, 409 |
| `login` | Finds user by email (with `+password` select). Compares bcrypt hash. Returns JWT + user JSON. | 400, 401 |
| `verify` | Requires `auth` middleware. Fetches user by `req.user.id`. Returns user JSON. | 404 |
| `refreshToken` | Accepts an existing (possibly expired) JWT, decodes it ignoring expiration, and issues a fresh token. | 400 |

**Password validation regex** (enforced in controller, NOT in Mongoose schema):
```
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
```
Requires: 8+ chars, at least one lowercase, one uppercase, one digit.

### 4.8 Middleware

#### `asyncHandler.js`
```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```
Wraps async controller functions to forward errors to `errorHandler`.

#### `auth.js` — JWT Authentication
- Extracts token from `Authorization: Bearer <token>` header.
- Verifies with `jwt.verify(token, JWT_SECRET)`.
- Attaches `req.user = { id, roles }` (decoded JWT payload).
- Returns `401` with specific messages for missing/invalid/expired tokens.

#### `roleCheck.js` — Role Authorization
```js
const authorize = (...allowedRoles) => (req, res, next) => { ... }
```
- Requires `auth` middleware to run first (depends on `req.user`).
- Checks if ANY of user's roles overlap with `allowedRoles`.
- Returns `401` if no `req.user`, `403` if insufficient permissions.

**Usage pattern**:
```js
router.post("/clubs", auth, authorize("clubAdmin", "orgAdmin"), createClub);
```

#### `errorHandler.js` — Global Error Handler
Handles:
- Custom errors with `err.statusCode`
- Mongoose `ValidationError` → 400
- Mongoose duplicate key (code 11000) → 409
- Mongoose `CastError` → 400
- `JsonWebTokenError` → 401
- `TokenExpiredError` → 401
- Includes stack trace only when `NODE_ENV === "development"`

**Response format**:
```json
{
  "success": false,
  "message": "Error description",
  "stack": "... (development only)"
}
```

### 4.9 Utilities

#### `generateToken.js`
```js
jwt.sign({ id: user._id, roles: user.roles }, JWT_SECRET, { expiresIn: "1d" })
```
- Token payload: `{ id, roles }`
- Expiry: 1 day

### 4.10 Error Response Format

All error responses follow this shape:
```json
{
  "success": false,
  "message": "<human-readable error>"
}
```

All success responses follow this shape:
```json
{
  "success": true,
  ...data
}
```

---

## 5. Frontend Specifications

### 5.1 Build & Dev Tooling

- **Vite 7** with `@vitejs/plugin-react` and React Compiler (`babel-plugin-react-compiler`).
- Dev server: `npm run dev` (Vite default port 5173).
- Build: `npm run build` → `dist/`.

### 5.2 Routing

**File**: `client/src/App.jsx`

| Path | Component | Auth Required | Notes |
|------|----------|--------------|-------|
| `/` | `<Navigate to="/login">` | No | Auto-redirect |
| `/login` | `<Login />` | No | — |
| `/register` | `<Register />` | No | — |
| `/dashboard` | `<Dashboard />` | Yes (`ProtectedRoute`) | — |
| `*` (catch-all) | `<Navigate to="/login">` | No | Unknown routes → login |

**Router**: `BrowserRouter` from `react-router-dom` v7.

**Component tree**:
```
<AuthProvider>
  <BrowserRouter>
    <Routes>
      ...
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

### 5.3 State Management (AuthContext)

**File**: `client/src/context/AuthContext.jsx`

**Provides** via `useAuth()` hook:

| Value | Type | Description |
|-------|------|-------------|
| `user` | `object \| null` | Current authenticated user object (from API) |
| `login(email, password)` | `async function` | Calls `/api/auth/login`, stores token in `localStorage`, sets `user` |
| `logout()` | `function` | Removes token from `localStorage`, sets `user` to `null` |
| `loading` | `boolean` | `true` while initial token verification is in progress |

**Startup flow**:
1. `AuthProvider` mounts → calls `verify()`.
2. `verify()` checks `localStorage` for token.
3. If no token → sets `loading = false`, done.
4. If token exists → calls `GET /api/auth/verify`.
5. On success → sets `user`. On failure → calls `logout()`.
6. Sets `loading = false` in `finally` block.

**Token storage**: `localStorage` key `"token"`.

### 5.4 API Service Layer

**File**: `client/src/services/api.js`

```js
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});
```

- **Base URL**: `http://localhost:5000/api` (hardcoded — no env var).
- **Request interceptor**: Automatically attaches `Authorization: Bearer <token>` from `localStorage` to every request.
- No response interceptor (401 handling is manual in components).

### 5.5 Implemented Pages

#### Login (`pages/Login.jsx`)
- Controlled form: `email`, `password` state.
- Client-side validation: checks email contains `@`, password not empty.
- Calls `login()` from `AuthContext` → navigates to `/dashboard` on success.
- Displays error from API response (`err.response?.data?.message`).
- Loading state disables submit button.
- Link to `/register`.
- Inline styles (no CSS classes).

#### Register (`pages/Register.jsx`)
- Controlled form: `name`, `email`, `password` state.
- Client-side validation:
  - Name: min 2 chars.
  - Email: contains `@`.
  - Password: same regex as backend (`/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/`).
- Calls `POST /api/auth/register` directly via `api.post()` (does NOT auto-login).
- On success: `alert("Registration successful!")` → navigates to `/login`.
- Displays error from API response.
- Link to `/login`.
- Inline styles.

#### Dashboard (`pages/Dashboard.jsx`)
- Minimal: shows user name, roles (comma-separated), logout button.
- Uses `useAuth()` for `user` and `logout`.
- Inline styles.

### 5.6 Protected Route Guard

**File**: `client/src/routes/ProtectedRoute.jsx`

```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}
```

- Shows "Loading..." while `AuthContext` is verifying token.
- Redirects to `/login` if no authenticated user.
- Wraps child component if authenticated.

### 5.7 Styling

- **Global CSS**: `index.css` — Vite default with dark/light theme via `prefers-color-scheme`. System font stack.
- **App CSS**: `App.css` — Mostly default Vite boilerplate (logo spin animation, etc.). Largely unused.
- **Component styles**: All inline via `style={{ }}` props. No CSS modules, Tailwind, or component library.
- **Color scheme**: Dark by default (`#242424` bg, white text), light media query override.

---

## 6. Authentication & Authorization

### Token Lifecycle

```
1. User registers/logs in → Server returns JWT
2. Client stores JWT in localStorage("token")
3. Axios interceptor attaches "Bearer <token>" to all requests
4. auth middleware verifies JWT → attaches { id, roles } to req.user
5. roleCheck middleware (optional) checks req.user.roles
6. Token expires after 1 day
7. Client can POST /api/auth/refresh-token with expired token to get new one
```

### JWT Payload

```json
{
  "id": "<MongoDB ObjectId>",
  "roles": ["member"],
  "iat": 1739800000,
  "exp": 1739886400
}
```

### Role Hierarchy

| Role | Description | Scope |
|------|------------|-------|
| `member` | Default role for all users | Read access, join clubs, RSVP events |
| `clubAdmin` | Club administrator | Manage their clubs, approve members, create events |
| `editor` | Content editor | Manage external events, verify content |
| `orgAdmin` | Organization-wide admin | Full platform access |

Users can have **multiple roles** (stored as array). The `authorize()` middleware checks if ANY user role matches ANY allowed role.

---

## 7. Data Models — Full Schema Reference

### 7.1 User

**Collection**: `users`  
**Timestamps**: `createdAt`, `updatedAt` (auto)

| Field | Type | Required | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| `name` | String | Yes | No | — | trim, min: 2, max: 50 |
| `email` | String | Yes | Yes | — | lowercase, regex validated |
| `password` | String | Yes | No | — | min: 8, `select: false` (excluded from queries by default) |
| `roles` | [String] | No | No | `["member"]` | enum: `member`, `clubAdmin`, `editor`, `orgAdmin` |
| `interests` | [String] | No | No | `[]` | — |
| `joinedClubs` | [ObjectId → Club] | No | No | `[]` | — |
| `profilePicture` | String | No | No | `null` | — |
| `bio` | String | No | No | `""` | max: 500 |
| `phone` | String | No | No | `null` | — |
| `isVerified` | Boolean | No | No | `false` | — |

**Hooks**:
- `pre("save")`: bcrypt hash password if modified (salt rounds: 10).

**Methods**:
- `comparePassword(entered)`: bcrypt compare.
- `toJSON()`: Strips `password` field from output.

**Indexes**: `{ createdAt: -1 }`

---

### 7.2 Club

**Collection**: `clubs`  
**Timestamps**: `createdAt`, `updatedAt` (auto + manual fields)

| Field | Type | Required | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| `name` | String | Yes | Yes | — | trim, max: 100 |
| `description` | String | Yes | No | — | max: 1000 |
| `category` | String | Yes | No | — | enum: `technical`, `cultural`, `sports`, `academic`, `arts`, `other` |
| `adminId` | ObjectId → User | Yes | No | — | — |
| `coverImage` | String | No | No | `null` | — |
| `members` | [Subdocument] | No | No | — | See below |
| `memberCount` | Number | No | No | `0` | — |

**Members Subdocument**:

| Field | Type | Default | Enum |
|-------|------|---------|------|
| `userId` | ObjectId → User | — | — |
| `status` | String | `"pending"` | `pending`, `active`, `rejected` |
| `joinedAt` | Date | `Date.now` | — |
| `approvedBy` | ObjectId | — | — |
| `approvedAt` | Date | — | — |

**Indexes**: `{ name: 1 }` (unique), `{ adminId: 1 }`, `{ category: 1 }`, `{ createdAt: -1 }`, `{ "members.userId": 1 }`

---

### 7.3 Event

**Collection**: `events`  
**Timestamps**: `createdAt`, `updatedAt` (auto + manual)

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `title` | String | Yes | — | trim, max: 200 |
| `description` | String | Yes | — | max: 2000 |
| `clubId` | ObjectId → Club | Yes | — | — |
| `category` | String | Yes | — | enum: `hackathon`, `workshop`, `webinar`, `cultural`, `sports`, `meeting` |
| `date` | Date | Yes | — | Must be in the future |
| `venue` | String | Yes | — | — |
| `maxAttendees` | Number | No | `null` | — |
| `createdBy` | ObjectId → User | Yes | — | — |
| `attendees` | [Subdocument] | No | — | See below |
| `volunteers` | [ObjectId → User] | No | — | — |
| `image` | String | No | `null` | — |
| `status` | String | No | `"upcoming"` | enum: `upcoming`, `ongoing`, `completed`, `cancelled` |

**Attendees Subdocument**:

| Field | Type | Default | Enum |
|-------|------|---------|------|
| `userId` | ObjectId → User | — | — |
| `status` | String | `"registered"` | `registered`, `attended`, `cancelled` |
| `registeredAt` | Date | `Date.now` | — |

**Indexes**: `{ clubId: 1 }`, `{ date: 1 }`, `{ category: 1 }`, `{ createdBy: 1 }`, `{ "attendees.userId": 1 }`, `{ date: 1, clubId: 1 }`

---

### 7.4 ExternalEvent

**Collection**: `externalevents`  
**Timestamps**: `createdAt`, `updatedAt` (auto + manual)

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `title` | String | Yes | — | max: 200 |
| `description` | String | No | — | max: 2000 |
| `universityName` | String | Yes | — | — |
| `venue` | String | No | — | — |
| `category` | String | Yes | — | enum: `hackathon`, `workshop`, `webinar`, `cultural`, `sports`, `conference`, `competition` |
| `date` | Date | Yes | — | — |
| `registrationLink` | String | Yes | — | Must be valid URL (`^https?://`) |
| `registrationDeadline` | Date | No | — | — |
| `createdBy` | ObjectId → User | Yes | — | — |
| `isVerified` | Boolean | No | `false` | — |
| `verifiedBy` | ObjectId → User | No | — | — |
| `verificationDate` | Date | No | — | — |
| `image` | String | No | `null` | — |

**Indexes**: `{ isVerified: 1 }`, `{ category: 1 }`, `{ createdBy: 1 }`, `{ date: 1 }`, `{ universityName: 1 }`

---

### 7.5 Chat

**Collection**: `chats`  
**Timestamps**: auto

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `type` | String | Yes | — | enum: `club`, `event` |
| `referenceId` | ObjectId | Yes | — | Points to Club or Event based on `type` |
| `name` | String | Yes | — | — |
| `description` | String | No | — | — |
| `participants` | [ObjectId → User] | No | — | — |
| `lastMessage` | String | No | — | — |
| `lastMessageTime` | Date | No | — | — |
| `lastMessageSenderId` | ObjectId | No | — | — |
| `isActive` | Boolean | No | `true` | — |

**Indexes**: `{ type: 1, referenceId: 1 }` (unique), `{ participants: 1 }`, `{ lastMessageTime: -1 }`

---

### 7.6 Message

**Collection**: `messages`  
**No automatic timestamps** (uses manual `timestamp` field)

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `chatId` | ObjectId → Chat | Yes | — | — |
| `senderId` | ObjectId → User | Yes | — | — |
| `message` | String | Yes | — | trim, max: 5000 |
| `mediaUrl` | String | No | `null` | — |
| `mediaType` | String | No | `null` | enum: `image`, `video`, `file`, `null` |
| `edited` | Boolean | No | `false` | — |
| `editedAt` | Date | No | — | — |
| `deleted` | Boolean | No | `false` | — |
| `reactions` | [{ userId, emoji }] | No | — | — |
| `timestamp` | Date | No | `Date.now` | indexed |

**Indexes**: `{ chatId: 1, timestamp: -1 }`, `{ senderId: 1 }`, `{ timestamp: -1 }`, `{ chatId: 1 }`

---

### 7.7 Membership

**Collection**: `memberships`  
**Timestamps**: auto

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `userId` | ObjectId → User | Yes | — | — |
| `clubId` | ObjectId → Club | Yes | — | — |
| `status` | String | No | `"pending"` | enum: `pending`, `approved`, `rejected` |
| `joinedAt` | Date | No | `Date.now` | — |
| `approvedBy` | ObjectId → User | No | — | — |
| `approvedAt` | Date | No | — | — |
| `role` | String | No | `"member"` | enum: `member`, `moderator` |

**Indexes**: `{ userId: 1, clubId: 1 }` (unique), `{ clubId: 1 }`, `{ status: 1 }`, `{ userId: 1 }`

> **Note**: Club model has an embedded `members` array AND there's a separate `Membership` model. The relationship between these two should be reconciled — either use embedded members in Club or the separate Membership collection, not both.

---

### 7.8 Bookmark

**Collection**: `bookmarks`  
**No automatic timestamps** (uses manual `createdAt`)

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `userId` | ObjectId → User | Yes | — | — |
| `eventId` | ObjectId | Yes | — | Points to Event or ExternalEvent based on `eventType` |
| `eventType` | String | Yes | — | enum: `internal`, `external` |
| `createdAt` | Date | No | `Date.now` | indexed |

**Indexes**: `{ userId: 1, eventId: 1 }` (unique), `{ userId: 1, createdAt: -1 }`

---

### 7.9 OCRCache

**Collection**: `ocrcaches`  
**No automatic timestamps** (uses manual `createdAt` with TTL)

| Field | Type | Required | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| `imageUrl` | String | Yes | Yes | — | — |
| `imageHash` | String | No | Yes | — | — |
| `extractedData` | Object | No | No | — | `{ title, date, venue, description, category, rawText }` |
| `confidence` | Number | No | No | `0` | — |
| `processingTime` | Number | No | No | — | — |
| `createdAt` | Date | No | No | `Date.now` | TTL: 86400s (24 hours) |

**Indexes**: `{ imageUrl: 1 }` (unique), `{ createdAt: 1 }` (TTL expireAfterSeconds: 86400)

---

## 8. Conventions & Patterns

### Backend Patterns

| Pattern | Implementation |
|---------|---------------|
| **Module system** | ES Modules (`import`/`export`) throughout |
| **Async error handling** | `asyncHandler` wraps every controller; errors thrown with `error.statusCode` |
| **Error throwing** | `const error = new Error("msg"); error.statusCode = 400; throw error;` |
| **Auth middleware chain** | `auth` → `authorize(roles...)` → controller |
| **Model exports** | `export default mongoose.model("ModelName", schema)` |
| **Route exports** | `export default router` (Express Router) |
| **Controller exports** | Named exports: `export const functionName = asyncHandler(async (req, res) => { ... })` |
| **Password handling** | Never returned in responses (`select: false` + `toJSON()` strip) |
| **Response shape** | Always includes `success: true/false` |
| **Token transport** | `Authorization: Bearer <jwt>` header |
| **DB indexes** | Defined at schema level for performance-critical queries |

### Frontend Patterns

| Pattern | Implementation |
|---------|---------------|
| **Module system** | ES Modules (`import`/`export`) |
| **State management** | React Context (`AuthContext`) — no Redux/Zustand |
| **API calls** | Centralized Axios instance (`services/api.js`) with auth interceptor |
| **Form state** | `useState` per field (controlled components) |
| **Client validation** | Inline in `handleSubmit`, same regex as backend for passwords |
| **Error display** | `error` state string rendered in colored div |
| **Loading states** | `loading` boolean disables submit buttons |
| **Navigation** | `useNavigate()` hook after successful actions |
| **Route protection** | `ProtectedRoute` component wrapping protected `<Route>` elements |
| **Styling** | Inline `style={{}}` objects (no CSS framework) |
| **Token persistence** | `localStorage.setItem("token", ...)` / `getItem` / `removeItem` |

### Naming Conventions

| Context | Convention | Example |
|---------|----------|---------|
| Files (backend) | camelCase | `authController.js`, `errorHandler.js` |
| Files (models) | PascalCase | `User.js`, `ExternalEvent.js` |
| Files (frontend components) | PascalCase | `Dashboard.jsx`, `Login.jsx` |
| Files (frontend services) | camelCase | `api.js` |
| Route paths | kebab-case | `/refresh-token`, `/external-events` |
| DB field names | camelCase | `createdBy`, `memberCount`, `lastMessageTime` |
| React components | PascalCase | `ProtectedRoute`, `AuthProvider` |
| React hooks | camelCase with `use` prefix | `useAuth` |
| Express middleware | camelCase | `asyncHandler`, `auth`, `authorize` |

---

## 9. What Is NOT Yet Built

### Backend — Missing Implementation

| Feature | Models Ready | Controller | Routes | Notes |
|---------|-------------|------------|--------|-------|
| Club CRUD | ✅ Club | ❌ | ❌ | Create, read, update, delete clubs |
| Club membership management | ✅ Club, Membership | ❌ | ❌ | Join request, approve/reject, list members |
| Event CRUD | ✅ Event | ❌ | ❌ | Create, read, update, delete events |
| Event RSVP | ✅ Event (attendees subdoc) | ❌ | ❌ | Register, cancel, attendance tracking |
| External Event CRUD | ✅ ExternalEvent | ❌ | ❌ | Submit, verify, list external events |
| OCR processing | ✅ OCRCache | ❌ | ❌ | Image upload, OCR extraction, caching |
| Chat management | ✅ Chat | ❌ | ❌ | Create/fetch chats for clubs/events |
| Messaging | ✅ Message | ❌ | ❌ | Send, edit, delete, react to messages |
| Real-time (WebSocket) | ❌ | ❌ | ❌ | Socket.io not installed or configured |
| Bookmarks | ✅ Bookmark | ❌ | ❌ | Add/remove/list bookmarks |
| User profile management | ✅ User | ❌ | ❌ | Update profile, interests, picture |
| File/image upload | ❌ | ❌ | ❌ | No multer/cloudinary/S3 configured |
| Search/filter | ❌ | ❌ | ❌ | Text search across events/clubs |
| Pagination | ❌ | ❌ | ❌ | No pagination utility |
| Rate limiting | ❌ | ❌ | ❌ | No rate limiter middleware |
| Input sanitization | ❌ | ❌ | ❌ | No express-mongo-sanitize or similar |
| Email verification | ❌ | ❌ | ❌ | `isVerified` field exists but no flow |
| Password reset | ❌ | ❌ | ❌ | — |

### Frontend — Missing Implementation

| Feature | Status | Notes |
|---------|--------|-------|
| Club listing page | ❌ | — |
| Club detail page | ❌ | — |
| Club creation form | ❌ | — |
| Event listing page | ❌ | — |
| Event detail page | ❌ | — |
| Event creation form | ❌ | — |
| External events feed | ❌ | — |
| Chat/messaging UI | ❌ | — |
| User profile page | ❌ | — |
| Profile edit form | ❌ | — |
| Bookmarks page | ❌ | — |
| Search/filter UI | ❌ | — |
| Navigation/sidebar | ❌ | No layout component |
| Responsive design | ❌ | Inline styles, no breakpoints |
| Component library | ❌ | No UI kit (Material, Chakra, Tailwind, etc.) |
| Toast notifications | ❌ | Uses `alert()` for register success |
| Loading skeletons | ❌ | Only basic `<p>Loading...</p>` |
| Error boundary | ❌ | — |
| 404 page | ❌ | Redirects to login instead |
| Role-based UI rendering | ❌ | Dashboard doesn't differentiate roles |

---

## 10. Code Generation Guidelines

When generating new code for this project, follow these rules:

### Backend Rules

1. **Always use ES Module syntax** — `import`/`export`, never `require()`.
2. **Wrap controllers with `asyncHandler`** — Import from `../middleware/asyncHandler.js`.
3. **Throw errors with statusCode** — `const error = new Error("msg"); error.statusCode = 400; throw error;`.
4. **Register routes in `server/index.js`** — Pattern: `app.use("/api/<resource>", resourceRoutes);` — BEFORE `errorHandler`.
5. **Use `auth` middleware** for protected routes, chain with `authorize(...)` for role checks.
6. **Follow existing controller export pattern** — `export const fn = asyncHandler(async (req, res) => { ... });`.
7. **Response format** — Always include `success: true/false` key.
8. **Mongoose 9 compatibility** — No `next` callback in hooks; use pure async/await.
9. **New route files** — Create in `server/routes/`, import router from express, export default.
10. **New controllers** — Create in `server/controllers/`, one per resource domain.
11. **Validate request input** in controllers before DB operations.
12. **Use `.select("+password")` only** when comparing passwords (login flow).

### Frontend Rules

1. **Use functional components with hooks** — No class components.
2. **Use `useAuth()` hook** for auth state — Don't access localStorage directly in components.
3. **Use `api` from `services/api.js`** for all HTTP calls — Don't create new Axios instances.
4. **Wrap protected pages in `<ProtectedRoute>`** in `App.jsx`.
5. **Client-side validation** should mirror backend validation rules.
6. **Error handling** — Catch `err.response?.data?.message` for user-facing errors.
7. **Loading states** — Disable interactive elements during async operations.
8. **Navigation** — Use `useNavigate()` from react-router-dom v7.
9. **New pages** — Create in `client/src/pages/` as PascalCase `.jsx` files.
10. **New context providers** — Create in `client/src/context/`, export provider + `use*` hook.
11. **Styling** — Currently inline; maintain consistency or propose migration to CSS framework.
12. **Register new routes** in `App.jsx` inside `<Routes>`.

### File Naming

```
server/controllers/<resource>Controller.js    (e.g., clubController.js)
server/routes/<resource>.js                    (e.g., clubs.js)
server/middleware/<purpose>.js                 (e.g., fileUpload.js)
client/src/pages/<PageName>.jsx                (e.g., ClubList.jsx)
client/src/context/<Name>Context.jsx           (e.g., ClubContext.jsx)
client/src/components/<ComponentName>.jsx       (e.g., Navbar.jsx)  ← folder doesn't exist yet
client/src/services/<name>.js                  (e.g., clubService.js)  ← or extend api.js
```

### New Dependency Installation

When adding new features, these packages may be needed:

| Feature | Backend Package | Frontend Package |
|---------|----------------|-----------------|
| File uploads | `multer`, `cloudinary` | — |
| Real-time chat | `socket.io` | `socket.io-client` |
| Email | `nodemailer` | — |
| Rate limiting | `express-rate-limit` | — |
| Input sanitization | `express-mongo-sanitize`, `xss-clean` | — |
| Validation | `express-validator` or `joi` | — |
| UI components | — | `@mui/material`, `tailwindcss`, or `@chakra-ui/react` |
| Toast notifications | — | `react-hot-toast` or `react-toastify` |
| Date handling | — | `date-fns` or `dayjs` |
| Rich text | — | `react-quill` or `tiptap` |
| OCR | `tesseract.js` or Google Vision API | — |

---

*End of specifications. This document reflects the exact state of the codebase as of February 17, 2026.*
