// ═══════════════════════════════════════════════════════════════════
// CampusConnect — Club Pages Setup Guide
// ═══════════════════════════════════════════════════════════════════

// ─── STEP 1: Install Tailwind CSS (run inside /client) ───────────
//
//   npm install -D tailwindcss @tailwindcss/vite
//

// ─── STEP 2: vite.config.js (replace existing) ───────────────────
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})

// ─── STEP 3: client/src/index.css (add to TOP of file) ───────────
//
//   @import "tailwindcss";
//
//   /* Fade-in animation used by club cards */
//   @keyframes fade-in {
//     from { opacity: 0; transform: translateY(6px); }
//     to   { opacity: 1; transform: translateY(0); }
//   }
//   .animate-fade-in { animation: fade-in 0.3s ease both; }
//

// ─── STEP 4: Move files into client/src/pages/ ───────────────────
//
//   MyClubs.jsx    → client/src/pages/MyClubs.jsx
//   ClubList.jsx   → client/src/pages/ClubList.jsx
//   ClubDetail.jsx → client/src/pages/ClubDetail.jsx
//   CreateClub.jsx → client/src/pages/CreateClub.jsx
//

// ─── STEP 5: client/src/App.jsx — add imports + routes ───────────
//
// Add imports (alongside existing page imports):
//
//   import MyClubs    from "./pages/MyClubs";
//   import ClubList   from "./pages/ClubList";
//   import ClubDetail from "./pages/ClubDetail";
//   import CreateClub from "./pages/CreateClub";
//
// Add routes inside <Routes> — ORDER MATTERS:
// /clubs/create MUST come before /clubs/:id so "create" isn't
// treated as a dynamic :id segment.
//
//   <Route path="/my-clubs"         element={<ProtectedRoute><MyClubs    /></ProtectedRoute>} />
//   <Route path="/clubs"            element={<ProtectedRoute><ClubList   /></ProtectedRoute>} />
//   <Route path="/clubs/create"     element={<ProtectedRoute><CreateClub /></ProtectedRoute>} />
//   <Route path="/clubs/:id"        element={<ProtectedRoute><ClubDetail /></ProtectedRoute>} />
//

// ═══════════════════════════════════════════════════════════════════
// API CONTRACT — What these pages call vs what your backend provides
// ═══════════════════════════════════════════════════════════════════
//
// ✅ GET  /api/clubs                → { success, data: Club[], meta }
//         ?q=       (search by name — controller uses $regex on q param)
//         ?category=
//         ?page=    ?limit=
//         Club.adminId              = raw ObjectId string  (NOT populated)
//         Club.members[].userId     = raw ObjectId string  (NOT populated)
//         Public — no auth required
//
// ✅ GET  /api/clubs/:id            → { success, data: Club }
//         Club.adminId              = { _id, name, email } POPULATED
//         Club.members[].userId     = raw ObjectId string  (NOT populated)
//         Public — no auth required
//
// ✅ GET  /api/clubs/:id/members    → { success, data: member[] }
//         member.userId             = { _id, name, email, roles } POPULATED
//         Requires auth
//
// ✅ POST /api/clubs/:id/join       → { success, message }   (requires auth)
// ✅ POST /api/clubs/:id/leave      → { success, message }   (requires auth)
//
// ✅ POST /api/clubs/:id/approve-member
//         Body: { memberId: "<userId._id string>" }
//         memberId = the USER's ObjectId, NOT the subdocument _id
//         Requires auth + clubAdmin or orgAdmin role
//
// ✅ POST /api/clubs/:id/reject-member
//         Body: { memberId: "<userId._id string>" }
//         Requires auth + clubAdmin or orgAdmin role
//
// ✅ POST /api/clubs                → { success, data: Club }
//         Body: { name, description, category, coverImage? }
//         Requires auth + clubAdmin or orgAdmin role
//
// ✅ GET  /api/events?clubId=:id    → { success, data: Event[], meta }
//         Public — no auth required
//
// ⚠️  NO /api/clubs/my-clubs endpoint exists.
//     MyClubs.jsx fetches GET /api/clubs?limit=200 and filters client-side
//     using: club.members.some(m => String(m.userId) === String(user._id))
//     RECOMMENDATION: Add this endpoint to the backend for scale:
//       router.get("/mine", auth, asyncHandler(getMyClubs))
//       Controller: Club.find({ "members.userId": req.user.id })
//
// ═══════════════════════════════════════════════════════════════════
// USER OBJECT SHAPE (from AuthContext via /api/auth/verify)
// ═══════════════════════════════════════════════════════════════════
//
//   user._id          — MongoDB ObjectId as string
//   user.roles        — string[] e.g. ["member"] or ["clubAdmin"]
//   user.name         — string
//   user.email        — string
//
// Role checks used across pages:
//   canCreateClub     = roles.includes("clubAdmin") || roles.includes("orgAdmin")
//   isClubAdmin       = roles.includes("orgAdmin")  || club.adminId._id === user._id
//   isOrgAdmin        = roles.includes("orgAdmin")
