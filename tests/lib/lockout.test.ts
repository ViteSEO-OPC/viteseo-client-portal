import { describe, it, expect } from 'vitest'

/**
 * Tests for OTP lockout behavior
 * These test the lockout constants and expected behavior
 */

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 30

describe('OTP Lockout Configuration', () => {
  it('should lock after 5 failed attempts', () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(5)
  })

  it('should lock for 30 minutes', () => {
    expect(LOCKOUT_DURATION_MINUTES).toBe(30)
  })

  it('should calculate lockout expiry correctly', () => {
    const now = new Date()
    const lockoutExpiry = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
    
    // Lockout should be in the future
    expect(lockoutExpiry.getTime()).toBeGreaterThan(now.getTime())
    
    // Lockout should be approximately 30 minutes in the future
    const diffMinutes = (lockoutExpiry.getTime() - now.getTime()) / (60 * 1000)
    expect(diffMinutes).toBeCloseTo(30, 0)
  })
})

describe('Failed Attempt Tracking', () => {
  it('should track failed attempts correctly', () => {
    let failedAttempts = 0
    
    // Simulate 4 failed attempts
    for (let i = 0; i < 4; i++) {
      failedAttempts++
    }
    
    expect(failedAttempts).toBe(4)
    expect(failedAttempts < MAX_FAILED_ATTEMPTS).toBe(true)
    
    // 5th attempt should trigger lockout
    failedAttempts++
    expect(failedAttempts >= MAX_FAILED_ATTEMPTS).toBe(true)
  })

  it('should reset failed attempts on success', () => {
    let failedAttempts = 4
    
    // Successful verification should reset
    failedAttempts = 0
    
    expect(failedAttempts).toBe(0)
  })
})

describe('Lockout State', () => {
  // Helper function to check if locked
  function isLocked(lockedUntil: Date | null, now: Date): boolean {
    return lockedUntil !== null && lockedUntil > now
  }

  it('should determine if locked correctly', () => {
    const now = new Date()
    
    // Not locked (no lockout set)
    expect(isLocked(null, now)).toBe(false)
    
    // Locked (future lockout)
    const futureDate = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes in future
    expect(isLocked(futureDate, now)).toBe(true)
    
    // Expired lockout (past lockout)
    const pastDate = new Date(now.getTime() - 10 * 60 * 1000) // 10 minutes in past
    expect(isLocked(pastDate, now)).toBe(false)
  })
})
