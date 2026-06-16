/**
 * AdminRoute.jsx
 * Route-level guard for admin-only pages (e.g. /admin, /admin/stats).
 * A10: Prevents a brief content flash that page-level checks allow.
 *
 * Usage:
 *   <AdminRoute><AdminPanel /></AdminRoute>
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--cc-color-warning)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!user.roles?.includes("orgAdmin")) {
    // Non-admins are silently redirected to dashboard — no flash of restricted content
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
