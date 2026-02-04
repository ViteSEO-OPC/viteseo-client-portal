import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ClientTable } from './client-table'

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
          <ClientTable data={clients} />
        </CardContent>
      </Card>
    </div>
  )
}
