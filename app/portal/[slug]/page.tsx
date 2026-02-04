import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { getCSRFToken } from '@/lib/auth/csrf'
import { decrypt } from '@/lib/auth/encryption'
import { QuoteView } from '@/components/quote-view'
import { createAuditLog } from '@/lib/audit'
import { getClientIP, getUserAgent } from '@/lib/server-utils'
// #region agent log
const debugLog = (msg: string, data: object) => {
  fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'portal/[slug]/page.tsx',message:msg,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
}
// #endregion

interface PortalPageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function PortalPage({ params }: PortalPageProps) {
  const { slug } = await params
  // #region agent log
  debugLog('PortalPage called', { slug })
  // #endregion

  // Validate session - return 404 for unauthenticated requests (security spec)
  const session = await getSession()
  // #region agent log
  debugLog('session check', { hasSession: !!session, clientId: session?.clientId })
  // #endregion
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
  // #region agent log
  debugLog('client lookup', { found: !!client, slug, clientId: session.clientId })
  // #endregion

  // If no matching client, return 404 (not 401/403 to avoid info leakage)
  if (!client) {
    notFound()
  }

  // Get the latest viewable quote for this client
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
  // #region agent log
  debugLog('quote lookup', { found: !!quote, quoteNumber: quote?.quoteNumber, status: quote?.status })
  // #endregion

  if (!quote) {
    // No quote available - show a "no quotes" state or redirect
    // #region agent log
    debugLog('quote not found - calling notFound()', { clientId: client.id })
    // #endregion
    notFound()
  }

  // If quote has a custom route path, redirect there
  if (quote.routePath && quote.routePath !== `/portal/${slug}`) {
    redirect(quote.routePath)
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
      meta: { sessionId: session.sessionId },
    })
  }

  // Read CSRF token for the page (set during verify-code route)
  const csrfToken = await getCSRFToken()
  // #region agent log
  debugLog('csrf token read', { hasToken: !!csrfToken })
  // #endregion

  // Decrypt client email for display
  const clientEmail = decrypt(client.email)

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
        csrfToken={csrfToken}
      />
    </main>
  )
}
