import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
import { z } from 'zod'

const updateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().positive().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>
}

async function recalculateTotal(quoteId: string) {
  const items = await prisma.quoteItem.findMany({ where: { quoteId } })
  const total = items.reduce(
    (sum, i) => sum + i.quantity * Number(i.unitPrice),
    0
  )
  await prisma.quote.update({
    where: { id: quoteId },
    data: { total },
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  const { id: quoteId, itemId } = await params

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
    const parsed = updateItemSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    // Check quote is draft
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }
    if (quote.status !== 'draft') {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Can only edit items on draft quotes' } },
        { status: 400 }
      )
    }

    // Check item belongs to this quote
    const existing = await prisma.quoteItem.findFirst({
      where: { id: itemId, quoteId },
    })
    if (!existing) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Item not found' } },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.quantity !== undefined) updateData.quantity = parsed.data.quantity
    if (parsed.data.unitPrice !== undefined) updateData.unitPrice = parsed.data.unitPrice
    if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder

    const item = await prisma.quoteItem.update({
      where: { id: itemId },
      data: updateData,
    })

    await recalculateTotal(quoteId)

    await createAuditLog({
      eventType: 'QUOTE_UPDATED',
      actorType: 'admin',
      actorId: userId,
      action: `Updated item "${item.name}" on quote`,
      resourceType: 'quote',
      resourceId: quoteId,
      ipAddress: ip,
      userAgent,
      meta: { itemId, changes: Object.keys(updateData) },
    })

    return Response.json(item)
  } catch (error) {
    console.error('Update quote item error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  const { id: quoteId, itemId } = await params

  try {
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Check quote is draft
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }
    if (quote.status !== 'draft') {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Can only delete items on draft quotes' } },
        { status: 400 }
      )
    }

    // Check item belongs to this quote
    const existing = await prisma.quoteItem.findFirst({
      where: { id: itemId, quoteId },
    })
    if (!existing) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Item not found' } },
        { status: 404 }
      )
    }

    await prisma.quoteItem.delete({ where: { id: itemId } })

    await recalculateTotal(quoteId)

    await createAuditLog({
      eventType: 'QUOTE_UPDATED',
      actorType: 'admin',
      actorId: userId,
      action: `Deleted item "${existing.name}" from quote`,
      resourceType: 'quote',
      resourceId: quoteId,
      ipAddress: ip,
      userAgent,
      meta: { itemId, itemName: existing.name },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete quote item error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
