import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date()

    // Delete expired sessions (older than 7 days past expiry)
    const sessionsDeleted = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    })

    // Delete expired access codes (older than 90 days past expiry)
    const accessCodesDeleted = await prisma.accessCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        },
      },
    })

    // Delete expired PDF render tokens (older than 1 day)
    const pdfTokensDeleted = await prisma.pdfRenderToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      },
    })

    // Delete expired PDF cache
    const pdfCacheDeleted = await prisma.pdfCache.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    })

    // Update expired quotes
    const quotesExpired = await prisma.quote.updateMany({
      where: {
        status: { in: ['sent', 'viewed'] },
        validUntil: { lt: now },
      },
      data: {
        status: 'expired',
      },
    })

    return Response.json({
      success: true,
      timestamp: now.toISOString(),
      cleanup: {
        sessionsDeleted: sessionsDeleted.count,
        accessCodesDeleted: accessCodesDeleted.count,
        pdfTokensDeleted: pdfTokensDeleted.count,
        pdfCacheDeleted: pdfCacheDeleted.count,
        quotesExpired: quotesExpired.count,
      },
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return Response.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
