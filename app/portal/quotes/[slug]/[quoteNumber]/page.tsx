import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { setCSRFToken } from '@/lib/auth/csrf'
import { decrypt } from '@/lib/auth/encryption'
import { QuoteView } from '@/components/quote-view'
import { createAuditLog } from '@/lib/audit'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
import { getQuoteEntry } from '@/lib/quotes/registry'

interface QuotePageProps {
  params: Promise<{ slug: string; quoteNumber: string }>
}

export const dynamic = 'force-dynamic'

export default async function QuotePage({ params }: QuotePageProps) {
  const { slug, quoteNumber } = await params

  // Validate session - return 404 for unauthenticated requests (security spec)
  const session = await getSession()
  if (!session) {
    notFound()
  }

  // Verify the session belongs to a client with this portal slug
  const client = await prisma.client.findFirst({
    where: {
      id: session.clientId,
      portalSlug: slug,
    },
  })

  // If no matching client, return 404 (not 401/403 to avoid info leakage)
  if (!client) {
    notFound()
  }

  // Get the specific quote by quote number
  const quote = await prisma.quote.findFirst({
    where: {
      clientId: client.id,
      quoteNumber: quoteNumber,
      status: { in: ['sent', 'viewed', 'accepted', 'rejected'] },
    },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!quote) {
    notFound()
  }

  // Check if quote is expired
  if (quote.validUntil < new Date() && quote.status !== 'accepted' && quote.status !== 'rejected') {
    // Mark as expired
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'expired' },
    })
  }

  // Mark quote as viewed if it's currently 'sent'
  if (quote.status === 'sent') {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'viewed' },
    })

    // Log the view
    const ip = await getClientIP()
    const userAgent = await getUserAgent()
    await createAuditLog({
      eventType: 'QUOTE_VIEWED',
      actorType: 'client',
      actorId: session.clientId,
      action: 'Quote viewed for the first time',
      resourceType: 'quote',
      resourceId: quote.id,
      ipAddress: ip,
      userAgent,
      meta: { sessionId: session.sessionId, quoteNumber },
    })
  }

  // Check if there's a custom page for this quote
  const registryEntry = getQuoteEntry(slug, quoteNumber)
  
  // For now, we use the default QuoteView component
  // Custom page rendering can be added here when page.tsx files are implemented
  // if (registryEntry?.pagePath) {
  //   // Dynamic import and render custom component
  // }

  // Generate CSRF token for the page
  const csrfToken = await setCSRFToken()

  // Decrypt client email for display
  const clientEmail = decrypt(client.email)

  // Determine effective status (account for expiry)
  const effectiveStatus = quote.validUntil < new Date() && quote.status !== 'accepted' && quote.status !== 'rejected'
    ? 'expired'
    : quote.status

  return (
    <main className="min-h-screen bg-background">
      <QuoteView
        client={{
          companyName: client.companyName,
          contactName: client.contactName,
          email: clientEmail,
        }}
        quote={{
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          version: quote.version,
          validUntil: quote.validUntil.toISOString(),
          total: quote.total.toString(),
          status: effectiveStatus as 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired',
          items: quote.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
          })),
        }}
        timezone={client.timezone}
        csrfToken={csrfToken}
      />
    </main>
  )
}
