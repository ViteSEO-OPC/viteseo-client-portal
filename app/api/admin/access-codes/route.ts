import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createErrorResponse } from '@/lib/errors'
import { createAccessCodeSchema } from '@/lib/validations'
import { generateOTP, hashOTP, getCodeHint } from '@/lib/auth/otp'
import { createAuditLog } from '@/lib/audit'
import { generateRequestId } from '@/lib/utils'
import { getClientIP } from '@/lib/server-utils'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()

  try {
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const accessCodes = await prisma.accessCode.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clientId: true,
        quoteId: true,
        codeHint: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        revokedAt: true,
        createdAt: true,
        client: {
          select: { companyName: true },
        },
      },
    })

    return Response.json(accessCodes)
  } catch (error) {
    console.error('List access codes error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()

  try {
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    const body = await request.json()
    const parsed = createAccessCodeSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    const { clientId, quoteId, expiresInHours, maxUses } = parsed.data

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Client not found' } },
        { status: 400 }
      )
    }

    // Generate OTP
    const plainCode = generateOTP()
    const codeHash = await hashOTP(plainCode)
    const codeHint = getCodeHint(plainCode)

    const accessCode = await prisma.accessCode.create({
      data: {
        clientId,
        quoteId,
        codeHash,
        codeHint,
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
        maxUses,
      },
    })

    // Log access code creation
    await createAuditLog({
      eventType: 'ACCESS_CODE_CREATED',
      actorType: 'admin',
      actorId: userId,
      action: 'Created access code',
      resourceType: 'access_code',
      resourceId: accessCode.id,
      ipAddress: ip,
      meta: { clientId },
    })

    // Return the plain code ONLY on creation (never stored in plaintext)
    return Response.json({
      id: accessCode.id,
      code: plainCode, // Only returned once!
      codeHint: accessCode.codeHint,
      expiresAt: accessCode.expiresAt,
      maxUses: accessCode.maxUses,
      portalUrl: `${process.env.APP_URL}/enter-code`,
    })
  } catch (error) {
    console.error('Create access code error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
