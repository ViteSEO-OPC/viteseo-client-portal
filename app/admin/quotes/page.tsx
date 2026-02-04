import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: { companyName: true },
      },
      _count: {
        select: { items: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-heading text-foreground">Quotes</h2>
        <Link href="/admin/quotes/new">
          <Button>Create Quote</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {quotes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No quotes yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Quote #</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Client</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Total</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Items</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Valid Until</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <p className="font-medium text-foreground">{quote.quoteNumber}</p>
                        {quote.version > 1 && (
                          <p className="text-xs text-muted-foreground">v{quote.version}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{quote.client.companyName}</td>
                      <td className="text-right py-3 px-2 font-medium text-foreground">
                        {formatCurrency(quote.total.toString())}
                      </td>
                      <td className="text-center py-3 px-2 text-foreground">{quote._count.items}</td>
                      <td className="text-center py-3 px-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            quote.status === 'accepted'
                              ? 'bg-green-500/15 text-green-500'
                              : quote.status === 'sent' || quote.status === 'viewed'
                              ? 'bg-blue-500/15 text-blue-500'
                              : quote.status === 'rejected'
                              ? 'bg-red-500/15 text-red-500'
                              : quote.status === 'expired'
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatDate(quote.validUntil)}
                      </td>
                      <td className="text-right py-3 px-2">
                        <Link href={`/admin/quotes/${quote.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
