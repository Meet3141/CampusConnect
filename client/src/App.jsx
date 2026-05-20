import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login              from "./features/auth/pages/Login";
import Register           from "./features/auth/pages/Register";
import Dashboard          from "./features/dashboard/pages/Dashboard";
import ClubList           from "./features/clubs/pages/ClubList";
import CreateClub         from "./features/clubs/pages/CreateClub";
import EditClub           from "./features/clubs/pages/EditClub";
import ClubDetail         from "./features/clubs/pages/ClubDetail";
import MyClubs            from "./features/clubs/pages/MyClubs";
import EventDetail        from "./features/events/pages/EventDetail";
import CreateEvent        from "./features/events/pages/CreateEvent";
import EditEvent          from "./features/events/pages/EditEvent";
import Events             from "./features/events/pages/Events";
import ExternalEvents     from "./features/events/pages/ExternalEvents";
import CreateExternalEvent from "./features/events/pages/CreateExternalEvent";
import ExternalEventDetail from "./features/events/pages/ExternalEventDetail";
import Bookmarks          from "./features/events/pages/Bookmarks";
import AttendanceManagement from "./features/events/pages/AttendanceManagement";
import ChatList           from "./features/chat/pages/ChatList";
import ChatRoom           from "./features/chat/pages/ChatRoom";
import Profile            from "./features/users/pages/Profile";
import VolunteerHub       from "./features/volunteers/pages/VolunteerHub";
import AdminPanel         from "./features/admin/pages/AdminPanel";
import VerifyEvents       from "./features/volunteers/pages/VerifyEvents";
import AdminStats         from "./features/admin/pages/AdminStats";
import ReviewDashboard    from "./features/admin/pages/ReviewDashboard";
import NotFound           from "./features/common/pages/NotFound";
import UserProfile        from "./features/users/pages/UserProfile";
import ProtectedRoute     from "./routes/ProtectedRoute";
import AdminRoute         from "./routes/AdminRoute";
import RoleRoute          from "./routes/RoleRoute";
import AppLayout          from "./components/layout/AppLayout";
import { AuthProvider }   from "./context/AuthContext";
import { ToastProvider }  from "./context/ToastContext";
import ToastViewport       from "./components/ui/ToastViewport";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastViewport />
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
            <Route
              path="/clubs/:id/edit"
              element={
                <RoleRoute roles={["clubAdmin", "orgAdmin"]}>
                  <EditClub />
                </RoleRoute>
              }
            />
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
            <Route
              path="/events/:id/edit"
              element={
                <RoleRoute roles={["clubAdmin", "orgAdmin"]}>
                  <EditEvent />
                </RoleRoute>
              }
            />
            <Route
              path="/events/:eventId/attendance"
              element={
                <RoleRoute roles={["clubAdmin", "orgAdmin"]}>
                  <AttendanceManagement />
                </RoleRoute>
              }
            />
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
              path="/admin/reviews"
              element={
                <RoleRoute roles={["clubAdmin", "orgAdmin"]}>
                  <ReviewDashboard />
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
    </ToastProvider>
  );
}
