/**
 * Profile.jsx
 * User profile page (read-only — no update endpoint on backend yet).
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_META = {
  member:    { label: "Member",     cls: "bg-slate-800 text-slate-300 border-slate-700" },
  clubAdmin: { label: "Club Admin", cls: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  editor:    { label: "Editor",     cls: "bg-purple-950 text-purple-300 border-purple-800" },
  orgAdmin:  { label: "Org Admin",  cls: "bg-amber-950 text-amber-300 border-amber-800" },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown";

  return (
    <div className="text-white">
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/4 w-80 h-80 bg-indigo-700/6 rounded-full blur-3xl" />
          <div className="absolute -top-12 right-1/4 w-60 h-60 bg-violet-700/6 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-8 pb-8">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-6">
            Dashboard / Profile
          </p>

          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-950 ring-2 ring-indigo-500/30 flex items-center justify-center text-2xl font-bold text-indigo-300 mb-4">
              {initials}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{user.email}</p>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {(user.roles || ["member"]).map((role) => {
                const rm = ROLE_META[role] || ROLE_META.member;
                return (
                  <span key={role} className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border font-semibold ${rm.cls}`}>
                    {rm.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-8 space-y-5">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">Account Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-baseline">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-white font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between items-baseline">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-white font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between items-baseline">
              <dt className="text-slate-500">Member since</dt>
              <dd className="text-white font-medium">{memberSince}</dd>
            </div>
            <div className="flex justify-between items-baseline">
              <dt className="text-slate-500">Roles</dt>
              <dd className="text-white font-medium capitalize">
                {(user.roles || ["member"]).join(", ")}
              </dd>
            </div>
          </dl>
        </div>

        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full py-3 border border-red-900/60 hover:bg-red-950/40 text-red-400 rounded-xl text-sm font-medium transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
