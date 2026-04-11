import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login              from "./pages/Login";
import Register           from "./pages/Register";
import Dashboard          from "./pages/Dashboard";
import ClubList           from "./pages/ClubList";
import CreateClub         from "./pages/CreateClub";
import EditClub           from "./pages/EditClub";
import ClubDetail         from "./pages/ClubDetail";
import MyClubs            from "./pages/MyClubs";
import EventDetail        from "./pages/EventDetail";
import CreateEvent        from "./pages/CreateEvent";
import EditEvent          from "./pages/EditEvent";
import Events             from "./pages/Events";
import ExternalEvents     from "./pages/ExternalEvents";
import CreateExternalEvent from "./pages/CreateExternalEvent";
import ExternalEventDetail from "./pages/ExternalEventDetail";
import Bookmarks          from "./pages/Bookmarks";
import ChatList           from "./pages/ChatList";
import ChatRoom           from "./pages/ChatRoom";
import Profile            from "./pages/Profile";
import VolunteerHub       from "./pages/VolunteerHub";
import AdminPanel         from "./pages/AdminPanel";
import VerifyEvents       from "./pages/VerifyEvents";
import AdminStats         from "./pages/AdminStats";
import NotFound           from "./pages/NotFound";
import UserProfile        from "./pages/UserProfile";
import ProtectedRoute     from "./routes/ProtectedRoute";
import AdminRoute         from "./routes/AdminRoute";
import RoleRoute          from "./routes/RoleRoute";
import AppLayout          from "./components/AppLayout";
import { AuthProvider }   from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* All authenticated pages share AppLayout (sidebar + topbar) */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

            {/* ── Member pages ── */}
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/my-clubs"   element={<MyClubs />} />
            <Route path="/clubs"      element={<ClubList />} />

            {/* IMPORTANT: specific paths before dynamic :id */}
            {/* S7.C2 — club creation locked to clubAdmin / orgAdmin at route level */}
            <Route
              path="/clubs/create"
              element={
                <RoleRoute roles={["clubAdmin", "orgAdmin"]}>
                  <CreateClub />
                </RoleRoute>
              }
            />
            <Route path="/clubs/:id/edit" element={<EditClub />} />
            <Route path="/clubs/:id"      element={<ClubDetail />} />

            {/* S7.C2 — event creation locked to clubAdmin / orgAdmin */}
            <Route
              path="/events/create"
              element={
                <RoleRoute roles={["clubAdmin", "orgAdmin"]}>
                  <CreateEvent />
                </RoleRoute>
              }
            />
            <Route path="/events"          element={<Events />} />
            <Route path="/events/:id/edit" element={<EditEvent />} />
            <Route path="/events/:id"      element={<EventDetail />} />

            {/* /edit must come before /:id */}
            <Route path="/external-events/create"   element={<CreateExternalEvent />} />
            <Route path="/external-events/:id/edit" element={<CreateExternalEvent editMode />} />
            <Route path="/external-events/:id"      element={<ExternalEventDetail />} />
            <Route path="/external-events"          element={<ExternalEvents />} />

            <Route path="/bookmarks"  element={<Bookmarks />} />
            <Route path="/chats"      element={<ChatList />} />
            <Route path="/chats/:id"  element={<ChatRoom />} />
            <Route path="/volunteers" element={<VolunteerHub />} />
            <Route path="/profile"    element={<Profile />} />

            {/* Public profile for any user — used by club admins to view members */}
            <Route path="/users/:id"  element={<UserProfile />} />

            {/* ── Admin / Editor pages — route-level role guards ── */}
            {/* S7.C1 fix: /admin/verify and /admin/stats now have role guards */}
            <Route
              path="/admin/verify"
              element={
                <RoleRoute roles={["editor", "orgAdmin"]}>
                  <VerifyEvents />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/stats"
              element={
                <RoleRoute roles={["orgAdmin"]}>
                  <AdminStats />
                </RoleRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
