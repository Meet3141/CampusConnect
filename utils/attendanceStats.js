export function getAttendanceStats(event = {}) {
  const registered = Number(event.registeredCount ?? event.registered ?? 0) || 0;
  const attended = Number(event.attendedCount ?? event.attended ?? 0) || 0;
  const noShow = Number(event.noShowCount ?? event.noShow ?? Math.max(0, registered - attended)) || 0;
  const attendanceRate = registered > 0 ? Math.round((attended / registered) * 100) : 0;

  return {
    registered,
    attended,
    noShow,
    attendanceRate,
  };
}