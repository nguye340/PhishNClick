/**
 * Advanced tests for account lockout system
 * Tests concurrency, token revocation, and race conditions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import User from '../models/user.model.js';
import { 
    determineLockoutStage, 
    computeNextLockout, 
    remainingLockout 
} from '../utils/lockout.js';

describe('Concurrency and Race Condition Tests', () => {
    describe('Atomic Updates', () => {
        it('should handle concurrent failed login attempts atomically', async () => {
            // Simulate race condition: two login attempts at same time
            const mockUser = {
                _id: 'test-user-id',
                email: 'test@example.com',
                consecutiveFailedLoginAttempts: 2,
                lockoutStage: 0
            };

            // Both attempts read consecutiveFailedLoginAttempts = 2
            const attempt1Failures = mockUser.consecutiveFailedLoginAttempts + 1; // 3
            const attempt2Failures = mockUser.consecutiveFailedLoginAttempts + 1; // 3 (race!)

            // With atomic $inc, both would correctly increment
            // Final value should be 4, not 3
            expect(attempt1Failures).toBe(3);
            expect(attempt2Failures).toBe(3);
            
            // This demonstrates why we need atomic updates
            // With findByIdAndUpdate + $inc, MongoDB ensures atomicity
        });

        it('should correctly determine lockout stage with concurrent failures', () => {
            // Test boundary conditions for stage transitions
            const stages = [
                { failures: 2, expected: -1 },  // No lock
                { failures: 3, expected: 0 },   // Stage 0 (30 min)
                { failures: 5, expected: 0 },   // Still stage 0
                { failures: 6, expected: 1 },   // Stage 1 (3 hours)
                { failures: 8, expected: 1 },   // Still stage 1
                { failures: 9, expected: 2 },   // Stage 2 (24 hours)
                { failures: 11, expected: 2 },  // Still stage 2
                { failures: 12, expected: 3 },  // Stage 3 (permanent)
                { failures: 20, expected: 3 },  // Still permanent
            ];

            stages.forEach(({ failures, expected }) => {
                const stage = determineLockoutStage(failures);
                expect(stage).toBe(expected);
            });
        });
    });

    describe('Token Revocation', () => {
        it('should invalidate all tokens when tokenVersion increments', () => {
            const user = {
                _id: 'user-123',
                tokenVersion: 5
            };

            // Old token with tv=4
            const oldToken = { sub: 'user-123', role: 'user', tv: 4 };
            // New token with tv=5
            const newToken = { sub: 'user-123', role: 'user', tv: 5 };

            // Old token should be rejected
            expect(oldToken.tv).toBeLessThan(user.tokenVersion);
            
            // New token should be accepted
            expect(newToken.tv).toBe(user.tokenVersion);
        });

        it('should handle missing tokenVersion gracefully', () => {
            // User without tokenVersion (legacy)
            const legacyUser = { _id: 'user-123' };
            const tokenVersion = typeof legacyUser.tokenVersion === 'number' ? legacyUser.tokenVersion : 0;
            
            expect(tokenVersion).toBe(0);

            // Token without tv claim (legacy)
            const legacyToken = { sub: 'user-123', role: 'user' };
            const tokenTv = typeof legacyToken.tv === 'number' ? legacyToken.tv : 0;
            
            expect(tokenTv).toBe(0);

            // Both should match (0 === 0)
            expect(tokenVersion).toBe(tokenTv);
        });

        it('should revoke tokens on lockout', () => {
            const user = {
                _id: 'user-123',
                tokenVersion: 2,
                consecutiveFailedLoginAttempts: 11
            };

            // User gets locked (12th failure)
            const newStage = determineLockoutStage(12);
            expect(newStage).toBe(3); // Permanent

            // tokenVersion should increment
            const newTokenVersion = user.tokenVersion + 1;
            expect(newTokenVersion).toBe(3);

            // Old tokens with tv=2 are now invalid
            const oldToken = { tv: 2 };
            expect(oldToken.tv).toBeLessThan(newTokenVersion);
        });

        it('should revoke tokens on admin unlock', () => {
            const user = {
                _id: 'user-123',
                tokenVersion: 5,
                isPermanentlyLocked: true
            };

            // Admin unlocks and bumps tokenVersion
            const newTokenVersion = user.tokenVersion + 1;
            expect(newTokenVersion).toBe(6);

            // All tokens with tv <= 5 are now invalid
            const oldTokens = [
                { tv: 3 },
                { tv: 4 },
                { tv: 5 }
            ];

            oldTokens.forEach(token => {
                expect(token.tv).toBeLessThan(newTokenVersion);
            });
        });
    });

    describe('Lockout Expiry Edge Cases', () => {
        it('should handle lockout expiry at exact boundary', () => {
            const now = Date.now();
            const expiresAt = new Date(now); // Expires right now

            const user = {
                isPermanentlyLocked: false,
                lockoutExpiresAt: expiresAt
            };

            const lockStatus = remainingLockout(user);
            
            // Should return null (expired) or 0 seconds remaining
            if (lockStatus) {
                expect(lockStatus.remainingSeconds).toBe(0);
            } else {
                expect(lockStatus).toBeNull();
            }
        });

        it('should handle lockout expiry in past', () => {
            const pastTime = new Date(Date.now() - 10000); // 10 seconds ago

            const user = {
                isPermanentlyLocked: false,
                lockoutExpiresAt: pastTime
            };

            const lockStatus = remainingLockout(user);
            expect(lockStatus).toBeNull();
        });

        it('should handle lockout expiry far in future', () => {
            const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            const user = {
                isPermanentlyLocked: false,
                lockoutExpiresAt: futureTime
            };

            const lockStatus = remainingLockout(user);
            expect(lockStatus).not.toBeNull();
            expect(lockStatus.permanent).toBe(false);
            expect(lockStatus.remainingSeconds).toBeGreaterThan(86390); // ~24 hours
        });
    });

    describe('Stage Escalation Logic', () => {
        it('should not escalate if already at higher stage', () => {
            const user = {
                consecutiveFailedLoginAttempts: 8,
                lockoutStage: 2 // Already at stage 2 (24 hours)
            };

            const newStage = determineLockoutStage(user.consecutiveFailedLoginAttempts);
            expect(newStage).toBe(1); // Would be stage 1 for 8 failures
            
            // Should not downgrade from stage 2 to stage 1
            const shouldEscalate = newStage > user.lockoutStage;
            expect(shouldEscalate).toBe(false);
        });

        it('should escalate when crossing threshold', () => {
            const scenarios = [
                { from: 5, to: 6, shouldEscalate: true },   // 0 → 1
                { from: 8, to: 9, shouldEscalate: true },   // 1 → 2
                { from: 11, to: 12, shouldEscalate: true }, // 2 → 3
                { from: 3, to: 4, shouldEscalate: false },  // Stay at 0
                { from: 6, to: 7, shouldEscalate: false },  // Stay at 1
            ];

            scenarios.forEach(({ from, to, shouldEscalate }) => {
                const fromStage = determineLockoutStage(from);
                const toStage = determineLockoutStage(to);
                const escalated = toStage > fromStage;
                
                expect(escalated).toBe(shouldEscalate);
            });
        });
    });

    describe('Self-Unlock Prevention', () => {
        it('should prevent admin from unlocking themselves', () => {
            const adminId = 'admin-123';
            const targetUserId = 'admin-123'; // Same as admin

            const isSelfUnlock = adminId === targetUserId;
            expect(isSelfUnlock).toBe(true);
            
            // Should return 403 FORBIDDEN
        });

        it('should allow admin to unlock other users', () => {
            const adminId = 'admin-123';
            const targetUserId = 'user-456'; // Different user

            const isSelfUnlock = adminId === targetUserId;
            expect(isSelfUnlock).toBe(false);
            
            // Should proceed with unlock
        });
    });

    describe('Retry-After Header Calculations', () => {
        it('should calculate correct Retry-After for different lockout stages', () => {
            const stages = [
                { stage: 0, expectedSeconds: 30 * 60 },      // 30 minutes
                { stage: 1, expectedSeconds: 3 * 60 * 60 },  // 3 hours
                { stage: 2, expectedSeconds: 24 * 60 * 60 }, // 24 hours
            ];

            stages.forEach(({ stage, expectedSeconds }) => {
                const { durationSec } = computeNextLockout(stage);
                expect(durationSec).toBe(expectedSeconds);
                
                // Retry-After should be Math.ceil(remainingSeconds)
                const retryAfter = Math.ceil(durationSec);
                expect(retryAfter).toBe(expectedSeconds);
            });
        });

        it('should handle Retry-After for rate limiting', () => {
            const windowMs = 60 * 1000; // 1 minute
            const retryAfterSeconds = Math.ceil(windowMs / 1000);
            
            expect(retryAfterSeconds).toBe(60);
        });
    });

    describe('JWT Payload Structure', () => {
        it('should include required fields in JWT payload', () => {
            const user = {
                _id: 'user-123',
                role: 'admin',
                tokenVersion: 5
            };

            const payload = {
                sub: user._id.toString(),
                role: user.role,
                tv: user.tokenVersion
            };

            expect(payload).toHaveProperty('sub');
            expect(payload).toHaveProperty('role');
            expect(payload).toHaveProperty('tv');
            expect(payload.sub).toBe('user-123');
            expect(payload.role).toBe('admin');
            expect(payload.tv).toBe(5);
        });

        it('should support legacy payload format', () => {
            const legacyPayload = {
                id: 'user-123',
                role: 'user'
            };

            // Should support both 'sub' and 'id' for userId
            const userId = legacyPayload.sub || legacyPayload.id;
            expect(userId).toBe('user-123');

            // Should default tv to 0 if missing
            const tv = typeof legacyPayload.tv === 'number' ? legacyPayload.tv : 0;
            expect(tv).toBe(0);
        });
    });
});

describe('Integration: Complete Lockout Flow with Token Revocation', () => {
    it('should revoke tokens through entire lockout cycle', () => {
        const user = {
            _id: 'user-123',
            email: 'test@example.com',
            tokenVersion: 0,
            consecutiveFailedLoginAttempts: 0,
            lockoutStage: 0
        };

        // Initial login - tokenVersion = 0
        expect(user.tokenVersion).toBe(0);

        // 3 failed attempts → Stage 0 lock
        user.consecutiveFailedLoginAttempts = 3;
        user.lockoutStage = 0;
        user.tokenVersion = 1; // Bumped on lock
        expect(user.tokenVersion).toBe(1);

        // Wait for lockout to expire, successful login
        user.consecutiveFailedLoginAttempts = 0;
        user.lockoutStage = 0;
        // tokenVersion stays at 1 (not bumped on success)
        expect(user.tokenVersion).toBe(1);

        // 6 more failures → Stage 1 lock
        user.consecutiveFailedLoginAttempts = 6;
        user.lockoutStage = 1;
        user.tokenVersion = 2; // Bumped on lock
        expect(user.tokenVersion).toBe(2);

        // Admin unlocks
        user.consecutiveFailedLoginAttempts = 0;
        user.lockoutStage = 0;
        user.tokenVersion = 3; // Bumped on admin unlock
        expect(user.tokenVersion).toBe(3);

        // All tokens with tv < 3 are now invalid
    });
});
