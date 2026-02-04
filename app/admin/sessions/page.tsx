import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { SessionActions } from './session-actions'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function getSessionStatus(session: { expiresAt: Date; revokedAt: Date | null }) {
  if (session.revokedAt) {
    return { label: 'Revoked', color: 'bg-red-500/15 text-red-500' }
  }
  if (new Date(session.expiresAt) < new Date()) {
    return { label: 'Expired', color: 'bg-gray-500/15 text-gray-500' }
  }
  return { label: 'Active', color: 'bg-green-500/15 text-green-500' }
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; active?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (params.clientId) where.clientId = params.clientId
  if (params.active === 'true') {
    where.expiresAt = { gt: new Date() }
    where.revokedAt = null
  }

  const [sessions, total, clients] = await Promise.all([
    prisma.session.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
    }),
    prisma.session.count({ where }),
    prisma.client.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-heading text-foreground">Sessions</h2>
        <p className="text-sm text-muted-foreground">{total} total sessions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Client</label>
              <select
                name="clientId"
                defaultValue={params.clientId || ''}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
              <select
                name="active"
                defaultValue={params.active || ''}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="">All Sessions</option>
                <option value="true">Active Only</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Filter
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardContent className="pt-6">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sessions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">IP Address</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Last Active</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Expires</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const status = getSessionStatus(session)
                    const isActive = status.label === 'Active'
                    return (
                      <tr key={session.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2">
                          <p className="font-medium text-foreground">{session.client.companyName}</p>
                          <p className="text-xs text-muted-foreground">{session.client.contactName}</p>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground font-mono">
                          {session.ipAddress}
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(session.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(session.lastActiveAt)}
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(session.expiresAt)}
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          {isActive && <SessionActions sessionId={session.id} />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${params.clientId ? `&clientId=${params.clientId}` : ''}${params.active ? `&active=${params.active}` : ''}`}
                  className="px-3 py-1 border border-border rounded text-sm hover:bg-muted"
                >
                  Previous
                </a>
              )}
              <span className="px-3 py-1 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}${params.clientId ? `&clientId=${params.clientId}` : ''}${params.active ? `&active=${params.active}` : ''}`}
                  className="px-3 py-1 border border-border rounded text-sm hover:bg-muted"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
