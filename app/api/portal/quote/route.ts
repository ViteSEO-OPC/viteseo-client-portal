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

    // Check session - return 404 for unauthenticated requests (per security spec)
    const session = await getSession()
    if (!session) {
      return createErrorResponse('NOT_FOUND', requestId)
    }

    // Get latest viewable quote (including accepted for continued access)
    const quote = await prisma.quote.findFirst({
      where: {
        clientId: session.clientId,
        status: { in: ['sent', 'viewed', 'accepted', 'rejected'] },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Check if quote is expired (but still return data for accepted/rejected)
    const isExpired = quote.validUntil < new Date()
    const effectiveStatus = isExpired && quote.status !== 'accepted' && quote.status !== 'rejected'
      ? 'expired'
      : quote.status

    return Response.json({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      version: quote.version,
      status: effectiveStatus,
      validUntil: quote.validUntil.toISOString(),
      total: quote.total.toString(),
      currency: quote.currency,
      routePath: quote.routePath,
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
