import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { validateCSRFToken } from '@/lib/auth/csrf'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()

  try {
    // Validate CSRF token
    const csrfValid = await validateCSRFToken(request)
    if (!csrfValid) {
      return createErrorResponse('CSRF_INVALID', requestId)
    }

    // Check session
    const session = await getSession()
    if (!session) {
      return createErrorResponse('SESSION_EXPIRED', requestId)
    }

    // Get the quote that can be accepted (must be in 'viewed' status)
    const quote = await prisma.quote.findFirst({
      where: {
        clientId: session.clientId,
        status: 'viewed',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!quote) {
      // Check if there's a quote with a different status
      const existingQuote = await prisma.quote.findFirst({
        where: {
          clientId: session.clientId,
          status: { in: ['accepted', 'rejected'] },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingQuote) {
        return createErrorResponse('QUOTE_ALREADY_ACTIONED', requestId)
      }

      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Check if quote is expired
    if (quote.validUntil < new Date()) {
      // Update status to expired
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'expired' },
      })
      return createErrorResponse('QUOTE_EXPIRED', requestId)
    }

    // Update quote status to accepted
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'accepted' },
    })

    // Log the acceptance
    await createAuditLog({
      eventType: 'QUOTE_ACCEPTED',
      actorType: 'client',
      actorId: session.clientId,
      action: 'Quote accepted by client',
      resourceType: 'quote',
      resourceId: quote.id,
      ipAddress: ip,
      userAgent,
      meta: { sessionId: session.sessionId, quoteNumber: quote.quoteNumber },
    })

    return Response.json({
      success: true,
      message: 'Quote accepted successfully',
    })
  } catch (error) {
    console.error('Quote acceptance error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
