'use client'

import Link from 'next/link'
import { DataTable, Column, StatusBadge } from '@/components/ui/data-table'
import { formatDate } from '@/lib/utils'
import { AccessCodeActions } from './access-code-actions'

interface AccessCodesTableProps {
  data: any[]
}

export function AccessCodesTable({ data }: AccessCodesTableProps) {
  const getCodeStatus = (code: any) => {
    if (code.revokedAt) {
      return { label: 'Revoked', variant: 'error' as const }
    }
    if (new Date(code.expiresAt) < new Date()) {
      return { label: 'Expired', variant: 'default' as const }
    }
    if (code.usedCount >= code.maxUses) {
      return { label: 'Exhausted', variant: 'warning' as const }
    }
    return { label: 'Active', variant: 'success' as const }
  }

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (code) => (
        <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
          ****{code.codeHint}
        </code>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (code) => (
        <Link 
          href={`/admin/clients/${code.client.id}`}
          className="text-primary hover:underline"
        >
          {code.client.companyName}
        </Link>
      ),
    },
    {
      key: 'quote',
      header: 'Quote',
      render: (code) => code.quote ? (
        <Link 
          href={`/admin/quotes/${code.quote.id}`}
          className="text-primary hover:underline"
        >
          {code.quote.quoteNumber}
        </Link>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (code) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(code.createdAt)}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      render: (code) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(code.expiresAt)}
        </span>
      ),
    },
    {
      key: 'uses',
      header: 'Uses',
      align: 'center',
      render: (code) => (
        <span className="text-sm text-foreground">
          {code.usedCount} / {code.maxUses}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (code) => {
        const status = getCodeStatus(code)
        return <StatusBadge label={status.label} variant={status.variant} />
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (code) => {
        const status = getCodeStatus(code)
        const isActive = status.label === 'Active'
        return isActive ? <AccessCodeActions codeId={code.id} /> : null
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(code) => code.id}
      emptyMessage="No access codes found"
    />
  )
}
