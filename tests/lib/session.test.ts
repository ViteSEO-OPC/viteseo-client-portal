import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashSessionToken, generateSessionToken } from '@/lib/auth/otp'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

describe('Session Token', () => {
  it('should generate 64-character hex token', () => {
    const token = generateSessionToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[a-f0-9]+$/)
  })

  it('should hash consistently', () => {
    const token = generateSessionToken()
    const hash1 = hashSessionToken(token)
    const hash2 = hashSessionToken(token)
    expect(hash1).toBe(hash2)
  })

  it('should produce 64-character hash', () => {
    const token = generateSessionToken()
    const hash = hashSessionToken(token)
    expect(hash).toHaveLength(64)
  })
})

describe('Session Token Security', () => {
  it('should produce different hashes for different tokens', () => {
    const token1 = generateSessionToken()
    const token2 = generateSessionToken()
    const hash1 = hashSessionToken(token1)
    const hash2 = hashSessionToken(token2)
    expect(hash1).not.toBe(hash2)
  })
})
