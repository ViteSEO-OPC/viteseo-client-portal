import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import { QuoteView } from '@/components/quote-view'

interface ClientData {
  clientName: string
  contactName: string
  email: string
  activeQuote: string
  quoteNumber?: string
  validUntil?: string
  total?: string
  currency?: string
  items?: Array<{
    id: string
    name: string
    description?: string
    quantity: number
    unitPrice: string
  }>
}

interface PortalPageProps {
  params: Promise<{ slug: string }>
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { slug } = await params

  // Check if client folder exists
  const clientDir = path.join(process.cwd(), 'clients', slug)
  const dataFile = path.join(clientDir, 'data.json')

  if (!fs.existsSync(clientDir) || !fs.existsSync(dataFile)) {
    notFound()
  }

  // Read client data from file
  let clientData: ClientData
  try {
    const rawData = fs.readFileSync(dataFile, 'utf-8')
    clientData = JSON.parse(rawData)
  } catch {
    notFound()
  }

  // Check if quote PDF exists
  const quotePath = clientData.activeQuote
    ? path.join(clientDir, clientData.activeQuote)
    : null

  const hasQuotePdf = quotePath && fs.existsSync(quotePath)

  return (
    <main className="min-h-screen bg-background">
      <QuoteView
        client={{
          companyName: clientData.clientName,
          contactName: clientData.contactName,
          email: clientData.email,
        }}
        quote={{
          id: slug,
          quoteNumber: clientData.quoteNumber || `Q-${slug.toUpperCase()}`,
          version: 1,
          validUntil: clientData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          total: clientData.total || '0',
          status: 'sent',
          items: clientData.items || [],
        }}
        timezone="Asia/Manila"
        pdfUrl={hasQuotePdf ? `/api/portal/pdf/${slug}` : undefined}
      />
    </main>
  )
}
