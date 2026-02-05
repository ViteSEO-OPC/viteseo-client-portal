'use client'

import { cn } from '@/lib/utils'
import { Check, CheckCheck } from 'lucide-react'

interface ChatBubbleProps {
  content: string
  isSent: boolean
  isRead?: boolean
  timestamp: string
  showReadStatus?: boolean
}

export function ChatBubble({
  content,
  isSent,
  isRead,
  timestamp,
  showReadStatus = false,
}: ChatBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      className={cn(
        'flex w-full',
        isSent ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm',
          isSent
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-white/10 text-foreground rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <div
          className={cn(
            'flex items-center gap-1.5 mt-1',
            isSent ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {formatTime(timestamp)}
          </span>
          {showReadStatus && isSent && (
            <span className={cn('text-primary-foreground/70')}>
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
