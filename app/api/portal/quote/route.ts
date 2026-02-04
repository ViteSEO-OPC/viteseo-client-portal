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
    // Rate limiting
    const { success } = await portalRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Check session
    const session = await getSession()
    if (!session) {
      return createErrorResponse('SESSION_EXPIRED', requestId)
    }

    // Get latest viewable quote
    const quote = await prisma.quote.findFirst({
      where: {
        clientId: session.clientId,
        status: { in: ['sent', 'viewed'] },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Check if quote is expired
    if (quote.validUntil < new Date()) {
      return createErrorResponse('QUOTE_EXPIRED', requestId)
    }

    return Response.json({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      version: quote.version,
      status: quote.status,
      validUntil: quote.validUntil.toISOString(),
      total: quote.total.toString(),
      items: quote.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      })),
    })
  } catch (error) {
    console.error('Get quote error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
