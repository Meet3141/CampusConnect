import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Dashboard      from "./pages/Dashboard";
import ClubList       from "./pages/ClubList";
import CreateClub     from "./pages/CreateClub";
import EditClub       from "./pages/EditClub";
import ClubDetail     from "./pages/ClubDetail";
import MyClubs        from "./pages/MyClubs";
import EventDetail    from "./pages/EventDetail";
import CreateEvent    from "./pages/CreateEvent";
import EditEvent      from "./pages/EditEvent";
import ExternalEvents from "./pages/ExternalEvents";
import Bookmarks      from "./pages/Bookmarks";
import ChatList       from "./pages/ChatList";
import ChatRoom       from "./pages/ChatRoom";
import Profile        from "./pages/Profile";
import AdminPanel     from "./pages/AdminPanel";
import VerifyEvents   from "./pages/VerifyEvents";
import AdminStats     from "./pages/AdminStats";
import NotFound       from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout      from "./components/AppLayout";
import { AuthProvider } from "./context/AuthContext";

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
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/my-clubs"       element={<MyClubs />} />
            <Route path="/clubs"          element={<ClubList />} />

            {/* IMPORTANT: /clubs/create MUST come before /clubs/:id */}
            <Route path="/clubs/create"   element={<CreateClub />} />
            <Route path="/clubs/:id/edit" element={<EditClub />} />
            <Route path="/clubs/:id"      element={<ClubDetail />} />

            {/* IMPORTANT: /events/create MUST come before /events/:id */}
            <Route path="/events/create"   element={<CreateEvent />} />
            <Route path="/events/:id/edit" element={<EditEvent />} />
            <Route path="/events/:id"      element={<EventDetail />} />

            <Route path="/external-events" element={<ExternalEvents />} />
            <Route path="/bookmarks"       element={<Bookmarks />} />
            <Route path="/chats"           element={<ChatList />} />
            <Route path="/chats/:id"       element={<ChatRoom />} />
            <Route path="/profile"         element={<Profile />} />

            {/* ── Admin pages ── */}
            {/* /admin/verify and /admin/stats MUST come before /admin */}
            <Route path="/admin/verify" element={<VerifyEvents />} />
            <Route path="/admin/stats"  element={<AdminStats />} />
            <Route path="/admin"        element={<AdminPanel />} />

          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
