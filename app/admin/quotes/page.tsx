import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QuotesTable } from './quotes-table'

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-heading text-foreground">Quotes</h2>
        <Link href="/admin/quotes/new">
          <Button>Create Quote</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <QuotesTable data={quotes} />
        </CardContent>
      </Card>
    </div>
  )
}
