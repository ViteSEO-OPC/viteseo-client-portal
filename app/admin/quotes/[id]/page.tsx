import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { QuoteDetailView } from './quote-detail-view'

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params

  const [quote, activityLogs] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            portalSlug: true,
            timezone: true,
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
            createdAt: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        resourceType: 'quote',
        resourceId: id,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  if (!quote) {
    notFound()
  }

  // Serialize dates for client component
  const serializedQuote = {
    ...quote,
    validUntil: quote.validUntil.toISOString(),
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    total: quote.total.toString(),
    items: quote.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toString(),
      createdAt: item.createdAt.toISOString(),
    })),
    accessCodes: quote.accessCodes.map((code) => ({
      ...code,
      expiresAt: code.expiresAt.toISOString(),
      createdAt: code.createdAt.toISOString(),
      revokedAt: code.revokedAt?.toISOString() ?? null,
    })),
  }

  const serializedActivity = activityLogs.map((log) => ({
    id: log.id,
    eventType: log.eventType,
    action: log.action,
    actorType: log.actorType,
    actorId: log.actorId,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
    meta: log.meta as Record<string, unknown> | null,
  }))

  return <QuoteDetailView quote={serializedQuote} activityLogs={serializedActivity} />
}
