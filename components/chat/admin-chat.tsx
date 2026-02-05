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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/admin-chat.tsx:render',message:'AdminChat render',data:{quoteId,unreadCount,isLoading,hasMessages:!!messagesData?.messages?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  const handleSend = (content: string) => {
    sendMessage.mutate({ content })
  }

  const handleMarkAsRead = () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/admin-chat.tsx:handleMarkAsRead',message:'handleMarkAsRead invoked',data:{quoteId,unreadCount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
