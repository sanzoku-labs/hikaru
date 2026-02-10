import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className="flex-1 resize-none min-h-[44px] max-h-[120px]"
      />
      <Button
        onClick={handleSubmit}
        disabled={!canSend}
        size="icon"
        className="flex-shrink-0 h-11 w-11"
        aria-label="Send message"
      >
        {isLoading ? (
          <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
