import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, Activity, ArrowUpRight } from 'lucide-react'
import { QuotesTable } from './quotes/quotes-table'
import Link from 'next/link'

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-bold font-heading text-white tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back to the Vite SEO Admin Portal.</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl hover:bg-zinc-900/70 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                Active
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Clients</h3>
              <div className="text-3xl font-bold text-white font-heading">{clientCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl hover:bg-zinc-900/70 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <Link href="/admin/quotes" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-white" />
              </Link>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Quotes</h3>
              <div className="text-3xl font-bold text-white font-heading">{quoteCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl hover:bg-zinc-900/70 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Sessions</h3>
              <div className="text-3xl font-bold text-white font-heading">{activeSessionCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <Link 
                href="/admin/quotes" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
            >
                View all quotes 
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
        </div>
        <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
             <QuotesTable data={recentQuotes} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
