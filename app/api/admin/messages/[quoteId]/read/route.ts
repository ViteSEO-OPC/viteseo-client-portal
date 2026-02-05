import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createErrorResponse } from '@/lib/errors'
import { createAuditLog } from '@/lib/audit'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

interface RouteParams {
  params: Promise<{ quoteId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  const { quoteId } = await params

  try {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/[quoteId]/read/route.ts:entry',message:'read route entry',data:{quoteId,hasIp:!!ip},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/[quoteId]/read/route.ts:rateLimit',message:'rate limit result',data:{quoteId,success},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (!success) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/[quoteId]/read/route.ts:rateLimited',message:'rate limited',data:{quoteId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Verify quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { id: true },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Mark all client messages as read
    const result = await prisma.message.updateMany({
      where: {
        quoteId,
        senderType: 'client',
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/[quoteId]/read/route.ts:updateMany',message:'updateMany completed',data:{quoteId,count:result.count},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    if (result.count > 0) {
      await createAuditLog({
        eventType: 'MESSAGES_READ',
        actorType: 'admin',
        actorId: userId,
        action: `Admin marked ${result.count} message(s) as read`,
        resourceType: 'quote',
        resourceId: quoteId,
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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/messages/[quoteId]/read/route.ts:catch',message:'read route error',data:{quoteId,hasError:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('Mark messages read error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
