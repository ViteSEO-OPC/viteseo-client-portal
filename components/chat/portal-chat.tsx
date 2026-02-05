'use client'

import { ChatContainer } from './chat-container'
import {
  usePortalMessages,
  useSendPortalMessage,
  usePortalUnreadCount,
  useMarkPortalMessagesRead,
} from '@/lib/query/hooks'

interface PortalChatProps {
  disabled?: boolean
}

export function PortalChat({ disabled = false }: PortalChatProps) {
  const { data: messagesData, isLoading } = usePortalMessages()
  const { data: unreadData } = usePortalUnreadCount()
  const sendMessage = useSendPortalMessage()
  const markAsRead = useMarkPortalMessagesRead()

  const handleSend = (content: string) => {
    sendMessage.mutate({ content })
  }

  const handleMarkAsRead = () => {
    markAsRead.mutate()
  }

  return (
    <ChatContainer
      messages={messagesData?.messages ?? []}
      currentUserType="client"
      unreadCount={unreadData?.count ?? 0}
      isLoading={isLoading}
      isSending={sendMessage.isPending}
      onSend={handleSend}
      onMarkAsRead={handleMarkAsRead}
      disabled={disabled}
      title="Chat with Us"
      showReadStatus={true}
    />
  )
}
