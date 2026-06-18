export const recalculateDisciplineState = (user, policy) => {
  const threshold = policy.noShowThreshold ?? 2;
  const limit = policy.warningLimit ?? 4;
  const reviewPoint = limit - 1;

  const now = new Date();
  const isOnProbation = user.probationUntil && user.probationUntil > now;
  const missedCount = user.missedEvents ? user.missedEvents.length : 0;

  let newState = "normal";
  let isBlocked = false;
  let reviewRequired = false;

  // 1. Probation Breach
  if (isOnProbation && missedCount > 0) {
    newState = "blocked";
    isBlocked = true;
  }
  // 2. Limit Reached
  else if (missedCount >= limit) {
    newState = "blocked";
    isBlocked = true;
  }
  // 3. Review Point Reached
  else if (missedCount === reviewPoint) {
    newState = "review";
    reviewRequired = true;
  }
  // 4. Threshold Reached
  else if (missedCount >= threshold) {
    newState = "warning";
  }
  // 5. Still on Probation
  else if (isOnProbation) {
    newState = "probation";
  }
  // 6. Normal
  else {
    newState = "normal";
  }

  // Calculate blockedUntil if they are newly blocked
  let blockedUntil = user.blockedUntil;
  if (isBlocked && !user.isBlocked) {
    // Only set a new 14-day block if they weren't already blocked
    blockedUntil = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  } else if (!isBlocked) {
    blockedUntil = null;
  }

  return {
    disciplineStatus: newState,
    isBlocked,
    blockedUntil,
    reviewRequired,
  };
};
