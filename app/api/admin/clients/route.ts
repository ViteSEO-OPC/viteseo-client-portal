import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { createClientSchema } from '@/lib/validations'
import { encrypt } from '@/lib/auth/encryption'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

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

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        portalSlug: true,
        status: true,
        timezone: true,
        createdAt: true,
        _count: {
          select: { quotes: true, accessCodes: true },
        },
      },
    })

    return Response.json(clients)
  } catch (error) {
    console.error('List clients error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const parsed = createClientSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    const { companyName, contactName, email, portalSlug, timezone } = parsed.data

    // Check if portal slug already exists
    const existing = await prisma.client.findUnique({
      where: { portalSlug },
    })

    if (existing) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Portal slug already exists' } },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        companyName,
        contactName,
        email: encrypt(email),
        portalSlug,
        timezone,
      },
    })

    const userAgent = await getUserAgent()
    await createAuditLog({
      eventType: 'CLIENT_CREATED',
      actorType: 'admin',
      actorId: userId,
      action: 'Created client',
      resourceType: 'client',
      resourceId: client.id,
      ipAddress: ip,
      userAgent,
      meta: { companyName, portalSlug },
    })

    return Response.json({
      id: client.id,
      companyName: client.companyName,
      contactName: client.contactName,
      portalSlug: client.portalSlug,
      status: client.status,
      timezone: client.timezone,
      createdAt: client.createdAt,
    })
  } catch (error) {
    console.error('Create client error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
