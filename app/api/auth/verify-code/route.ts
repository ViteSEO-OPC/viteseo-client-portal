import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { otpRateLimit } from '@/lib/redis'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { verifyCodeSchema } from '@/lib/validations'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
import { verifyOTP, addSecurityDelay } from '@/lib/auth/otp'
import { createSession } from '@/lib/auth/session'
import { setCSRFToken } from '@/lib/auth/csrf'

export const runtime = 'nodejs'

// Lockout configuration
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  try {
    // Rate limiting
    const { success } = await otpRateLimit.limit(ip)
    if (!success) {
      await createAuditLog({
        eventType: 'RATE_LIMIT_HIT',
        actorType: 'anonymous',
        action: 'Rate limit exceeded on code verification',
        ipAddress: ip,
        userAgent,
        meta: { endpoint: '/api/auth/verify-code' },
      })
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Parse and validate request body
    const body = await request.json()
    const parsed = verifyCodeSchema.safeParse(body)

    if (!parsed.success) {
      // Add security delay even on validation error
      await addSecurityDelay()
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    const { code } = parsed.data
    const normalizedCode = code.toUpperCase().trim()

    // Check if code exists in database (simple lookup for plain code)
    // First try plain code match, then fall back to hash verification if codeHash exists
    let accessCode = await prisma.accessCode.findUnique({
      where: { code: normalizedCode },
      include: { client: true },
    })

    // If not found by plain code, search by codeHash if the feature is enabled
    if (!accessCode) {
      // Look for access codes that might use hash verification
      const accessCodesWithHash = await prisma.accessCode.findMany({
        where: {
          codeHash: { not: null },
          isActive: true,
        },
        include: { client: true },
      })

      // Verify against each hash (timing-safe)
      for (const ac of accessCodesWithHash) {
        if (ac.codeHash && await verifyOTP(normalizedCode, ac.codeHash)) {
          accessCode = ac
          break
        }
      }
    }

    // Code not found - add security delay and return 404 (per spec)
    if (!accessCode) {
      await addSecurityDelay()
      await createAuditLog({
        eventType: 'OTP_FAILED',
        actorType: 'anonymous',
        action: 'Invalid access code attempt',
        ipAddress: ip,
        userAgent,
        meta: { codeAttempt: normalizedCode.slice(0, 4) + '****' },
      })
      // Return 404 to avoid information leakage about valid codes
      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'Invalid access code', requestId } },
        { status: 404 }
      )
    }

    // Check if code is locked due to too many failed attempts
    if (accessCode.lockedUntil && accessCode.lockedUntil > new Date()) {
      await addSecurityDelay()
      const remainingMinutes = Math.ceil((accessCode.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { 
          error: { 
            code: 'OTP_LOCKED', 
            message: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
            requestId 
          } 
        },
        { status: 429 }
      )
    }

    // Check if code is active
    if (!accessCode.isActive) {
      await addSecurityDelay()
      await handleFailedAttempt(accessCode.id, ip, userAgent)
      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'This access code has been deactivated', requestId } },
        { status: 404 }
      )
    }

    // Check if code is expired (24-72 hours is recommended)
    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      await addSecurityDelay()
      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'This access code has expired', requestId } },
        { status: 404 }
      )
    }

    // Check if code is revoked
    if (accessCode.revokedAt) {
      await addSecurityDelay()
      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'This access code has been revoked', requestId } },
        { status: 404 }
      )
    }

    // Check max uses
    if (accessCode.usedCount >= accessCode.maxUses) {
      await addSecurityDelay()
      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'This access code has reached its maximum usage limit', requestId } },
        { status: 404 }
      )
    }

    // Verify we have a valid client
    if (!accessCode.clientId || !accessCode.client) {
      await addSecurityDelay()
      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'Invalid access code configuration', requestId } },
        { status: 404 }
      )
    }

    // Success! Add security delay (200-500ms per spec)
    await addSecurityDelay()

    // Update usage count and reset failed attempts
    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: {
        usedCount: { increment: 1 },
        failedAttempts: 0,
        lockedUntil: null,
      },
    })

    // Create session (with rotation of existing sessions)
    await createSession(
      accessCode.clientId,
      accessCode.id,
      ip,
      userAgent,
      true // rotateExisting
    )

    // Set CSRF token
    await setCSRFToken()

    // Log successful verification
    await createAuditLog({
      eventType: 'OTP_VERIFIED',
      actorType: 'client',
      actorId: accessCode.clientId,
      action: 'Access code verified successfully',
      resourceType: 'access_code',
      resourceId: accessCode.id,
      ipAddress: ip,
      userAgent,
    })

    await createAuditLog({
      eventType: 'SESSION_CREATED',
      actorType: 'client',
      actorId: accessCode.clientId,
      action: 'New session created after code verification',
      resourceType: 'access_code',
      resourceId: accessCode.id,
      ipAddress: ip,
      userAgent,
    })

    // Redirect to client's portal
    return NextResponse.json({
      success: true,
      redirect: `/portal/${accessCode.clientSlug}`,
      clientSlug: accessCode.clientSlug,
    })
  } catch (error) {
    console.error('Code verification error:', error)
    await addSecurityDelay()
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

/**
 * Handle failed authentication attempt
 * Increments failed attempts and sets lockout if threshold exceeded
 */
async function handleFailedAttempt(
  accessCodeId: string,
  ip: string,
  userAgent?: string
): Promise<void> {
  const accessCode = await prisma.accessCode.findUnique({
    where: { id: accessCodeId },
  })

  if (!accessCode) return

  const newFailedAttempts = accessCode.failedAttempts + 1
  const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS

  await prisma.accessCode.update({
    where: { id: accessCodeId },
    data: {
      failedAttempts: newFailedAttempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
    },
  })

  if (shouldLock) {
    await createAuditLog({
      eventType: 'OTP_LOCKED',
      actorType: 'anonymous',
      action: `Access code locked after ${MAX_FAILED_ATTEMPTS} failed attempts`,
      resourceType: 'access_code',
      resourceId: accessCodeId,
      ipAddress: ip,
      userAgent,
      meta: { failedAttempts: newFailedAttempts, lockoutMinutes: LOCKOUT_DURATION_MS / 60000 },
    })
  }
}
