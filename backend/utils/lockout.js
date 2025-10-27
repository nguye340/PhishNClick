/**
 * Account lockout utility functions
 * Implements escalating lockout stages based on consecutive failed login attempts
 */

// Thresholds for each lockout stage (consecutive failed attempts)
export const LOCKOUT_THRESHOLDS = [3, 6, 9, 12];

// Lockout durations in seconds for each stage
// Stage 0: 30 minutes, Stage 1: 3 hours, Stage 2: 24 hours, Stage 3: permanent (-1)
export const LOCKOUT_DURATIONS = [30 * 60, 3 * 60 * 60, 24 * 60 * 60, -1];

/**
 * Compute the next lockout duration and expiry based on current stage
 * @param {number} stage - Current lockout stage (0-3)
 * @returns {Object} { durationSec, expiresAt, permanent }
 */
export function computeNextLockout(stage) {
    const durationSec = LOCKOUT_DURATIONS[Math.min(stage, LOCKOUT_DURATIONS.length - 1)];
    const expiresAt = durationSec < 0 ? null : new Date(Date.now() + durationSec * 1000);
    const permanent = durationSec < 0;
    return { durationSec, expiresAt, permanent };
}

/**
 * Get current timestamp in seconds
 * @returns {number} Current Unix timestamp in seconds
 */
export function nowSec() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Calculate remaining lockout time for a user
 * @param {Object} user - User document from database
 * @returns {Object|null} { permanent, remainingSeconds } or null if not locked
 */
export function remainingLockout(user) {
    if (user.isPermanentlyLocked) {
        return { permanent: true, remainingSeconds: -1 };
    }
    if (!user.lockoutExpiresAt) {
        return null;
    }
    const rem = Math.max(0, Math.floor((user.lockoutExpiresAt.getTime() - Date.now()) / 1000));
    if (rem === 0) {
        return null; // Lockout expired
    }
    return { permanent: false, remainingSeconds: rem };
}

/**
 * Determine the appropriate lockout stage based on consecutive failed attempts
 * @param {number} consecutiveFailures - Number of consecutive failed login attempts
 * @returns {number} Lockout stage (0-3)
 */
export function determineLockoutStage(consecutiveFailures) {
    if (consecutiveFailures >= LOCKOUT_THRESHOLDS[3]) return 3; // 12+ failures → permanent
    if (consecutiveFailures >= LOCKOUT_THRESHOLDS[2]) return 2; // 9+ failures → 24 hours
    if (consecutiveFailures >= LOCKOUT_THRESHOLDS[1]) return 1; // 6+ failures → 3 hours
    if (consecutiveFailures >= LOCKOUT_THRESHOLDS[0]) return 0; // 3+ failures → 30 minutes
    return -1; // No lockout
}

/**
 * Format remaining time in human-readable format
 * @param {number} seconds - Remaining seconds
 * @returns {string} Formatted time string
 */
export function formatRemainingTime(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hours`;
    return `${Math.ceil(seconds / 86400)} days`;
}
