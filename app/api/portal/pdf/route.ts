import { NextRequest } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { pdfRateLimit } from '@/lib/redis'
import { getSession } from '@/lib/auth/session'
import { validateCSRFToken } from '@/lib/auth/csrf'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

// PDF token TTL: 60 seconds
const PDF_TOKEN_TTL = 60 * 1000

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

    // Rate limiting
    const { success } = await pdfRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Check session - return 404 for unauthenticated requests (per security spec)
    const session = await getSession()
    if (!session) {
      return createErrorResponse('NOT_FOUND', requestId)
    }

    // Get latest viewable quote (including accepted for PDF download)
    const quote = await prisma.quote.findFirst({
      where: {
        clientId: session.clientId,
        status: { in: ['sent', 'viewed', 'accepted'] },
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

    // Create short-lived PDF render token
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    await prisma.pdfRenderToken.create({
      data: {
        quoteId: quote.id,
        clientId: session.clientId,
        tokenHash,
        expiresAt: new Date(Date.now() + PDF_TOKEN_TTL),
      },
    })

    // Log PDF download initiation
    await createAuditLog({
      eventType: 'PDF_DOWNLOADED',
      actorType: 'client',
      actorId: session.clientId,
      action: 'Initiated PDF download',
      resourceType: 'quote',
      resourceId: quote.id,
      ipAddress: ip,
      userAgent,
      meta: { sessionId: session.sessionId },
    })

    const baseUrl = request.nextUrl.origin

    return Response.json({
      success: true,
      downloadUrl: `${baseUrl}/api/portal/pdf/render?token=${token}`,
      expiresIn: PDF_TOKEN_TTL / 1000,
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return createErrorResponse('PDF_GENERATION_FAILED', requestId)
  }
}
