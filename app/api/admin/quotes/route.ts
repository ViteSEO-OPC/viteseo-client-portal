import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { createErrorResponse } from '@/lib/errors'
import { createQuoteSchema } from '@/lib/validations'
import { generateQuoteNumber, generateRequestId } from '@/lib/utils'
import { calculateContentHash, getClientIP } from '@/lib/server-utils'

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

    const quotes = await prisma.quote.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { companyName: true },
        },
        items: true,
      },
    })

    return Response.json(quotes)
  } catch (error) {
    console.error('List quotes error:', error)
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
    const parsed = createQuoteSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    const { clientId, validUntil, items } = parsed.data

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Client not found' } },
        { status: 400 }
      )
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    // Generate content hash for cache invalidation
    const contentHash = calculateContentHash({ items, total, validUntil })

    const quote = await prisma.quote.create({
      data: {
        clientId,
        quoteNumber: generateQuoteNumber(),
        validUntil: new Date(validUntil),
        total,
        contentHash,
        items: {
          create: items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return Response.json(quote)
  } catch (error) {
    console.error('Create quote error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
