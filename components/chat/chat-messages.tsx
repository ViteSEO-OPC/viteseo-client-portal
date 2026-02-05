'use client'

import { useEffect, useRef } from 'react'
import { ChatBubble } from './chat-bubble'
import type { Message } from '@/lib/query/hooks'
import { Loader2 } from 'lucide-react'

interface ChatMessagesProps {
  messages: Message[]
  currentUserType: 'client' | 'admin'
  isLoading?: boolean
  showReadStatus?: boolean
}

export function ChatMessages({
  messages,
  currentUserType,
  isLoading = false,
  showReadStatus = false,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground text-center">
          No messages yet. Start the conversation!
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
    >
      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          content={message.content}
          isSent={message.senderType === currentUserType}
          isRead={message.isRead}
          timestamp={message.createdAt}
          showReadStatus={showReadStatus}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
