import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
import { adminRateLimit } from '@/lib/redis'

// Preview token TTL: 5 minutes
const PREVIEW_TOKEN_TTL = 5 * 60 * 1000

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()

  try {
    // Verify admin authentication
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    // Rate limiting
    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Parse request body
    const body = await request.json()
    const { quoteId, clientSlug } = body

    if (!quoteId || !clientSlug) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    // Verify the quote exists and belongs to the client
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        client: {
          portalSlug: clientSlug,
        },
      },
      include: {
        client: {
          select: { companyName: true, portalSlug: true },
        },
      },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Generate preview token
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    await prisma.adminPreviewToken.create({
      data: {
        quoteId: quote.id,
        clientSlug: quote.client.portalSlug,
        adminId: userId,
        tokenHash,
        expiresAt: new Date(Date.now() + PREVIEW_TOKEN_TTL),
      },
    })

    // Log admin preview action
    await createAuditLog({
      eventType: 'ADMIN_PREVIEW',
      actorType: 'admin',
      actorId: userId,
      action: `Generated preview token for ${quote.client.companyName}`,
      resourceType: 'quote',
      resourceId: quote.id,
      ipAddress: ip,
      userAgent,
      meta: { clientSlug, quoteNumber: quote.quoteNumber },
    })

    const baseUrl = request.nextUrl.origin
    const previewUrl = `${baseUrl}/portal/${clientSlug}?preview=${token}`

    return Response.json({
      success: true,
      previewUrl,
      expiresIn: PREVIEW_TOKEN_TTL / 1000,
    })
  } catch (error) {
    console.error('Preview token generation error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
