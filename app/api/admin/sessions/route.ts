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

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const active = searchParams.get('active')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (active === 'true') {
      where.expiresAt = { gt: new Date() }
      where.revokedAt = null
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
            },
          },
        },
      }),
      prisma.session.count({ where }),
    ])

    return Response.json({ sessions, total, limit, offset })
  } catch (error) {
    console.error('List sessions error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
