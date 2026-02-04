import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination } from '@/components/ui/data-table'
import { AuditLogsTable } from './audit-logs-table'
import { AuditLogsFilter } from './audit-logs-filter'

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-heading text-foreground">Audit Logs</h2>
        <p className="text-sm text-muted-foreground">{total} total events</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <AuditLogsFilter />
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0 border-none shadow-none">
          <AuditLogsTable data={logs} />
          <div className="px-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/admin/audit-logs"
              queryParams={params}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
