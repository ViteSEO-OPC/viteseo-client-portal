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
    const eventType = searchParams.get('eventType')
    const actorType = searchParams.get('actorType')
    const resourceType = searchParams.get('resourceType')
    const resourceId = searchParams.get('resourceId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (eventType) where.eventType = eventType
    if (actorType) where.actorType = actorType
    if (resourceType) where.resourceType = resourceType
    if (resourceId) where.resourceId = resourceId

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return Response.json({ logs, total, limit, offset })
  } catch (error) {
    console.error('List audit logs error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
