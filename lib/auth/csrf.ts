import { cookies } from 'next/headers'
import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

const CSRF_COOKIE_NAME = '__vite_csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Hash a CSRF token for comparison
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Set CSRF cookie with a new token
 * Returns the token to be included in forms/requests
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken()
  const cookieStore = await cookies()
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours, same as session
  })
  
  return token
}

/**
 * Get the current CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null
}

/**
 * Validate CSRF token using double-submit cookie pattern
 * Compares the token from the header with the token from the cookie
 * Uses timing-safe comparison to prevent timing attacks
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  
  if (!headerToken || !cookieToken) {
    return false
  }
  
  // Use timing-safe comparison
  const headerHash = hashToken(headerToken)
  const cookieHash = hashToken(cookieToken)
  
  if (headerHash.length !== cookieHash.length) {
    return false
  }
  
  try {
    return timingSafeEqual(Buffer.from(headerHash), Buffer.from(cookieHash))
  } catch {
    return false
  }
}

/**
 * Clear CSRF cookie
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_COOKIE_NAME)
}
