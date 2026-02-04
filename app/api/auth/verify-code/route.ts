import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { otpRateLimit } from '@/lib/redis'
import { verifyOTP, addSecurityDelay } from '@/lib/auth/otp'
import { createSession } from '@/lib/auth/session'
import { setCSRFToken } from '@/lib/auth/csrf'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { verifyCodeSchema } from '@/lib/validations'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 30

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()

  try {
    // Rate limiting
    const { success, remaining } = await otpRateLimit.limit(ip)
    if (!success) {
      await createAuditLog({
        eventType: 'RATE_LIMIT_HIT',
        actorType: 'anonymous',
        action: 'Rate limit exceeded on OTP verification',
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
      await addSecurityDelay()
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    const { code } = parsed.data

    // Find all potentially matching access codes (not expired, not revoked)
    // We need to check all codes first, then handle lockout per-code
    const accessCodes = await prisma.accessCode.findMany({
      where: {
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
      include: {
        client: true,
      },
    })

    // Add security delay regardless of outcome
    await addSecurityDelay()

    // Check each code using timing-safe comparison
    let matchedCode = null
    for (const ac of accessCodes) {
      const isValid = await verifyOTP(code, ac.codeHash)
      if (isValid) {
        matchedCode = ac
        break
      }
    }

    if (!matchedCode) {
      await createAuditLog({
        eventType: 'OTP_FAILED',
        actorType: 'anonymous',
        action: 'Invalid OTP attempt',
        ipAddress: ip,
        userAgent,
        meta: { codeHint: code.slice(-4), remaining },
      })
      return createErrorResponse('INVALID_OTP', requestId)
    }

    // Check if this access code is locked
    if (matchedCode.lockedUntil && matchedCode.lockedUntil > new Date()) {
      await createAuditLog({
        eventType: 'OTP_LOCKED',
        actorType: 'anonymous',
        action: 'Access code is locked due to failed attempts',
        resourceType: 'access_code',
        resourceId: matchedCode.id,
        ipAddress: ip,
        userAgent,
        meta: { lockedUntil: matchedCode.lockedUntil.toISOString() },
      })
      return createErrorResponse('OTP_LOCKED', requestId)
    }

    // Check if max uses exceeded
    if (matchedCode.usedCount >= matchedCode.maxUses) {
      // Increment failed attempts and potentially lock
      const newFailedAttempts = matchedCode.failedAttempts + 1
      const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS
      
      await prisma.accessCode.update({
        where: { id: matchedCode.id },
        data: {
          failedAttempts: newFailedAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
            : null,
        },
      })

      if (shouldLock) {
        await createAuditLog({
          eventType: 'OTP_LOCKED',
          actorType: 'system',
          action: 'Access code locked after max failed attempts',
          resourceType: 'access_code',
          resourceId: matchedCode.id,
          ipAddress: ip,
          userAgent,
          meta: { failedAttempts: newFailedAttempts },
        })
      }

      return createErrorResponse('INVALID_OTP', requestId)
    }

    // Update usage count and reset failed attempts on success
    await prisma.accessCode.update({
      where: { id: matchedCode.id },
      data: {
        usedCount: { increment: 1 },
        failedAttempts: 0,
        lockedUntil: null,
        lastUsedAt: new Date(),
        lastUsedIp: ip,
      },
    })

    // Create session with rotation (revokes any existing sessions from same access code)
    await createSession(
      matchedCode.clientId,
      matchedCode.id,
      ip,
      userAgent,
      true // rotate existing sessions
    )

    // Set CSRF token for subsequent requests
    const csrfToken = await setCSRFToken()

    // Log successful verification
    await createAuditLog({
      eventType: 'OTP_VERIFIED',
      actorType: 'client',
      actorId: matchedCode.clientId,
      action: 'OTP verified successfully',
      resourceType: 'access_code',
      resourceId: matchedCode.id,
      ipAddress: ip,
      userAgent,
    })

    await createAuditLog({
      eventType: 'SESSION_CREATED',
      actorType: 'system',
      action: 'Session created after OTP verification',
      resourceType: 'client',
      resourceId: matchedCode.clientId,
      ipAddress: ip,
      userAgent,
    })

    return Response.json({
      success: true,
      redirect: `/portal/${matchedCode.client.portalSlug}`,
      csrfToken, // Client needs this for subsequent POST requests
    })
  } catch (error) {
    console.error('OTP verification error:', error)
    await addSecurityDelay()
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
