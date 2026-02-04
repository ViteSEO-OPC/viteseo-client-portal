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

    const session = await prisma.session.findUnique({
      where: { id },
      include: { client: { select: { companyName: true } } },
    })

    if (!session) {
      return createErrorResponse('NOT_FOUND', requestId)
    }

    await prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    })

    const userAgent = await getUserAgent()
    await createAuditLog({
      eventType: 'SESSION_REVOKED',
      actorType: 'admin',
      actorId: userId,
      action: `Revoked session for ${session.client.companyName}`,
      resourceType: 'session',
      resourceId: id,
      ipAddress: ip,
      userAgent,
      meta: { clientId: session.clientId },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Revoke session error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
