import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--cc-color-brand)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Session check failed — redirect cleanly via React Router (no hard reload)
  if (error && !user) {
    return <Navigate to="/login" replace />;
  }

  return user ? children : <Navigate to="/login" replace />;
}
