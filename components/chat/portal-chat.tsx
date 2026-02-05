'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatContainer } from './chat-container'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, ChevronDown } from 'lucide-react'
import {
  usePortalMessages,
  useSendPortalMessage,
  usePortalUnreadCount,
  useMarkPortalMessagesRead,
} from '@/lib/query/hooks'
import { cn } from '@/lib/utils'

interface PortalChatProps {
  disabled?: boolean
}

export function PortalChat({ disabled = false }: PortalChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: messagesData, isLoading } = usePortalMessages()
  const { data: unreadData } = usePortalUnreadCount()
  const sendMessage = useSendPortalMessage()
  const markAsRead = useMarkPortalMessagesRead()

  const unreadCount = unreadData?.count ?? 0

  // Auto-open chat if there are unread messages and we haven't opened it yet
  // Optional: Add logic to only do this once per session if desired
  useEffect(() => {
    if (unreadCount > 0 && !isOpen) {
      // You can uncomment this if you want it to pop open automatically
      // setIsOpen(true)
    }
  }, [unreadCount, isOpen])

  const handleSend = useCallback(
    (content: string) => {
      sendMessage.mutate({ content })
    },
    [sendMessage]
  )

  const handleMarkAsRead = useCallback(() => {
    if (isOpen) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/portal-chat.tsx:handleMarkAsRead',message:'handleMarkAsRead called',data:{isOpen,unreadCount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      markAsRead.mutate()
    }
  }, [isOpen, markAsRead, unreadCount])

  // Effect to mark as read when opening
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/portal-chat.tsx:useEffect',message:'markAsRead effect',data:{isOpen,unreadCount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (isOpen && unreadCount > 0) {
      handleMarkAsRead()
    }
  }, [handleMarkAsRead, isOpen, unreadCount])

  if (disabled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-4 sm:bottom-8 sm:right-8">
      {/* Chat Window */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out origin-bottom-right overflow-hidden shadow-2xl rounded-2xl border border-zinc-800 bg-zinc-950",
          isOpen
            ? "w-[calc(100vw-2rem)] h-[70dvh] max-h-[600px] sm:w-[400px] opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "w-0 h-0 opacity-0 scale-95 pointer-events-none translate-y-10"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Custom Header with Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Chat with Us
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatContainer
              messages={messagesData?.messages ?? []}
              currentUserType="client"
              hideHeader={true}
              unreadCount={0} // We handle badge on the floating button instead
              isLoading={isLoading}
              isSending={sendMessage.isPending}
              onSend={handleSend}
              onMarkAsRead={handleMarkAsRead}
              disabled={disabled}
              showReadStatus={true}
              className="border-0 bg-transparent shadow-none"
            />
          </div>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-[0_0_20px_-5px_rgba(210,252,69,0.3)] hover:shadow-[0_0_30px_-5px_rgba(210,252,69,0.5)] transition-all duration-300",
          isOpen ? "bg-muted text-muted-foreground hover:bg-muted/80 rotate-90" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-3 -right-3 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background animate-in zoom-in">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </Button>
    </div>
  )
}
