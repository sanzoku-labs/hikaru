import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'

interface ChatInputViewProps {
  onSend: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ChatInputView({
  onSend,
  isLoading = false,
  placeholder = 'Ask a question about your data...',
  disabled = false,
  className,
}: ChatInputViewProps) {
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
    if (trimmed && !isLoading && !disabled) {
      onSend(trimmed)
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = message.trim().length > 0 && !isLoading && !disabled

  return (
    <div className={cn('flex items-end gap-2 p-4 border-t bg-background', className)}>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3',
          'text-sm placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[44px] max-h-[120px]'
        )}
      />
      <button
        onClick={handleSubmit}
        disabled={!canSend}
        className={cn(
          'flex-shrink-0 h-11 w-11 rounded-xl',
          'flex items-center justify-center',
          'transition-all duration-200',
          canSend
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
        aria-label="Send message"
      >
        {isLoading ? (
          <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
