'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminChat } from '@/components/chat'
import { MessageCircle, User, FileText, Clock, ChevronRight, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Conversation {
  quoteId: string
  quoteNumber: string
  clientId: string
  clientName: string
  contactName: string
  lastMessageAt: string | null
  lastMessageFrom: 'client' | 'admin' | null
  unreadCount: number
  status: string
}

interface MessagesInboxProps {
  conversations: Conversation[]
}

export function MessagesInbox({ conversations }: MessagesInboxProps) {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)

  // Auto-select first conversation on desktop only
  useEffect(() => {
    if (window.innerWidth >= 1024 && !selectedQuoteId && conversations.length > 0) {
      setSelectedQuoteId(conversations[0].quoteId)
    }
  }, [conversations, selectedQuoteId])

  const handleSelectConversation = (quoteId: string) => {
    setSelectedQuoteId(quoteId)
    setShowChatOnMobile(true)
  }

  const handleBackToInbox = () => {
    setShowChatOnMobile(false)
  }

  const selectedConversation = conversations.find((c) => c.quoteId === selectedQuoteId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-500/15 text-blue-400'
      case 'viewed':
        return 'bg-yellow-500/15 text-yellow-400'
      case 'accepted':
        return 'bg-green-500/15 text-green-400'
      case 'rejected':
        return 'bg-red-500/15 text-red-400'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (conversations.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-white/10 h-[500px]">
        <div className="flex flex-col items-center justify-center h-full py-16">
          <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            When clients send messages about their quotes, they will appear here.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900/50 border-white/10 h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] min-h-[500px] flex overflow-hidden">
      {/* Conversation List */}
      <div 
        className={`
          flex-col border-r border-white/10 bg-zinc-900/30 w-full lg:w-1/3
          ${showChatOnMobile ? 'hidden lg:flex' : 'flex'}
        `}
      >
        <div className="p-4 border-b border-white/10 shrink-0 bg-zinc-900/50 h-16 flex items-center">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Inbox
            {conversations.reduce((acc, c) => acc + c.unreadCount, 0) > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
              </span>
            )}
          </h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {conversations.map((conversation) => (
            <button
              key={conversation.quoteId}
              onClick={() => handleSelectConversation(conversation.quoteId)}
              className={`w-full text-left p-4 border-b border-white/5 transition-colors hover:bg-white/5 ${
                selectedQuoteId === conversation.quoteId ? 'bg-primary/10 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${selectedQuoteId === conversation.quoteId ? 'text-primary' : 'text-foreground'}`}>
                      {conversation.clientName}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {conversation.quoteNumber}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(conversation.status)}`}>
                      {conversation.status}
                    </span>
                  </div>
                  {conversation.lastMessageAt && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                      {conversation.lastMessageFrom === 'client' && (
                        <span className="text-primary ml-1">• from client</span>
                      )}
                    </div>
                  )}
                  {!conversation.lastMessageAt && (
                    <div className="text-xs text-muted-foreground/60 mt-2 italic">
                      No messages yet
                    </div>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-colors ${selectedQuoteId === conversation.quoteId ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div 
        className={`
          flex-col min-w-0 bg-background/50 w-full lg:w-2/3 lg:flex
          ${showChatOnMobile ? 'flex' : 'hidden'}
        `}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 shrink-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {/* Back Button - Visible only on mobile */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden -ml-2 text-muted-foreground hover:text-white"
                  onClick={handleBackToInbox}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-xs">
                      {selectedConversation.clientName}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded hidden sm:inline-block ${getStatusColor(selectedConversation.status)}`}>
                      {selectedConversation.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="hidden sm:inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {selectedConversation.quoteNumber}
                      <span className="mx-1">•</span>
                    </span>
                    {selectedConversation.contactName}
                  </div>
                </div>
              </div>
              <Link href={`/admin/quotes/${selectedConversation.quoteId}`}>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  View Quote
                </Button>
              </Link>
            </div>

            {/* Chat Component */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0">
                <AdminChat quoteId={selectedConversation.quoteId} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-zinc-900/20 p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
            <p className="text-muted-foreground text-sm">Choose a client from the list to start chatting</p>
          </div>
        )}
      </div>
    </Card>
  )
}
