import { notFound, redirect } from 'next/navigation'
import { createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { getCSRFToken } from '@/lib/auth/csrf'
import { decrypt } from '@/lib/auth/encryption'
import { QuoteView } from '@/components/quote-view'
import { createAuditLog } from '@/lib/audit'
import { getClientIP, getUserAgent } from '@/lib/server-utils'

interface PortalPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

export const dynamic = 'force-dynamic'

// Helper to validate admin preview token
async function validatePreviewToken(token: string, clientSlug: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  
  const previewToken = await prisma.adminPreviewToken.findFirst({
    where: {
      tokenHash,
      clientSlug,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
  })

  if (!previewToken) {
    return null
  }

  // Mark token as used
  await prisma.adminPreviewToken.update({
    where: { id: previewToken.id },
    data: { usedAt: new Date() },
  })

  return previewToken
}

export default async function PortalPage({ params, searchParams }: PortalPageProps) {
  const { slug } = await params
  const { preview: previewToken } = await searchParams

  let client = null
  let isPreviewMode = false

  // Check for admin preview token first
  if (previewToken) {
    const validPreview = await validatePreviewToken(previewToken, slug)
    if (validPreview) {
      isPreviewMode = true
      client = await prisma.client.findFirst({
        where: { portalSlug: slug },
      })
    }
  }

  // If not preview mode, check for regular client session
  if (!isPreviewMode) {
    const session = await getSession()
    if (!session) {
      notFound()
    }

    // Verify the session belongs to a client with this portal slug
    client = await prisma.client.findFirst({
      where: {
        id: session.clientId,
        portalSlug: slug,
      },
    })
  }

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

  if (!quote) {
    // No quote available - show a "no quotes" state or redirect
    notFound()
  }

  // If quote has a custom route path, redirect there
  if (quote.routePath && quote.routePath !== `/portal/${slug}`) {
    redirect(quote.routePath)
  }

  // Mark quote as viewed if it's currently 'sent' (only for real client sessions, not admin preview)
  if (quote.status === 'sent' && !isPreviewMode) {
    const session = await getSession()
    if (session) {
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
  }

  // Read CSRF token for the page (only for real sessions, not preview mode)
  const csrfToken = isPreviewMode ? null : await getCSRFToken()

  // Decrypt client email for display
  const clientEmail = decrypt(client.email)

  return (
    <main className="min-h-screen bg-background">
      {isPreviewMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
          <span className="text-amber-400 text-sm font-medium">
            Admin Preview Mode - Actions are disabled
          </span>
        </div>
      )}
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
        isPreviewMode={isPreviewMode}
      />
    </main>
  )
}
