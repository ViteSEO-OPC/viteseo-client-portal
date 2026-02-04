'use client'

import { cn } from '@/lib/utils'

interface TimelineEvent {
  id: string
  eventType: string
  action: string
  actorType: string
  actorId?: string | null
  ipAddress?: string | null
  createdAt: string
  meta?: Record<string, unknown> | null
}

interface TimelineProps {
  events: TimelineEvent[]
  className?: string
}

const EVENT_ICONS: Record<string, string> = {
  QUOTE_CREATED: '📝',
  QUOTE_UPDATED: '✏️',
  QUOTE_SENT: '📤',
  QUOTE_VIEWED: '👁️',
  QUOTE_ACCEPTED: '✅',
  QUOTE_REJECTED: '❌',
  ACCESS_CODE_CREATED: '🔑',
  ACCESS_CODE_REVOKED: '🚫',
  PDF_DOWNLOADED: '📄',
  OTP_VERIFIED: '🔓',
  SESSION_CREATED: '🔗',
  SESSION_REVOKED: '🔒',
}

const EVENT_COLORS: Record<string, string> = {
  QUOTE_CREATED: 'text-green-500 bg-green-500/15',
  QUOTE_UPDATED: 'text-yellow-500 bg-yellow-500/15',
  QUOTE_SENT: 'text-blue-500 bg-blue-500/15',
  QUOTE_VIEWED: 'text-blue-500 bg-blue-500/15',
  QUOTE_ACCEPTED: 'text-green-500 bg-green-500/15',
  QUOTE_REJECTED: 'text-red-500 bg-red-500/15',
  ACCESS_CODE_CREATED: 'text-purple-500 bg-purple-500/15',
  ACCESS_CODE_REVOKED: 'text-orange-500 bg-orange-500/15',
  PDF_DOWNLOADED: 'text-purple-500 bg-purple-500/15',
  OTP_VERIFIED: 'text-green-500 bg-green-500/15',
  SESSION_CREATED: 'text-blue-500 bg-blue-500/15',
  SESSION_REVOKED: 'text-red-500 bg-red-500/15',
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function Timeline({ events, className }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No activity recorded yet
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="relative pl-10">
            {/* Circle with icon */}
            <div
              className={cn(
                'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm',
                EVENT_COLORS[event.eventType] || 'text-muted-foreground bg-muted'
              )}
            >
              {EVENT_ICONS[event.eventType] || '•'}
            </div>

            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">
                    {event.action}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="capitalize">{event.actorType}</span>
                    {event.ipAddress && (
                      <span className="font-mono">{event.ipAddress}</span>
                    )}
                  </div>
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(event.createdAt)}
                </time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
