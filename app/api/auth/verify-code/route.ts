import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { otpRateLimit } from '@/lib/redis'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { verifyCodeSchema } from '@/lib/validations'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

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
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    const { code } = parsed.data
    const normalizedCode = code.toUpperCase().trim()

    // Check if code exists in database (simple lookup)
    const accessCode = await prisma.accessCode.findUnique({
      where: { code: normalizedCode },
    })

    // Code not found
    if (!accessCode) {
      await createAuditLog({
        eventType: 'CODE_INVALID',
        actorType: 'anonymous',
        action: 'Invalid access code attempt',
        ipAddress: ip,
        userAgent,
        meta: { codeAttempt: normalizedCode.slice(0, 4) + '****' },
      })
      return NextResponse.json(
        { success: false, error: 'Invalid access code' },
        { status: 401 }
      )
    }

    // Check if code is active
    if (!accessCode.isActive) {
      return NextResponse.json(
        { success: false, error: 'This access code has been deactivated' },
        { status: 401 }
      )
    }

    // Check if code is expired
    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This access code has expired' },
        { status: 401 }
      )
    }

    // Check if code is locked due to too many failed attempts
    if (accessCode.lockedUntil && accessCode.lockedUntil > new Date()) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Check max uses
    if (accessCode.usedCount >= accessCode.maxUses) {
      return NextResponse.json(
        { success: false, error: 'This access code has reached its maximum usage limit' },
        { status: 401 }
      )
    }

    // Success - Update usage count
    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: {
        usedCount: { increment: 1 },
        failedAttempts: 0,
        lockedUntil: null,
      },
    })

    // Log successful verification
    await createAuditLog({
      eventType: 'CODE_VERIFIED',
      actorType: 'client',
      actorId: accessCode.clientSlug,
      action: 'Access code verified successfully',
      resourceType: 'access_code',
      resourceId: accessCode.id,
      ipAddress: ip,
      userAgent,
    })

    // Redirect to client's portal using the clientSlug
    return NextResponse.json({
      success: true,
      redirect: `/portal/${accessCode.clientSlug}`,
      clientSlug: accessCode.clientSlug,
    })
  } catch (error) {
    console.error('Code verification error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
