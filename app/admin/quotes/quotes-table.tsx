'use client'

import Link from 'next/link'
import { DataTable, Column, StatusBadge } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

interface QuotesTableProps {
  data: any[]
}

export function QuotesTable({ data }: QuotesTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success'
      case 'sent':
      case 'viewed':
        return 'info'
      case 'rejected':
        return 'error'
      case 'expired':
        return 'warning'
      default:
        return 'default'
    }
  }

  const columns: Column<any>[] = [
    {
      key: 'quoteNumber',
      header: 'Quote #',
      render: (quote) => (
        <div>
          <p className="font-medium text-foreground">{quote.quoteNumber}</p>
          {quote.version > 1 && (
            <p className="text-xs text-muted-foreground">v{quote.version}</p>
          )}
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (quote) => (
        <span className="text-muted-foreground">{quote.client.companyName}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (quote) => (
        <span className="font-medium text-foreground">
          {formatCurrency(quote.total.toString())}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center',
      render: (quote) => (
        <span className="text-foreground">{quote._count.items}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (quote) => (
        <StatusBadge
          label={quote.status}
          variant={getStatusVariant(quote.status)}
        />
      ),
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (quote) => (
        <span className="text-muted-foreground">
          {formatDate(quote.validUntil)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (quote) => (
        <Link href={`/admin/quotes/${quote.id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(quote) => quote.id}
      emptyMessage="No quotes found"
    />
  )
}
