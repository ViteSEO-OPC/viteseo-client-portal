import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'

const EVENT_TYPE_COLORS: Record<string, string> = {
  OTP_VERIFIED: 'bg-green-500/15 text-green-500',
  OTP_FAILED: 'bg-red-500/15 text-red-500',
  OTP_LOCKED: 'bg-red-500/15 text-red-500',
  SESSION_CREATED: 'bg-blue-500/15 text-blue-500',
  SESSION_REVOKED: 'bg-orange-500/15 text-orange-500',
  QUOTE_VIEWED: 'bg-blue-500/15 text-blue-500',
  QUOTE_ACCEPTED: 'bg-green-500/15 text-green-500',
  QUOTE_REJECTED: 'bg-red-500/15 text-red-500',
  PDF_DOWNLOADED: 'bg-purple-500/15 text-purple-500',
  ACCESS_CODE_CREATED: 'bg-blue-500/15 text-blue-500',
  ACCESS_CODE_REVOKED: 'bg-orange-500/15 text-orange-500',
  CLIENT_CREATED: 'bg-green-500/15 text-green-500',
  CLIENT_UPDATED: 'bg-yellow-500/15 text-yellow-500',
  QUOTE_CREATED: 'bg-green-500/15 text-green-500',
  QUOTE_UPDATED: 'bg-yellow-500/15 text-yellow-500',
  QUOTE_SENT: 'bg-blue-500/15 text-blue-500',
  RATE_LIMIT_HIT: 'bg-red-500/15 text-red-500',
}

const ACTOR_TYPE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-500',
  client: 'bg-blue-500/15 text-blue-500',
  system: 'bg-gray-500/15 text-gray-500',
  anonymous: 'bg-gray-500/15 text-gray-500',
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventType?: string; actorType?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (params.eventType) where.eventType = params.eventType
  if (params.actorType) where.actorType = params.actorType

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Get unique event types for filter
  const eventTypes = [
    'OTP_VERIFIED', 'OTP_FAILED', 'OTP_LOCKED',
    'SESSION_CREATED', 'SESSION_REVOKED',
    'QUOTE_VIEWED', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED',
    'PDF_DOWNLOADED',
    'ACCESS_CODE_CREATED', 'ACCESS_CODE_REVOKED',
    'CLIENT_CREATED', 'CLIENT_UPDATED',
    'QUOTE_CREATED', 'QUOTE_UPDATED', 'QUOTE_SENT',
    'RATE_LIMIT_HIT',
  ]

  const actorTypes = ['admin', 'client', 'system', 'anonymous']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-heading text-foreground">Audit Logs</h2>
        <p className="text-sm text-muted-foreground">{total} total events</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Event Type</label>
              <select
                name="eventType"
                defaultValue={params.eventType || ''}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="">All Events</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Actor Type</label>
              <select
                name="actorType"
                defaultValue={params.actorType || ''}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="">All Actors</option>
                {actorTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
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

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Timestamp</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Event</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Actor</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Action</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Resource</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${EVENT_TYPE_COLORS[log.eventType] || 'bg-muted text-muted-foreground'}`}>
                          {log.eventType}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${ACTOR_TYPE_COLORS[log.actorType] || 'bg-muted text-muted-foreground'}`}>
                          {log.actorType}
                        </span>
                        {log.actorId && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {log.actorId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-sm text-foreground max-w-[200px] truncate">
                        {log.action}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {log.resourceType && (
                          <span>
                            {log.resourceType}
                            {log.resourceId && (
                              <span className="ml-1 text-xs">({log.resourceId.slice(0, 8)}...)</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground font-mono">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${params.eventType ? `&eventType=${params.eventType}` : ''}${params.actorType ? `&actorType=${params.actorType}` : ''}`}
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
                  href={`?page=${page + 1}${params.eventType ? `&eventType=${params.eventType}` : ''}${params.actorType ? `&actorType=${params.actorType}` : ''}`}
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
