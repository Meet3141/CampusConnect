/**
 * RoleRoute.jsx
 * Generic route-level guard that redirects unauthorized users.
 *
 * Usage:
 *   <RoleRoute roles={['editor', 'orgAdmin']}>
 *     <VerifyEvents />
 *   </RoleRoute>
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasRole } from "../utils/roles";

export default function RoleRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--cc-color-brand)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!hasRole(user, ...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
