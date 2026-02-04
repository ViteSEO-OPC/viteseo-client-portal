import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Pagination } from '@/components/ui/data-table'
import { SessionsTable } from './sessions-table'
import { SessionsFilter } from './sessions-filter'

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
          <SessionsFilter clients={clients} />
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardContent className="p-0 border-none shadow-none">
          <SessionsTable data={sessions} />
          <div className="px-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/admin/sessions"
              queryParams={params}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
