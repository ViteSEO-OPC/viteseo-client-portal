'use client'

import { DataTable, Column, StatusBadge } from '@/components/ui/data-table'
import { formatDate } from '@/lib/utils'

interface AuditLogsTableProps {
  data: any[]
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  OTP_VERIFIED: 'bg-green-500/15 text-green-500',
  OTP_FAILED: 'bg-red-500/15 text-red-500',
  OTP_LOCKED: 'bg-red-500/15 text-red-500',
  SESSION_CREATED: 'bg-blue-500/15 text-blue-500',
  SESSION_REVOKED: 'bg-orange-500/15 text-orange-500',
  QUOTE_VIEWED: 'bg-blue-500/15 text-blue-500',
  QUOTE_ACCEPTED: 'bg-green-500/15 text-green-500',
  QUOTE_REJECTED: 'bg-red-500/15 text-red-500',
  PDF_DOWNLOADED: 'bg-purple-500/15 text-purple-500',
  ACCESS_CODE_CREATED: 'bg-blue-500/15 text-blue-500',
  ACCESS_CODE_REVOKED: 'bg-orange-500/15 text-orange-500',
  CLIENT_CREATED: 'bg-green-500/15 text-green-500',
  CLIENT_UPDATED: 'bg-yellow-500/15 text-yellow-500',
  QUOTE_CREATED: 'bg-green-500/15 text-green-500',
  QUOTE_UPDATED: 'bg-yellow-500/15 text-yellow-500',
  QUOTE_SENT: 'bg-blue-500/15 text-blue-500',
  RATE_LIMIT_HIT: 'bg-red-500/15 text-red-500',
}

const ACTOR_TYPE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-500',
  client: 'bg-blue-500/15 text-blue-500',
  system: 'bg-gray-500/15 text-gray-500',
  anonymous: 'bg-gray-500/15 text-gray-500',
}

export function AuditLogsTable({ data }: AuditLogsTableProps) {
  const columns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (log) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(log.createdAt)}
        </span>
      ),
    },
    {
      key: 'eventType',
      header: 'Event',
      render: (log) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_COLORS[log.eventType] || 'bg-muted text-muted-foreground'}`}>
          {log.eventType}
        </span>
      ),
    },
    {
      key: 'actorType',
      header: 'Actor',
      render: (log) => (
        <div>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTOR_TYPE_COLORS[log.actorType] || 'bg-muted text-muted-foreground'}`}>
            {log.actorType}
          </span>
          {log.actorId && (
            <span className="ml-2 text-xs text-muted-foreground font-mono">
              {log.actorId.slice(0, 8)}...
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <span className="text-sm text-foreground max-w-[200px] truncate block" title={log.action}>
          {log.action}
        </span>
      ),
    },
    {
      key: 'resourceType',
      header: 'Resource',
      render: (log) => log.resourceType ? (
        <span className="text-sm text-muted-foreground">
          {log.resourceType}
          {log.resourceId && (
            <span className="ml-1 text-xs font-mono">({log.resourceId.slice(0, 8)}...)</span>
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (log) => (
        <span className="text-sm text-muted-foreground font-mono">
          {log.ipAddress || '-'}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(log) => log.id}
      emptyMessage="No audit logs found"
    />
  )
}
