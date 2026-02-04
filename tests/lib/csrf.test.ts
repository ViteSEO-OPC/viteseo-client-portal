import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateCSRFToken } from '@/lib/auth/csrf'

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

describe('CSRF Token Generation', () => {
  it('should generate a 64-character hex token', () => {
    const token = generateCSRFToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[a-f0-9]+$/)
  })

  it('should generate unique tokens', () => {
    const tokens = new Set<string>()
    for (let i = 0; i < 100; i++) {
      tokens.add(generateCSRFToken())
    }
    expect(tokens.size).toBe(100)
  })
})
