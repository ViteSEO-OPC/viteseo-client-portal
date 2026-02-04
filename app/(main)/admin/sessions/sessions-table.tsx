'use client'

import { DataTable, Column, StatusBadge } from '@/components/ui/data-table'
import { formatDate } from '@/lib/utils'
import { SessionActions } from './session-actions'

interface SessionsTableProps {
  data: any[]
}

export function SessionsTable({ data }: SessionsTableProps) {
  const getSessionStatus = (session: any) => {
    if (session.revokedAt) {
      return { label: 'Revoked', variant: 'error' as const }
    }
    if (new Date(session.expiresAt) < new Date()) {
      return { label: 'Expired', variant: 'default' as const }
    }
    return { label: 'Active', variant: 'success' as const }
  }

  const columns: Column<any>[] = [
    {
      key: 'client',
      header: 'Client',
      render: (session) => (
        <div>
          <p className="font-medium text-foreground">{session.client.companyName}</p>
          <p className="text-xs text-muted-foreground">{session.client.contactName}</p>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (session) => (
        <span className="text-sm text-muted-foreground font-mono">
          {session.ipAddress}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (session) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(session.createdAt)}
        </span>
      ),
    },
    {
      key: 'lastActiveAt',
      header: 'Last Active',
      render: (session) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(session.lastActiveAt)}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      render: (session) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(session.expiresAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (session) => {
        const status = getSessionStatus(session)
        return <StatusBadge label={status.label} variant={status.variant} />
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (session) => {
        const status = getSessionStatus(session)
        const isActive = status.label === 'Active'
        return isActive ? <SessionActions sessionId={session.id} /> : null
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(session) => session.id}
      emptyMessage="No sessions found"
    />
  )
}
