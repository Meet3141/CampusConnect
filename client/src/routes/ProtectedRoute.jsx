import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-lg font-semibold text-white">Session error</h1>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
