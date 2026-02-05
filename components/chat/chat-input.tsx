'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  isSending?: boolean
  placeholder?: string
  maxLength?: number
}

export function ChatInput({
  onSend,
  disabled = false,
  isSending = false,
  placeholder = 'Type a message...',
  maxLength = 2000,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (!trimmed || disabled || isSending) return

    onSend(trimmed)
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const charCount = message.length
  const isOverLimit = charCount > maxLength
  const canSend = message.trim().length > 0 && !isOverLimit && !disabled && !isSending

  return (
    <div className="border-t border-white/10 p-4 bg-zinc-900/50">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className="w-full resize-none rounded-lg border border-white/10 bg-zinc-800/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed pr-12"
          />
          {charCount > 0 && (
            <span
              className={`absolute bottom-2 right-3 text-[10px] ${
                isOverLimit ? 'text-red-400' : 'text-muted-foreground'
              }`}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSend}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
