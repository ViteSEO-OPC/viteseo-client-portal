import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { portalRateLimit } from '@/lib/redis'
import { getSession } from '@/lib/auth/session'
import { validateCSRFToken } from '@/lib/auth/csrf'
import { createErrorResponse } from '@/lib/errors'
import { createAuditLog } from '@/lib/audit'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()

  try {
    const { success } = await portalRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Validate CSRF token
    const isValidCSRF = await validateCSRFToken(request)
    if (!isValidCSRF) {
      return createErrorResponse('CSRF_INVALID', requestId)
    }

    const session = await getSession()
    if (!session) {
      return createErrorResponse('NOT_FOUND', requestId)
    }

    // Get the client's current quote
    const quote = await prisma.quote.findFirst({
      where: {
        clientId: session.clientId,
        status: { in: ['sent', 'viewed', 'accepted', 'rejected'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Mark all admin messages as read
    const result = await prisma.message.updateMany({
      where: {
        quoteId: quote.id,
        senderType: 'admin',
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    if (result.count > 0) {
      await createAuditLog({
        eventType: 'MESSAGES_READ',
        actorType: 'client',
        actorId: session.clientId,
        action: `Client marked ${result.count} message(s) as read`,
        resourceType: 'quote',
        resourceId: quote.id,
        ipAddress: ip,
        userAgent,
        meta: { count: result.count },
      })
    }

    return Response.json({
      success: true,
      markedAsRead: result.count,
    })
  } catch (error) {
    console.error('Mark messages read error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
