import { formatCurrency, formatDate } from '@/lib/utils'

interface QuoteItem {
  id: string
  name: string
  description: string | null
  quantity: number
  unitPrice: string
}

interface QuotePDFViewProps {
  client: {
    companyName: string
    contactName: string
    email: string
  }
  quote: {
    quoteNumber: string
    version: number
    validUntil: string
    total: string
    currency: string
    notes: string | null
    items: QuoteItem[]
  }
  timezone: string
}

export function QuotePDFView({ client, quote, timezone }: QuotePDFViewProps) {
  return (
    <div
      data-pdf-ready="true"
      className="min-h-screen bg-white p-8"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">VITE SEO</h1>
            <p className="text-gray-600">Digital Advertising OPC</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">QUOTATION</h2>
            <p className="text-lg text-gray-600">{quote.quoteNumber}</p>
            {quote.version > 1 && (
              <p className="text-sm text-gray-500">Version {quote.version}</p>
            )}
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
          <p className="font-semibold text-lg">{client.companyName}</p>
          <p className="text-gray-600">{client.contactName}</p>
          <p className="text-gray-600">{client.email}</p>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Quote Details</h3>
          <p className="text-gray-600">
            <span className="font-medium">Valid Until:</span>{' '}
            {formatDate(quote.validUntil, timezone)}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Currency:</span> {quote.currency}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700 w-20">Qty</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 w-32">Unit Price</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 w-32">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-3 px-4">
                <p className="font-medium">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                )}
              </td>
              <td className="text-center py-3 px-4">{item.quantity}</td>
              <td className="text-right py-3 px-4">{formatCurrency(item.unitPrice)}</td>
              <td className="text-right py-3 px-4 font-medium">
                {formatCurrency(parseFloat(item.unitPrice) * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200">
            <td colSpan={3} className="text-right py-4 px-4 font-bold text-lg">
              Total:
            </td>
            <td className="text-right py-4 px-4 font-bold text-lg text-blue-600">
              {formatCurrency(quote.total)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      {quote.notes && (
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
          <p className="text-gray-700">{quote.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-6 mt-8 text-center text-gray-500 text-sm">
        <p>Thank you for considering Vite SEO for your digital marketing needs.</p>
        <p className="mt-2">
          Questions? Contact us at{' '}
          <span className="text-blue-600">hello@viteseo.com</span>
        </p>
      </div>
    </div>
  )
}
