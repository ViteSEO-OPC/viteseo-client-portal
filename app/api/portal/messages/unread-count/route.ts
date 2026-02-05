import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { portalRateLimit } from '@/lib/redis'
import { getSession } from '@/lib/auth/session'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP } from '@/lib/server-utils'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()

  try {
    const { success } = await portalRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
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
      return Response.json({ count: 0 })
    }

    // Count unread admin messages
    const count = await prisma.message.count({
      where: {
        quoteId: quote.id,
        senderType: 'admin',
        isRead: false,
      },
    })

    return Response.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
