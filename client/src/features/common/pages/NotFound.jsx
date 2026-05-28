/**
 * NotFound.jsx (migrated to common feature)
 * 404 page with dark theme.
 */

import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="relative mb-6">
          <p className="text-8xl font-bold text-white/[0.03] leading-none select-none">404</p>
          <p className="absolute inset-0 flex items-center justify-center text-4xl font-bold" style={{ background: 'linear-gradient(120deg, #004F9F, #00BCEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            404
          </p>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 border border-white/[0.10] hover:border-white/[0.18] text-slate-400 hover:text-white rounded-xl text-sm transition-all"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
