import React from "react";
import VolunteerRow from "./VolunteerRow";
import { HandHelping } from "lucide-react";

export default function VolunteerPanel({
  volunteers = [],
  volunteerLimit = 0,
  volunteerSkillsNeeded = [],
  onReview = () => {},
  onRemove = () => {},
  actionLoading = false,
}) {
  const acceptedCount = (volunteers.filter(v => v.status === 'accepted').length) || 0;

  return (
    <div className="rounded-2xl border border-[var(--cc-color-brand)]/40 bg-[var(--cc-color-surface-brand)]/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--cc-color-text-primary)] flex items-center gap-2"><HandHelping size={16} /> Volunteer Applications</h3>
          <p className="text-[11px] text-[var(--cc-color-text-muted)] mt-0.5">
            {acceptedCount} / {volunteerLimit} accepted
            {volunteerSkillsNeeded?.length > 0 && (
              <span className="ml-2 text-[var(--cc-color-text-secondary)]">· Looking for: {volunteerSkillsNeeded.join(', ')}</span>
            )}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${
          acceptedCount >= volunteerLimit ? 'bg-[var(--cc-color-warning-soft)] text-[var(--cc-color-warning)] border-[var(--cc-color-warning)]' : 'bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border-[var(--cc-color-success)]'
        }`}>
          {acceptedCount >= volunteerLimit ? 'Slots Full' : 'Open'}
        </span>
      </div>

      {(!volunteers || volunteers.length === 0) ? (
        <p className="text-[var(--cc-color-text-secondary)] text-sm text-center py-6">No applications yet.</p>
      ) : (
        <div className="space-y-2">
          {volunteers.filter(v => v.status === 'pending').map((v) => (
            <VolunteerRow key={String(v.userId?._id || v.userId)} v={v} onReview={onReview} onRemove={onRemove} actionLoading={actionLoading} />
          ))}

          {volunteers.filter(v => v.status === 'accepted').map((v) => (
            <VolunteerRow key={String(v.userId?._id || v.userId)} v={v} onReview={onReview} onRemove={onRemove} actionLoading={actionLoading} />
          ))}

          {volunteers.filter(v => v.status === 'rejected').map((v) => (
            <VolunteerRow key={String(v.userId?._id || v.userId)} v={v} onReview={onReview} onRemove={onRemove} actionLoading={actionLoading} />
          ))}
        </div>
      )}
    </div>
  );
}
