import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { portalRateLimit } from '@/lib/redis'
import { getSession } from '@/lib/auth/session'
import { validateCSRFToken } from '@/lib/auth/csrf'
import { encrypt, decrypt } from '@/lib/auth/encryption'
import { createErrorResponse } from '@/lib/errors'
import { createAuditLog } from '@/lib/audit'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

const MAX_MESSAGE_LENGTH = 2000

const sendMessageSchema = z.object({
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
})

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()

  try {
    const { success } = await portalRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    const session = await getSession()
    if (!session) {
      return createErrorResponse('NOT_FOUND', requestId)
    }

    // Get the client's current quote
    const quote = await prisma.quote.findFirst({
      where: {
        clientId: session.clientId,
        status: { in: ['sent', 'viewed', 'accepted', 'rejected'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Fetch messages for this quote
    const messages = await prisma.message.findMany({
      where: { quoteId: quote.id },
      orderBy: { createdAt: 'asc' },
    })

    // Decrypt message content
    const decryptedMessages = messages.map((msg) => ({
      id: msg.id,
      senderType: msg.senderType,
      content: decrypt(msg.content),
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
    }))

    return Response.json({
      messages: decryptedMessages,
      quoteId: quote.id,
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()

  try {
    const { success } = await portalRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Validate CSRF token
    const isValidCSRF = await validateCSRFToken(request)
    if (!isValidCSRF) {
      return createErrorResponse('CSRF_INVALID', requestId)
    }

    const session = await getSession()
    if (!session) {
      return createErrorResponse('NOT_FOUND', requestId)
    }

    // Parse and validate body
    const body = await request.json()
    const parsed = sendMessageSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      if (firstError?.path[0] === 'content') {
        if (firstError.code === 'too_small') {
          return createErrorResponse('MESSAGE_EMPTY', requestId)
        }
        if (firstError.code === 'too_big') {
          return createErrorResponse('MESSAGE_TOO_LONG', requestId)
        }
      }
      return createErrorResponse('VALIDATION_ERROR', requestId)
    }

    // Get the client's current quote
    const quote = await prisma.quote.findFirst({
      where: {
        clientId: session.clientId,
        status: { in: ['sent', 'viewed', 'accepted', 'rejected'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Create encrypted message
    const encryptedContent = encrypt(parsed.data.content.trim())

    const message = await prisma.message.create({
      data: {
        quoteId: quote.id,
        senderType: 'client',
        senderId: session.clientId,
        content: encryptedContent,
      },
    })

    // Audit log
    await createAuditLog({
      eventType: 'MESSAGE_SENT',
      actorType: 'client',
      actorId: session.clientId,
      action: 'Client sent a message',
      resourceType: 'quote',
      resourceId: quote.id,
      ipAddress: ip,
      userAgent,
      meta: { messageId: message.id },
    })

    return Response.json({
      id: message.id,
      senderType: message.senderType,
      content: parsed.data.content.trim(),
      isRead: false,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Send message error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
