/**
 * Unit tests for account lockout system
 * Tests stage transitions, unlock flow, and success reset
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
    determineLockoutStage, 
    computeNextLockout, 
    remainingLockout,
    LOCKOUT_THRESHOLDS,
    LOCKOUT_DURATIONS
} from '../utils/lockout.js';

describe('Lockout Utility Functions', () => {
    describe('determineLockoutStage', () => {
        it('should return -1 for fewer than 3 failures', () => {
            expect(determineLockoutStage(0)).toBe(-1);
            expect(determineLockoutStage(1)).toBe(-1);
            expect(determineLockoutStage(2)).toBe(-1);
        });

        it('should return stage 0 for 3-5 failures (30 min lockout)', () => {
            expect(determineLockoutStage(3)).toBe(0);
            expect(determineLockoutStage(4)).toBe(0);
            expect(determineLockoutStage(5)).toBe(0);
        });

        it('should return stage 1 for 6-8 failures (3 hour lockout)', () => {
            expect(determineLockoutStage(6)).toBe(1);
            expect(determineLockoutStage(7)).toBe(1);
            expect(determineLockoutStage(8)).toBe(1);
        });

        it('should return stage 2 for 9-11 failures (24 hour lockout)', () => {
            expect(determineLockoutStage(9)).toBe(2);
            expect(determineLockoutStage(10)).toBe(2);
            expect(determineLockoutStage(11)).toBe(2);
        });

        it('should return stage 3 for 12+ failures (permanent lockout)', () => {
            expect(determineLockoutStage(12)).toBe(3);
            expect(determineLockoutStage(15)).toBe(3);
            expect(determineLockoutStage(100)).toBe(3);
        });
    });

    describe('computeNextLockout', () => {
        it('should compute 30 minute lockout for stage 0', () => {
            const result = computeNextLockout(0);
            expect(result.durationSec).toBe(30 * 60);
            expect(result.permanent).toBe(false);
            expect(result.expiresAt).toBeInstanceOf(Date);
            
            const expectedTime = Date.now() + (30 * 60 * 1000);
            expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedTime - 1000);
            expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedTime + 1000);
        });

        it('should compute 3 hour lockout for stage 1', () => {
            const result = computeNextLockout(1);
            expect(result.durationSec).toBe(3 * 60 * 60);
            expect(result.permanent).toBe(false);
            expect(result.expiresAt).toBeInstanceOf(Date);
        });

        it('should compute 24 hour lockout for stage 2', () => {
            const result = computeNextLockout(2);
            expect(result.durationSec).toBe(24 * 60 * 60);
            expect(result.permanent).toBe(false);
            expect(result.expiresAt).toBeInstanceOf(Date);
        });

        it('should compute permanent lockout for stage 3', () => {
            const result = computeNextLockout(3);
            expect(result.durationSec).toBe(-1);
            expect(result.permanent).toBe(true);
            expect(result.expiresAt).toBeNull();
        });

        it('should cap at permanent lockout for stages beyond 3', () => {
            const result = computeNextLockout(10);
            expect(result.permanent).toBe(true);
            expect(result.expiresAt).toBeNull();
        });
    });

    describe('remainingLockout', () => {
        it('should return permanent lockout status', () => {
            const user = {
                isPermanentlyLocked: true,
                lockoutExpiresAt: null
            };
            const result = remainingLockout(user);
            expect(result.permanent).toBe(true);
            expect(result.remainingSeconds).toBe(-1);
        });

        it('should return null for unlocked user', () => {
            const user = {
                isPermanentlyLocked: false,
                lockoutExpiresAt: null
            };
            const result = remainingLockout(user);
            expect(result).toBeNull();
        });

        it('should return remaining seconds for active lockout', () => {
            const futureTime = new Date(Date.now() + 1800 * 1000); // 30 minutes
            const user = {
                isPermanentlyLocked: false,
                lockoutExpiresAt: futureTime
            };
            const result = remainingLockout(user);
            expect(result.permanent).toBe(false);
            expect(result.remainingSeconds).toBeGreaterThan(1790);
            expect(result.remainingSeconds).toBeLessThanOrEqual(1800);
        });

        it('should return null for expired lockout', () => {
            const pastTime = new Date(Date.now() - 1000); // 1 second ago
            const user = {
                isPermanentlyLocked: false,
                lockoutExpiresAt: pastTime
            };
            const result = remainingLockout(user);
            expect(result).toBeNull();
        });
    });

    describe('Lockout Stage Transitions', () => {
        it('should escalate through all stages correctly', () => {
            const stages = [];
            for (let failures = 0; failures <= 15; failures++) {
                stages.push({
                    failures,
                    stage: determineLockoutStage(failures)
                });
            }

            expect(stages.find(s => s.failures === 2).stage).toBe(-1);  // No lock
            expect(stages.find(s => s.failures === 3).stage).toBe(0);   // 30 min
            expect(stages.find(s => s.failures === 6).stage).toBe(1);   // 3 hours
            expect(stages.find(s => s.failures === 9).stage).toBe(2);   // 24 hours
            expect(stages.find(s => s.failures === 12).stage).toBe(3);  // Permanent
        });

        it('should have correct duration for each stage', () => {
            expect(LOCKOUT_DURATIONS[0]).toBe(30 * 60);      // 30 minutes
            expect(LOCKOUT_DURATIONS[1]).toBe(3 * 60 * 60);  // 3 hours
            expect(LOCKOUT_DURATIONS[2]).toBe(24 * 60 * 60); // 24 hours
            expect(LOCKOUT_DURATIONS[3]).toBe(-1);           // Permanent
        });

        it('should have correct thresholds for each stage', () => {
            expect(LOCKOUT_THRESHOLDS[0]).toBe(3);   // Stage 0 threshold
            expect(LOCKOUT_THRESHOLDS[1]).toBe(6);   // Stage 1 threshold
            expect(LOCKOUT_THRESHOLDS[2]).toBe(9);   // Stage 2 threshold
            expect(LOCKOUT_THRESHOLDS[3]).toBe(12);  // Stage 3 threshold
        });
    });
});

describe('Integration: Lockout Flow Simulation', () => {
    it('should simulate complete lockout escalation', () => {
        const user = {
            consecutiveFailedLoginAttempts: 0,
            lockoutStage: 0,
            isPermanentlyLocked: false,
            lockoutExpiresAt: null
        };

        // Simulate 3 failures → Stage 0
        user.consecutiveFailedLoginAttempts = 3;
        let stage = determineLockoutStage(user.consecutiveFailedLoginAttempts);
        expect(stage).toBe(0);
        
        let lockout = computeNextLockout(stage);
        user.lockoutStage = stage;
        user.lockoutExpiresAt = lockout.expiresAt;
        
        let remaining = remainingLockout(user);
        expect(remaining.permanent).toBe(false);
        expect(remaining.remainingSeconds).toBeGreaterThan(1790);

        // Simulate 6 failures → Stage 1
        user.consecutiveFailedLoginAttempts = 6;
        stage = determineLockoutStage(user.consecutiveFailedLoginAttempts);
        expect(stage).toBe(1);
        
        lockout = computeNextLockout(stage);
        user.lockoutStage = stage;
        user.lockoutExpiresAt = lockout.expiresAt;
        
        remaining = remainingLockout(user);
        expect(remaining.remainingSeconds).toBeGreaterThan(10790);

        // Simulate 12 failures → Permanent
        user.consecutiveFailedLoginAttempts = 12;
        stage = determineLockoutStage(user.consecutiveFailedLoginAttempts);
        expect(stage).toBe(3);
        
        lockout = computeNextLockout(stage);
        user.isPermanentlyLocked = lockout.permanent;
        user.lockoutExpiresAt = lockout.expiresAt;
        
        remaining = remainingLockout(user);
        expect(remaining.permanent).toBe(true);
        expect(remaining.remainingSeconds).toBe(-1);
    });

    it('should simulate successful unlock and reset', () => {
        const user = {
            consecutiveFailedLoginAttempts: 6,
            lockoutStage: 1,
            isPermanentlyLocked: false,
            lockoutExpiresAt: new Date(Date.now() + 3600 * 1000)
        };

        // Verify user is locked
        let remaining = remainingLockout(user);
        expect(remaining.permanent).toBe(false);
        expect(remaining.remainingSeconds).toBeGreaterThan(0);

        // Admin unlocks
        user.consecutiveFailedLoginAttempts = 0;
        user.lockoutStage = 0;
        user.lockoutExpiresAt = null;
        user.isPermanentlyLocked = false;

        // Verify user is unlocked
        remaining = remainingLockout(user);
        expect(remaining).toBeNull();
    });

    it('should simulate success reset after lockout', () => {
        const user = {
            consecutiveFailedLoginAttempts: 5,
            lockoutStage: 0,
            isPermanentlyLocked: false,
            lockoutExpiresAt: new Date(Date.now() - 1000) // Expired
        };

        // Lockout expired, user logs in successfully
        user.consecutiveFailedLoginAttempts = 0;
        user.lockoutStage = 0;
        user.lockoutExpiresAt = null;
        user.isPermanentlyLocked = false;

        // Verify counters reset
        expect(user.consecutiveFailedLoginAttempts).toBe(0);
        expect(user.lockoutStage).toBe(0);
        expect(user.isPermanentlyLocked).toBe(false);
        
        const remaining = remainingLockout(user);
        expect(remaining).toBeNull();
    });
});
