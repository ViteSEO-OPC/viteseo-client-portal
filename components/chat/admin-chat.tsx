'use client'

import { ChatContainer } from './chat-container'
import {
  useAdminMessages,
  useSendAdminMessage,
  useMarkAdminMessagesRead,
  useAdminUnreadCounts,
} from '@/lib/query/hooks'

interface AdminChatProps {
  quoteId: string
}

export function AdminChat({ quoteId }: AdminChatProps) {
  const { data: messagesData, isLoading } = useAdminMessages(quoteId)
  const { data: unreadData } = useAdminUnreadCounts()
  const sendMessage = useSendAdminMessage(quoteId)
  const markAsRead = useMarkAdminMessagesRead(quoteId)

  const unreadCount = unreadData?.counts?.[quoteId] ?? 0

  const handleSend = (content: string) => {
    sendMessage.mutate({ content })
  }

  const handleMarkAsRead = () => {
    markAsRead.mutate()
  }

  return (
    <ChatContainer
      messages={messagesData?.messages ?? []}
      currentUserType="admin"
      unreadCount={unreadCount}
      isLoading={isLoading}
      isSending={sendMessage.isPending}
      onSend={handleSend}
      onMarkAsRead={handleMarkAsRead}
      title="Client Messages"
      showReadStatus={true}
    />
  )
}
