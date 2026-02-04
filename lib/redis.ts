import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// OTP verification: 5 attempts per 15 minutes
export const otpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:otp',
})

// Portal API: 60 requests per minute
export const portalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:portal',
})

// PDF generation: 10 requests per hour
export const pdfRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:pdf',
})

// Admin API: 120 requests per minute
export const adminRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, '1 m'),
  analytics: true,
  prefix: 'ratelimit:admin',
})
