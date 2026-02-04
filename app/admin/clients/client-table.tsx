'use client'

import Link from 'next/link'
import { DataTable, Column, StatusBadge } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'

interface ClientTableProps {
  data: any[]
}

export function ClientTable({ data }: ClientTableProps) {
  const columns: Column<any>[] = [
    {
      key: 'companyName',
      header: 'Company',
      render: (client) => (
        <p className="font-medium text-foreground">{client.companyName}</p>
      ),
    },
    {
      key: 'contactName',
      header: 'Contact',
      render: (client) => (
        <span className="text-muted-foreground">{client.contactName}</span>
      ),
    },
    {
      key: 'portalSlug',
      header: 'Portal Slug',
      render: (client) => (
        <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">
          {client.portalSlug}
        </code>
      ),
    },
    {
      key: 'quotes',
      header: 'Quotes',
      align: 'center',
      render: (client) => (
        <span className="text-foreground">{client._count.quotes}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (client) => (
        <StatusBadge
          label={client.status}
          variant={client.status === 'active' ? 'success' : 'default'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (client) => (
        <Link href={`/admin/clients/${client.id}`}>
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
      keyExtractor={(client) => client.id}
      emptyMessage="No clients found"
    />
  )
}
