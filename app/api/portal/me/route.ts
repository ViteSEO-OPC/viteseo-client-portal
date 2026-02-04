import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { portalRateLimit } from '@/lib/redis'
import { getSession } from '@/lib/auth/session'
import { createErrorResponse } from '@/lib/errors'
import { decrypt } from '@/lib/auth/encryption'
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

    // Check session
    const session = await getSession()
    if (!session) {
      return createErrorResponse('SESSION_EXPIRED', requestId)
    }

    // Get client data
    const client = await prisma.client.findUnique({
      where: { id: session.clientId },
    })

    if (!client || client.status !== 'active') {
      return createErrorResponse('SESSION_EXPIRED', requestId)
    }

    return Response.json({
      id: client.id,
      companyName: client.companyName,
      contactName: client.contactName,
      email: decrypt(client.email),
      portalSlug: client.portalSlug,
      timezone: client.timezone,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
