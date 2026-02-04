import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { AccessCodeActions } from './access-code-actions'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function getCodeStatus(code: { expiresAt: Date; revokedAt: Date | null; usedCount: number; maxUses: number }) {
  if (code.revokedAt) {
    return { label: 'Revoked', color: 'bg-red-500/15 text-red-500' }
  }
  if (new Date(code.expiresAt) < new Date()) {
    return { label: 'Expired', color: 'bg-gray-500/15 text-gray-500' }
  }
  if (code.usedCount >= code.maxUses) {
    return { label: 'Exhausted', color: 'bg-orange-500/15 text-orange-500' }
  }
  return { label: 'Active', color: 'bg-green-500/15 text-green-500' }
}

export default async function AccessCodesPage({
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

  const [codes, total, clients] = await Promise.all([
    prisma.accessCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
          },
        },
      },
    }),
    prisma.accessCode.count({ where }),
    prisma.client.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-heading text-foreground">Access Codes</h2>
        <p className="text-sm text-muted-foreground">{total} total codes</p>
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
                <option value="">All Codes</option>
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

      {/* Access Codes Table */}
      <Card>
        <CardContent className="pt-6">
          {codes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No access codes found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Code</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Quote</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Expires</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Uses</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => {
                    const status = getCodeStatus(code)
                    const isActive = status.label === 'Active'
                    return (
                      <tr key={code.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                            ****{code.codeHint}
                          </code>
                        </td>
                        <td className="py-3 px-2">
                          <Link 
                            href={`/admin/clients/${code.client.id}`}
                            className="text-primary hover:underline"
                          >
                            {code.client.companyName}
                          </Link>
                        </td>
                        <td className="py-3 px-2">
                          {code.quote ? (
                            <Link 
                              href={`/admin/quotes/${code.quote.id}`}
                              className="text-primary hover:underline"
                            >
                              {code.quote.quoteNumber}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(code.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(code.expiresAt)}
                        </td>
                        <td className="text-center py-3 px-2 text-sm text-foreground">
                          {code.usedCount} / {code.maxUses}
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">
                          {isActive && <AccessCodeActions codeId={code.id} />}
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
