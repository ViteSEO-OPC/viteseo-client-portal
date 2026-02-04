import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { hashSessionToken, generateSessionToken } from './otp'

const SESSION_COOKIE_NAME = '__vite_session'
const SESSION_MAX_AGE = 4 * 60 * 60 * 1000 // 4 hours
const MAX_CONCURRENT_SESSIONS = 2

export interface SessionData {
  sessionId: string
  clientId: string
  accessCodeId: string
}

export async function createSession(
  clientId: string,
  accessCodeId: string,
  ipAddress: string,
  userAgent?: string,
  rotateExisting: boolean = true
): Promise<string> {
  // Session rotation: revoke any existing sessions from the same access code
  if (rotateExisting) {
    await prisma.session.updateMany({
      where: {
        accessCodeId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  // Enforce concurrent session limit
  const activeSessions = await prisma.session.findMany({
    where: {
      clientId,
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Revoke oldest sessions if limit exceeded
  if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
    const sessionsToRevoke = activeSessions.slice(0, activeSessions.length - MAX_CONCURRENT_SESSIONS + 1)
    await prisma.session.updateMany({
      where: {
        id: { in: sessionsToRevoke.map((s) => s.id) },
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE)

  await prisma.session.create({
    data: {
      clientId,
      accessCodeId,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
      lastActiveAt: new Date(),
    },
  })

  // Set httpOnly cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE / 1000,
    path: '/',
  })

  return token
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const tokenHash = hashSessionToken(token)

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
    include: {
      accessCode: true,
    },
  })

  if (!session) {
    return null
  }

  // Check if access code is still valid
  if (
    (session.accessCode.expiresAt && session.accessCode.expiresAt < new Date()) ||
    session.accessCode.revokedAt !== null
  ) {
    await revokeSession(session.id)
    return null
  }

  return {
    sessionId: session.id,
    clientId: session.clientId,
    accessCodeId: session.accessCodeId,
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllClientSessions(clientId: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      clientId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
