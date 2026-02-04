import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
import { z } from 'zod'

const updateQuoteStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'expired', 'superseded']),
})

const updateQuoteSchema = z.object({
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'expired', 'superseded']).optional(),
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

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            portalSlug: true,
          },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        accessCodes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            codeHint: true,
            expiresAt: true,
            usedCount: true,
            maxUses: true,
            revokedAt: true,
          },
        },
      },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    return Response.json(quote)
  } catch (error) {
    console.error('Get quote error:', error)
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
    const parsed = updateQuoteSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    // Check if quote exists
    const existing = await prisma.quote.findUnique({
      where: { id },
    })

    if (!existing) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Prevent modification of accepted/rejected quotes
    if (existing.status === 'accepted' || existing.status === 'rejected') {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Cannot modify accepted or rejected quotes' } },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.validUntil) updateData.validUntil = new Date(parsed.data.validUntil)
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
    if (parsed.data.status) updateData.status = parsed.data.status

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    })

    // Log status changes
    if (parsed.data.status) {
      await createAuditLog({
        eventType: parsed.data.status === 'sent' ? 'QUOTE_SENT' : 'QUOTE_UPDATED',
        actorType: 'admin',
        actorId: userId,
        action: `Quote status changed to ${parsed.data.status}`,
        resourceType: 'quote',
        resourceId: id,
        ipAddress: ip,
        userAgent,
        meta: { previousStatus: existing.status, newStatus: parsed.data.status },
      })
    } else {
      await createAuditLog({
        eventType: 'QUOTE_UPDATED',
        actorType: 'admin',
        actorId: userId,
        action: 'Updated quote',
        resourceType: 'quote',
        resourceId: id,
        ipAddress: ip,
        userAgent,
        meta: { changes: Object.keys(updateData) },
      })
    }

    return Response.json(quote)
  } catch (error) {
    console.error('Update quote error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

// Special endpoint for sending quotes
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const parsed = updateQuoteStatusSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    // Check if quote exists
    const existing = await prisma.quote.findUnique({
      where: { id },
    })

    if (!existing) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Validate status transition
    const { status } = parsed.data
    const validTransitions: Record<string, string[]> = {
      draft: ['sent'],
      sent: ['expired', 'superseded'],
      viewed: ['expired', 'superseded'],
    }

    const allowedTransitions = validTransitions[existing.status] || []
    if (!allowedTransitions.includes(status) && status !== existing.status) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: `Cannot transition from ${existing.status} to ${status}` } },
        { status: 400 }
      )
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: { status },
    })

    await createAuditLog({
      eventType: status === 'sent' ? 'QUOTE_SENT' : 'QUOTE_UPDATED',
      actorType: 'admin',
      actorId: userId,
      action: `Quote status changed to ${status}`,
      resourceType: 'quote',
      resourceId: id,
      ipAddress: ip,
      userAgent,
      meta: { previousStatus: existing.status, newStatus: status },
    })

    return Response.json(quote)
  } catch (error) {
    console.error('Update quote status error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
