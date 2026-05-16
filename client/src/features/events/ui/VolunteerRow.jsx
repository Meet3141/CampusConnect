import React from "react";

export default function VolunteerRow({ v, onReview, onRemove, actionLoading }) {
  const uid = String(v.userId?._id || v.userId);

  if (v.status === "pending") {
    return (
      <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-950/20 border border-amber-900/30">
        <div className="min-w-0">
          <p className="text-sm text-white font-medium">{v.userId?.name || "Unknown"}</p>
          {v.skills?.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-0.5">Skills: {v.skills.join(', ')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-amber-400 border border-amber-800 bg-amber-950 px-2 py-0.5 rounded-full">Pending</span>
          <button
            onClick={() => onReview(uid, 'accept')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-40"
          >✓ Accept</button>
          <button
            onClick={() => onReview(uid, 'reject')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs border border-red-900/50 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-40"
          >✕ Reject</button>
        </div>
      </div>
    );
  }

  if (v.status === "accepted") {
    return (
      <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
        <div className="min-w-0">
          <p className="text-sm text-white font-medium">{v.userId?.name || "Unknown"}</p>
          {v.skills?.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-0.5">Skills: {v.skills.join(', ')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-emerald-400 border border-emerald-800 bg-emerald-950 px-2 py-0.5 rounded-full">✓ Accepted</span>
          <button
            onClick={() => onRemove(uid)}
            disabled={actionLoading}
            className="px-3 py-1 text-xs border border-red-900/50 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-40 text-[11px]"
          >Remove</button>
        </div>
      </div>
    );
  }

  // rejected
  return (
    <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] opacity-60">
      <p className="text-sm text-slate-500">{v.userId?.name || "Unknown"}</p>
      <span className="text-[10px] text-red-400 border border-red-900/40 px-2 py-0.5 rounded-full">✕ Rejected</span>
    </div>
  );
}
