import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
import { decrypt, encrypt } from '@/lib/auth/encryption'
import { z } from 'zod'

const updateClientSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  contactName: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  portalSlug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Portal slug must be lowercase alphanumeric with hyphens')
    .optional(),
  timezone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const { id } = await params

  try {
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            total: true,
            validUntil: true,
            createdAt: true,
          },
        },
        accessCodes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            codeHint: true,
            expiresAt: true,
            usedCount: true,
            maxUses: true,
            revokedAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: { quotes: true, accessCodes: true, sessions: true },
        },
      },
    })

    if (!client) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    return Response.json({
      ...client,
      email: decrypt(client.email),
    })
  } catch (error) {
    console.error('Get client error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  const { id } = await params

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
    const parsed = updateClientSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    // Check if client exists
    const existing = await prisma.client.findUnique({
      where: { id },
    })

    if (!existing) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Check if portal slug is being changed and if it already exists
    if (parsed.data.portalSlug && parsed.data.portalSlug !== existing.portalSlug) {
      const slugExists = await prisma.client.findUnique({
        where: { portalSlug: parsed.data.portalSlug },
      })
      if (slugExists) {
        return Response.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Portal slug already exists' } },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.companyName) updateData.companyName = parsed.data.companyName
    if (parsed.data.contactName) updateData.contactName = parsed.data.contactName
    if (parsed.data.email) updateData.email = encrypt(parsed.data.email)
    if (parsed.data.portalSlug) updateData.portalSlug = parsed.data.portalSlug
    if (parsed.data.timezone) updateData.timezone = parsed.data.timezone
    if (parsed.data.status) updateData.status = parsed.data.status

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    })

    await createAuditLog({
      eventType: 'CLIENT_UPDATED',
      actorType: 'admin',
      actorId: userId,
      action: 'Updated client',
      resourceType: 'client',
      resourceId: id,
      ipAddress: ip,
      userAgent,
      meta: { changes: Object.keys(updateData) },
    })

    return Response.json({
      id: client.id,
      companyName: client.companyName,
      contactName: client.contactName,
      portalSlug: client.portalSlug,
      status: client.status,
      timezone: client.timezone,
      updatedAt: client.updatedAt,
    })
  } catch (error) {
    console.error('Update client error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  const { id } = await params

  try {
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Check if client exists
    const existing = await prisma.client.findUnique({
      where: { id },
    })

    if (!existing) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Soft delete by archiving
    await prisma.client.update({
      where: { id },
      data: { status: 'archived' },
    })

    await createAuditLog({
      eventType: 'CLIENT_UPDATED',
      actorType: 'admin',
      actorId: userId,
      action: 'Archived client',
      resourceType: 'client',
      resourceId: id,
      ipAddress: ip,
      userAgent,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete client error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
