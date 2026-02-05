import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { adminRateLimit } from '@/lib/redis'
import { encrypt, decrypt } from '@/lib/auth/encryption'
import { createErrorResponse } from '@/lib/errors'
import { createAuditLog } from '@/lib/audit'
import { generateRequestId } from '@/lib/utils'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

const MAX_MESSAGE_LENGTH = 2000

const sendMessageSchema = z.object({
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
})

interface RouteParams {
  params: Promise<{ quoteId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const { quoteId } = await params

  try {
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
    }

    // Verify quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { id: true, clientId: true },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Fetch messages for this quote
    const messages = await prisma.message.findMany({
      where: { quoteId },
      orderBy: { createdAt: 'asc' },
    })

    // Decrypt message content
    const decryptedMessages = messages.map((msg) => ({
      id: msg.id,
      senderType: msg.senderType,
      senderId: msg.senderId,
      content: decrypt(msg.content),
      isRead: msg.isRead,
      readAt: msg.readAt?.toISOString() || null,
      createdAt: msg.createdAt.toISOString(),
    }))

    return Response.json({
      messages: decryptedMessages,
      quoteId,
    })
  } catch (error) {
    console.error('Get admin messages error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId()
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  const { quoteId } = await params

  try {
    const { userId } = await auth()
    if (!userId) {
      return createErrorResponse('UNAUTHORIZED', requestId)
    }

    const { success } = await adminRateLimit.limit(ip)
    if (!success) {
      return createErrorResponse('RATE_LIMITED', requestId)
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

    // Verify quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { id: true, clientId: true },
    })

    if (!quote) {
      return createErrorResponse('QUOTE_NOT_FOUND', requestId)
    }

    // Create encrypted message
    const encryptedContent = encrypt(parsed.data.content.trim())

    const message = await prisma.message.create({
      data: {
        quoteId,
        senderType: 'admin',
        senderId: userId,
        content: encryptedContent,
      },
    })

    // Audit log
    await createAuditLog({
      eventType: 'MESSAGE_SENT',
      actorType: 'admin',
      actorId: userId,
      action: 'Admin sent a message to client',
      resourceType: 'quote',
      resourceId: quoteId,
      ipAddress: ip,
      userAgent,
      meta: { messageId: message.id },
    })

    return Response.json({
      id: message.id,
      senderType: message.senderType,
      senderId: message.senderId,
      content: parsed.data.content.trim(),
      isRead: false,
      readAt: null,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Send admin message error:', error)
    return createErrorResponse('INTERNAL_ERROR', requestId)
  }
}
