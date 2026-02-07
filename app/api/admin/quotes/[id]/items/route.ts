import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createAuditLog } from '@/lib/audit'
import { createErrorResponse } from '@/lib/errors'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
import { z } from 'zod'

const addItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  const { id: quoteId } = await params

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
    const parsed = addItemSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    // Check quote exists and is draft
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: { orderBy: { sortOrder: 'desc' }, take: 1 } },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    const terminalStatuses = ['accepted', 'rejected', 'expired', 'superseded']
    if (terminalStatuses.includes(quote.status)) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Cannot modify items on a finalized quote' } },
        { status: 400 }
      )
    }

    const nextSortOrder = (quote.items[0]?.sortOrder ?? -1) + 1

    // Create item and recalculate total
    const item = await prisma.quoteItem.create({
      data: {
        quoteId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
        sortOrder: nextSortOrder,
      },
    })

    // Recalculate total
    const allItems = await prisma.quoteItem.findMany({ where: { quoteId } })
    const newTotal = allItems.reduce(
      (sum, i) => sum + i.quantity * Number(i.unitPrice),
      0
    )

    await prisma.quote.update({
      where: { id: quoteId },
      data: { total: newTotal },
    })

    await createAuditLog({
      eventType: 'QUOTE_UPDATED',
      actorType: 'admin',
      actorId: userId,
      action: `Added item "${parsed.data.name}" to quote`,
      resourceType: 'quote',
      resourceId: quoteId,
      ipAddress: ip,
      userAgent,
      meta: { itemId: item.id },
    })

    return Response.json(item, { status: 201 })
  } catch (error) {
    console.error('Add quote item error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
