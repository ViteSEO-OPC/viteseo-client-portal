import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment variables
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
  process.env.SESSION_SECRET = 'test-session-secret-at-least-32-chars'
  process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-32-chars'
  process.env.APP_URL = 'http://localhost:3000'
})

afterAll(() => {
  vi.clearAllMocks()
})
