import { describe, it, expect } from 'vitest'
import {
  generateOTP,
  hashOTP,
  verifyOTP,
  getCodeHint,
  generateSessionToken,
  hashSessionToken,
  timingSafeCompare,
} from '@/lib/auth/otp'

describe('OTP Generation', () => {
  it('should generate an 8-character OTP', () => {
    const otp = generateOTP()
    expect(otp).toHaveLength(8)
  })

  it('should only contain allowed characters', () => {
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const otp = generateOTP()
    for (const char of otp) {
      expect(allowedChars).toContain(char)
    }
  })

  it('should not contain ambiguous characters', () => {
    const ambiguousChars = '0O1Il'
    for (let i = 0; i < 100; i++) {
      const otp = generateOTP()
      for (const char of otp) {
        expect(ambiguousChars).not.toContain(char)
      }
    }
  })

  it('should generate unique OTPs', () => {
    const otps = new Set<string>()
    for (let i = 0; i < 100; i++) {
      otps.add(generateOTP())
    }
    expect(otps.size).toBe(100)
  })
})

describe('OTP Hashing', () => {
  it('should hash OTP with Argon2id', async () => {
    const otp = generateOTP()
    const hash = await hashOTP(otp)
    expect(hash).toContain('$argon2id$')
  })

  it('should produce different hashes for same OTP', async () => {
    const otp = generateOTP()
    const hash1 = await hashOTP(otp)
    const hash2 = await hashOTP(otp)
    expect(hash1).not.toBe(hash2) // Due to different salts
  })
})

describe('OTP Verification', () => {
  it('should verify correct OTP', async () => {
    const otp = generateOTP()
    const hash = await hashOTP(otp)
    const isValid = await verifyOTP(otp, hash)
    expect(isValid).toBe(true)
  })

  it('should reject incorrect OTP', async () => {
    const otp = generateOTP()
    const hash = await hashOTP(otp)
    const isValid = await verifyOTP('WRONGOTP', hash)
    expect(isValid).toBe(false)
  })

  it('should be case insensitive', async () => {
    const otp = generateOTP()
    const hash = await hashOTP(otp)
    const isValidLower = await verifyOTP(otp.toLowerCase(), hash)
    expect(isValidLower).toBe(true)
  })
})

describe('Code Hint', () => {
  it('should return last 4 characters', () => {
    const code = 'ABCD1234'
    const hint = getCodeHint(code)
    expect(hint).toBe('1234')
  })
})

describe('Session Token', () => {
  it('should generate a 64-character hex token', () => {
    const token = generateSessionToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[a-f0-9]+$/)
  })

  it('should hash session token with SHA-256', () => {
    const token = generateSessionToken()
    const hash = hashSessionToken(token)
    expect(hash).toHaveLength(64)
  })

  it('should produce consistent hashes', () => {
    const token = generateSessionToken()
    const hash1 = hashSessionToken(token)
    const hash2 = hashSessionToken(token)
    expect(hash1).toBe(hash2)
  })
})

describe('Timing Safe Compare', () => {
  it('should return true for equal strings', () => {
    expect(timingSafeCompare('test', 'test')).toBe(true)
  })

  it('should return false for different strings', () => {
    expect(timingSafeCompare('test', 'tset')).toBe(false)
  })

  it('should return false for different length strings', () => {
    expect(timingSafeCompare('test', 'testing')).toBe(false)
  })
})
