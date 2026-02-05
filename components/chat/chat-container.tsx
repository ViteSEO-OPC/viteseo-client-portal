'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ChatBadge } from './chat-badge'
import { MessageCircle } from 'lucide-react'
import type { Message } from '@/lib/query/hooks'

interface ChatContainerProps {
  messages: Message[]
  currentUserType: 'client' | 'admin'
  unreadCount?: number
  isLoading?: boolean
  isSending?: boolean
  onSend: (content: string) => void
  onMarkAsRead?: () => void
  disabled?: boolean
  title?: string
  showReadStatus?: boolean
}

export function ChatContainer({
  messages,
  currentUserType,
  unreadCount = 0,
  isLoading = false,
  isSending = false,
  onSend,
  onMarkAsRead,
  disabled = false,
  title = 'Messages',
  showReadStatus = false,
}: ChatContainerProps) {
  // Mark messages as read when chat is opened/visible
  useEffect(() => {
    if (onMarkAsRead && unreadCount > 0) {
      onMarkAsRead()
    }
  }, [onMarkAsRead, unreadCount])

  return (
    <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-sm flex flex-col h-full">
      <CardHeader className="border-b border-white/10 py-4 shrink-0">
        <CardTitle className="text-lg font-heading text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          {title}
          {unreadCount > 0 && <ChatBadge count={unreadCount} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <ChatMessages
          messages={messages}
          currentUserType={currentUserType}
          isLoading={isLoading}
          showReadStatus={showReadStatus}
        />
        <ChatInput
          onSend={onSend}
          disabled={disabled}
          isSending={isSending}
        />
      </CardContent>
    </Card>
  )
}
