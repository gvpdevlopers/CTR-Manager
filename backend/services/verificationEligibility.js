const RETRY_DELAY_MS = 15 * 60 * 1000;

// Successful observations are final for the day, regardless of the outcome.
// A failed observation may be retried after a cooldown.
function shouldVerify(check, now = new Date()) {
  if (!check) return true;
  if (check.metadata?.error === "Employee did not mark CTR done") return true;
  if (check.status === "unavailable") {
    const attemptedAt = check.lastAttemptAt || check.metadata?.attemptedAt || check.updatedAt;
    return !attemptedAt || now - new Date(attemptedAt) >= RETRY_DELAY_MS;
  }
  if (check.status === "pending") return !check.verifiedAt && !check.metadata?.verifiedAt;
  return false;
}

module.exports = { shouldVerify, RETRY_DELAY_MS };
