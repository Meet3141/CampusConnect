import React from "react";

export default function VolunteerRow({ v, onReview, onRemove, actionLoading }) {
  const uid = String(v.userId?._id || v.userId);

  if (v.status === "pending") {
    return (
      <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[var(--cc-color-warning-soft)] border border-[var(--cc-color-warning)]/30">
        <div className="min-w-0">
          <p className="text-sm text-[var(--cc-color-text-primary)] font-medium">{v.userId?.name || "Unknown"}</p>
          {v.skills?.length > 0 && (
            <p className="text-[11px] text-[var(--cc-color-text-muted)] mt-0.5">Skills: {v.skills.join(', ')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[var(--cc-color-warning)] border border-[var(--cc-color-warning)] bg-[var(--cc-color-warning-soft)] px-2 py-0.5 rounded-full">Pending</span>
          <button
            onClick={() => onReview(uid, 'accept')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-[var(--cc-color-success)] hover:bg-[var(--cc-color-success)]/80 text-[var(--cc-color-on-brand)] rounded-lg transition-colors disabled:opacity-40"
          >✓ Accept</button>
          <button
            onClick={() => onReview(uid, 'reject')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs border border-[var(--cc-color-danger)]/50 text-[var(--cc-color-danger)] hover:bg-[var(--cc-color-danger-soft)] rounded-lg transition-colors disabled:opacity-40"
          >✕ Reject</button>
        </div>
      </div>
    );
  }

  if (v.status === "accepted") {
    return (
      <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[var(--cc-color-success-soft)] border border-[var(--cc-color-success)]/30">
        <div className="min-w-0">
          <p className="text-sm text-[var(--cc-color-text-primary)] font-medium">{v.userId?.name || "Unknown"}</p>
          {v.skills?.length > 0 && (
            <p className="text-[11px] text-[var(--cc-color-text-muted)] mt-0.5">Skills: {v.skills.join(', ')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[var(--cc-color-success)] border border-[var(--cc-color-success)] bg-[var(--cc-color-success-soft)] px-2 py-0.5 rounded-full">✓ Accepted</span>
          <button
            onClick={() => onRemove(uid)}
            disabled={actionLoading}
            className="px-3 py-1 text-xs border border-[var(--cc-color-danger)]/50 text-[var(--cc-color-danger)] hover:bg-[var(--cc-color-danger-soft)] rounded-lg transition-colors disabled:opacity-40 text-[11px]"
          >Remove</button>
        </div>
      </div>
    );
  }

  // rejected
  return (
    <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[var(--cc-color-surface)] border border-[var(--cc-color-border)] opacity-60">
      <p className="text-sm text-[var(--cc-color-text-muted)]">{v.userId?.name || "Unknown"}</p>
      <span className="text-[10px] text-[var(--cc-color-danger)] border border-[var(--cc-color-danger)]/40 px-2 py-0.5 rounded-full">✕ Rejected</span>
    </div>
  );
}
