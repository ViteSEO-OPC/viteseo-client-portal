import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { generateQuotePDF, getCachedPDF, cachePDF } from '@/lib/pdf/generator'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

// Separate TTL for internal render tokens (used by Playwright)
const INTERNAL_RENDER_TOKEN_TTL = 30 * 1000 // 30 seconds

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return createErrorResponse('UNAUTHORIZED', requestId)
  }

  try {
    // Validate token
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const pdfToken = await prisma.pdfRenderToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: {
        quote: {
          include: {
            client: true,
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!pdfToken) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { quote } = pdfToken

    // Check for cached PDF first - if we have a valid cache, use it and mark token used
    if (quote.contentHash) {
      const cachedPdf = await getCachedPDF(quote.id, quote.contentHash)
      if (cachedPdf) {
        // Mark original token as used
        await prisma.pdfRenderToken.update({
          where: { id: pdfToken.id },
          data: { usedAt: new Date() },
        })

        return new Response(cachedPdf, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${quote.quoteNumber}.pdf"`,
            'Cache-Control': 'private, no-store',
          },
        })
      }
    }

    // Create a new internal render token for Playwright to use
    // This avoids the issue where the original token gets marked used before PDF generation
    const internalToken = randomBytes(32).toString('hex')
    const internalTokenHash = createHash('sha256').update(internalToken).digest('hex')

    await prisma.pdfRenderToken.create({
      data: {
        quoteId: quote.id,
        clientId: pdfToken.clientId,
        tokenHash: internalTokenHash,
        expiresAt: new Date(Date.now() + INTERNAL_RENDER_TOKEN_TTL),
      },
    })

    // Mark the original client token as used
    await prisma.pdfRenderToken.update({
      where: { id: pdfToken.id },
      data: { usedAt: new Date() },
    })

    // Generate new PDF using the internal token
    const result = await generateQuotePDF(quote.id, quote.clientId, internalToken)

    // Mark internal token as used
    await prisma.pdfRenderToken.updateMany({
      where: { tokenHash: internalTokenHash },
      data: { usedAt: new Date() },
    })

    if (!result.success || !result.pdfBuffer) {
      return createErrorResponse('PDF_GENERATION_FAILED', requestId)
    }

    // Cache the PDF
    if (quote.contentHash) {
      await cachePDF(quote.id, quote.contentHash, result.pdfBuffer)
    }

    return new Response(result.pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.quoteNumber}.pdf"`,
        'Content-Length': result.pdfBuffer.length.toString(),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('PDF render error:', error)
    return createErrorResponse('PDF_GENERATION_FAILED', requestId)
  }
}
