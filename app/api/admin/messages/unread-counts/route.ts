import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP } from '@/lib/server-utils'

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()

  try {
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Get unread counts grouped by quote
    const unreadCounts = await prisma.message.groupBy({
      by: ['quoteId'],
      where: {
        senderType: 'client',
        isRead: false,
      },
      _count: {
        id: true,
      },
    })

    // Transform to a map of quoteId -> count
    const counts: Record<string, number> = {}
    for (const item of unreadCounts) {
      counts[item.quoteId] = item._count.id
    }

    // Also get total unread
    const totalUnread = unreadCounts.reduce((sum, item) => sum + item._count.id, 0)

    return Response.json({
      counts,
      total: totalUnread,
    })
  } catch (error) {
    console.error('Get unread counts error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
