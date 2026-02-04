import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import argon2 from 'argon2'

// Characters excluding ambiguous ones (0/O, 1/I/l)
const OTP_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const OTP_LENGTH = 8

export function generateOTP(): string {
  const bytes = randomBytes(OTP_LENGTH)
  let otp = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += OTP_CHARS[bytes[i] % OTP_CHARS.length]
  }
  return otp
}

export function getCodeHint(code: string): string {
  return code.slice(-4)
}

export async function hashOTP(otp: string): Promise<string> {
  return argon2.hash(otp.toUpperCase(), {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  })
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, otp.toUpperCase())
  } catch {
    return false
  }
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

// Timing-safe string comparison
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return timingSafeEqual(bufA, bufB)
}

// Add artificial delay to prevent timing attacks (200-500ms)
export async function addSecurityDelay(): Promise<void> {
  const delay = 200 + Math.random() * 300
  await new Promise((resolve) => setTimeout(resolve, delay))
}
