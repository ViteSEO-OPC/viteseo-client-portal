import { prisma } from '@/lib/db'
import { MessagesInbox } from './messages-inbox'

export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage() {
  // Fetch all quotes that have messages, with client info and unread counts
  const quotesWithMessages = await prisma.quote.findMany({
    where: {
      messages: {
        some: {},
      },
    },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          createdAt: true,
          senderType: true,
          isRead: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderType: 'client',
              isRead: false,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  // Also fetch quotes without messages but with sent/viewed status (potential conversations)
  const activeQuotes = await prisma.quote.findMany({
    where: {
      status: { in: ['sent', 'viewed', 'accepted', 'rejected'] },
      messages: {
        none: {},
      },
    },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10,
  })

  // Transform data for the client component
  const conversations = quotesWithMessages.map((quote) => ({
    quoteId: quote.id,
    quoteNumber: quote.quoteNumber,
    clientId: quote.client.id,
    clientName: quote.client.companyName,
    contactName: quote.client.contactName,
    lastMessageAt: quote.messages[0]?.createdAt.toISOString() ?? null,
    lastMessageFrom: quote.messages[0]?.senderType ?? null,
    unreadCount: quote._count.messages,
    status: quote.status,
  }))

  const emptyConversations = activeQuotes.map((quote) => ({
    quoteId: quote.id,
    quoteNumber: quote.quoteNumber,
    clientId: quote.client.id,
    clientName: quote.client.companyName,
    contactName: quote.client.contactName,
    lastMessageAt: null,
    lastMessageFrom: null,
    unreadCount: 0,
    status: quote.status,
  }))

  // Sort by unread first, then by last message time
  const allConversations = [...conversations, ...emptyConversations].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1
    if (a.lastMessageAt && b.lastMessageAt) {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    }
    if (a.lastMessageAt) return -1
    if (b.lastMessageAt) return 1
    return 0
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate with clients about their quotes
        </p>
      </div>

      <MessagesInbox conversations={allConversations} />
    </div>
  )
}
