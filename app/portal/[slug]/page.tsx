import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getCSRFToken } from '@/lib/auth/csrf'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
import { QuoteView } from '@/components/quote-view'
import { decrypt } from '@/lib/auth/encryption'

interface PortalPageProps {
  params: Promise<{ slug: string }>
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { slug } = await params
  const session = await getSession()

  if (!session) {
    // Return 404 to avoid information leakage
    notFound()
  }

  const client = await prisma.client.findFirst({
    where: {
      id: session.clientId,
      portalSlug: slug,
      status: 'active',
    },
  })

  if (!client) {
    notFound()
  }

  // Get the latest viewable quote (including accepted/rejected for status display)
  const quote = await prisma.quote.findFirst({
    where: {
      clientId: client.id,
      status: { in: ['sent', 'viewed', 'accepted', 'rejected'] },
    },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get CSRF token for client-side requests
  const csrfToken = await getCSRFToken()

  if (!quote) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">No Quote Available</h1>
          <p className="text-muted-foreground">
            There is no active quotation for your account at this time.
          </p>
        </div>
      </main>
    )
  }

  // Update quote status to viewed if it was sent
  if (quote.status === 'sent') {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'viewed' },
    })
  }

  // Log quote view
  const ip = await getClientIP()
  const userAgent = await getUserAgent()
  await createAuditLog({
    eventType: 'QUOTE_VIEWED',
    actorType: 'client',
    actorId: client.id,
    action: 'Viewed quote',
    resourceType: 'quote',
    resourceId: quote.id,
    ipAddress: ip,
    userAgent,
    meta: { sessionId: session.sessionId },
  })

  return (
    <main className="min-h-screen bg-background">
      <QuoteView
        client={{
          companyName: client.companyName,
          contactName: client.contactName,
          email: decrypt(client.email),
        }}
        quote={{
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          version: quote.version,
          validUntil: quote.validUntil.toISOString(),
          total: quote.total.toString(),
          status: quote.status as 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired',
          items: quote.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
          })),
        }}
        timezone={client.timezone}
        csrfToken={csrfToken ?? undefined}
      />
    </main>
  )
}
