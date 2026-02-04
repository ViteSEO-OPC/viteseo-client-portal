import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const [clientCount, quoteCount, activeSessionCount] = await Promise.all([
    prisma.client.count({ where: { status: 'active' } }),
    prisma.quote.count(),
    prisma.session.count({
      where: {
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    }),
  ])

  const recentQuotes = await prisma.quote.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: { companyName: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-heading text-foreground">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{clientCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{quoteCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{activeSessionCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQuotes.length === 0 ? (
              <p className="text-muted-foreground">No quotes yet</p>
            ) : (
              recentQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex justify-between items-center p-3 bg-muted/40 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{quote.quoteNumber}</p>
                    <p className="text-sm text-muted-foreground">{quote.client.companyName}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        quote.status === 'accepted'
                          ? 'bg-green-500/15 text-green-500'
                          : quote.status === 'sent' || quote.status === 'viewed'
                          ? 'bg-blue-500/15 text-blue-500'
                          : quote.status === 'rejected'
                          ? 'bg-red-500/15 text-red-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
