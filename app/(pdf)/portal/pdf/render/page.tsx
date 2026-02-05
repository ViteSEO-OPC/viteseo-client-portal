import { notFound } from 'next/navigation'
import { createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/auth/encryption'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PdfRenderPageProps {
  searchParams: Promise<{ token?: string }>
}

export const dynamic = 'force-dynamic'

export default async function PdfRenderPage({ searchParams }: PdfRenderPageProps) {
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  // Validate token
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const pdfToken = await prisma.pdfRenderToken.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    include: {
      quote: {
        include: {
          client: true,
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  if (!pdfToken) {
    notFound()
  }

  const { quote } = pdfToken
  const client = quote.client

  // Decrypt client email
  const clientEmail = decrypt(client.email)

  // Calculate item totals
  const itemsWithTotals = quote.items.map((item) => ({
    ...item,
    lineTotal: Number(item.quantity) * Number(item.unitPrice),
  }))

  return (
    <div data-pdf-ready="true">
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            color-scheme: light;
          }
          html, body {
            background: #ffffff !important;
            color: #1e293b !important;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #1e293b;
            background: white;
            padding: 40px;
          }
          .container {
            background: #ffffff;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
          }
          .quote-info {
            text-align: right;
          }
          .quote-number {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
          }
          .quote-version {
            font-size: 12px;
            color: #64748b;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
          }
          .client-info p {
            margin-bottom: 4px;
          }
          .client-name {
            font-weight: 600;
            font-size: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            text-align: left;
            padding: 12px 8px;
            border-bottom: 2px solid #e2e8f0;
            font-weight: 600;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          th.right {
            text-align: right;
          }
          td {
            padding: 12px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          td.right {
            text-align: right;
          }
          .item-name {
            font-weight: 500;
          }
          .item-description {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .totals {
            margin-top: 20px;
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
          }
          .totals-row {
            display: flex;
            justify-content: flex-end;
            gap: 40px;
            padding: 8px 0;
          }
          .totals-label {
            color: #64748b;
          }
          .totals-value {
            font-weight: 600;
            min-width: 120px;
            text-align: right;
          }
          .grand-total {
            font-size: 18px;
            border-top: 1px solid #e2e8f0;
            margin-top: 10px;
            padding-top: 10px;
          }
          .grand-total .totals-label {
            color: #0f172a;
            font-weight: 600;
          }
          .grand-total .totals-value {
            color: #0f172a;
          }
          .validity {
            margin-top: 40px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .validity p {
            color: #64748b;
          }
          .validity strong {
            color: #0f172a;
          }
          .terms {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .terms-content {
            font-size: 12px;
            color: #64748b;
            line-height: 1.6;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        ` }} />
      <div className="container">
        {/* Header */}
        <div className="header">
          <div>
            <div className="logo">
              <strong>Vite SEO Digital Advertising OPC</strong>
            </div>
          </div>
          <div className="quote-info">
            <div className="quote-number">{quote.quoteNumber}</div>
            {quote.version > 1 && (
              <div className="quote-version">Version {quote.version}</div>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="section">
          <div className="section-title">Prepared For</div>
          <div className="client-info">
            <p className="client-name">{client.companyName}</p>
            <p>{client.contactName}</p>
            <p>{clientEmail}</p>
          </div>
        </div>

        {/* Quote Items */}
        <div className="section">
          <div className="section-title">Quote Details</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Item</th>
                <th className="right" style={{ width: '10%' }}>Qty</th>
                <th className="right" style={{ width: '20%' }}>Unit Price</th>
                <th className="right" style={{ width: '20%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {itemsWithTotals.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="item-name">{item.name}</div>
                    {item.description && (
                      <div className="item-description">{item.description}</div>
                    )}
                  </td>
                  <td className="right">{Number(item.quantity)}</td>
                  <td className="right">{formatCurrency(item.unitPrice)}</td>
                  <td className="right">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals">
            <div className="totals-row grand-total">
              <span className="totals-label">Total</span>
              <span className="totals-value">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="validity">
          <p>
            This quote is valid until <strong>{formatDate(quote.validUntil.toISOString(), client.timezone)}</strong>
          </p>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="terms">
            <div className="section-title">Notes</div>
            <div className="terms-content">
              {quote.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <p>Thank you for your business</p>
          <p>Vite SEO Digital Advertising OPC</p>
        </div>
      </div>
    </div>
  )
}
