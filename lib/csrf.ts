import { cookies } from 'next/headers'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

const CSRF_COOKIE_NAME = '__csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

function getSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('CSRF_SECRET or SESSION_SECRET must be set')
  }
  return secret
}

function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex')
}

function signToken(token: string): string {
  const hmac = createHmac('sha256', getSecret())
  hmac.update(token)
  return `${token}.${hmac.digest('hex')}`
}

function verifySignedToken(signedToken: string): string | null {
  const parts = signedToken.split('.')
  if (parts.length !== 2) {
    return null
  }

  const [token, signature] = parts
  const hmac = createHmac('sha256', getSecret())
  hmac.update(token)
  const expectedSignature = hmac.digest('hex')

  try {
    if (timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return token
    }
  } catch {
    return null
  }

  return null
}

export async function generateCSRFToken(): Promise<string> {
  const token = generateToken()
  const signedToken = signToken(token)

  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours
  })

  return token
}

export async function validateCSRFToken(headerToken: string | null): Promise<boolean> {
  if (!headerToken) {
    return false
  }

  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!cookieValue) {
    return false
  }

  const cookieToken = verifySignedToken(cookieValue)
  if (!cookieToken) {
    return false
  }

  try {
    return timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken))
  } catch {
    return false
  }
}

export function getCSRFHeader(): string {
  return CSRF_HEADER_NAME
}
