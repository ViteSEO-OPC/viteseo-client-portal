import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { quotes: true, accessCodes: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-heading text-foreground">Clients</h2>
        <Link href="/admin/clients/new">
          <Button>Add Client</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No clients yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Company</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Portal Slug</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Quotes</th>
                    <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <p className="font-medium text-foreground">{client.companyName}</p>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{client.contactName}</td>
                      <td className="py-3 px-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">
                          {client.portalSlug}
                        </code>
                      </td>
                      <td className="text-center py-3 px-2 text-foreground">{client._count.quotes}</td>
                      <td className="text-center py-3 px-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            client.status === 'active'
                              ? 'bg-green-500/15 text-green-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <Link href={`/admin/clients/${client.id}`}>
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
