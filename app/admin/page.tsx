import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Activity } from 'lucide-react'
import { QuotesTable } from './quotes/quotes-table'

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
      _count: {
        select: { items: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-heading text-foreground">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{clientCount}</div>
            <p className="text-xs text-muted-foreground">
              Total active clients in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quotes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{quoteCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeSessionCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently valid sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quotes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 border-none shadow-none">
           <QuotesTable data={recentQuotes} />
        </CardContent>
      </Card>
    </div>
  )
}
