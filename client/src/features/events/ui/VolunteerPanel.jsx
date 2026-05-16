import React from "react";
import VolunteerRow from "./VolunteerRow";

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
    <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">🙋 Volunteer Applications</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {acceptedCount} / {volunteerLimit} accepted
            {volunteerSkillsNeeded?.length > 0 && (
              <span className="ml-2 text-slate-600">· Looking for: {volunteerSkillsNeeded.join(', ')}</span>
            )}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${
          acceptedCount >= volunteerLimit ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
        }`}>
          {acceptedCount >= volunteerLimit ? 'Slots Full' : 'Open'}
        </span>
      </div>

      {(!volunteers || volunteers.length === 0) ? (
        <p className="text-slate-600 text-sm text-center py-6">No applications yet.</p>
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
