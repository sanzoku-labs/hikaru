import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, MessageSquare, Sparkles } from 'lucide-react'
import { ChatMessageView } from './ChatMessageView'
import { ChatInputView } from './ChatInputView'
import type { ChatMessage } from '@/types/api'

interface ChatPanelViewProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function ChatPanelView({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading = false,
  disabled = false,
  className,
}: ChatPanelViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[400px] max-w-full z-50',
          'bg-background border-l shadow-xl',
          'flex flex-col',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Chat with AI"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Ask AI</h2>
              <p className="text-xs text-muted-foreground">
                Ask questions about your data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted transition-colors'
            )}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="p-4 rounded-2xl bg-muted/50 text-muted-foreground mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="font-medium text-foreground mb-2">
                Start a conversation
              </h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Ask questions about your data. I can help analyze patterns, explain
                trends, or generate custom charts.
              </p>
              <div className="mt-6 space-y-2 w-full max-w-[280px]">
                <p className="text-xs text-muted-foreground font-medium">
                  Try asking:
                </p>
                <div className="space-y-1.5">
                  {[
                    'What are the key trends in this data?',
                    'Show me a breakdown by category',
                    'What insights can you find?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => onSendMessage(suggestion)}
                      disabled={disabled || isLoading}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg',
                        'text-xs text-muted-foreground',
                        'bg-muted/50 hover:bg-muted',
                        'transition-colors duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessageView key={message.id} message={message} />
              ))}
              {/* Typing indicator when loading */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInputView
          onSend={onSendMessage}
          isLoading={isLoading}
          disabled={disabled}
          placeholder={
            disabled
              ? 'Upload a file to start chatting...'
              : 'Ask a question about your data...'
          }
        />
      </div>
    </>
  )
}
