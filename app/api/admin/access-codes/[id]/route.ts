import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const accessCode = await prisma.accessCode.findUnique({
      where: { id },
      include: { client: { select: { companyName: true } } },
    })

    if (!accessCode) {
      return createErrorResponse('NOT_FOUND', requestId)
    }

    if (accessCode.revokedAt) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Access code already revoked' } },
        { status: 400 }
      )
    }

    await prisma.accessCode.update({
      where: { id },
      data: { revokedAt: new Date() },
    })

    const userAgent = await getUserAgent()
    await createAuditLog({
      eventType: 'ACCESS_CODE_REVOKED',
      actorType: 'admin',
      actorId: userId,
      action: `Revoked access code for ${accessCode.client.companyName}`,
      resourceType: 'access_code',
      resourceId: id,
      ipAddress: ip,
      userAgent,
      meta: { clientId: accessCode.clientId, quoteId: accessCode.quoteId },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Revoke access code error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
