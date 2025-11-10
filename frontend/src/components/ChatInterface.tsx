import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, Trash2, MessageCircle } from 'lucide-react'
import { api, ApiError } from '@/services/api'
import type { ConversationMessage } from '@/types'

interface ChatInterfaceProps {
  uploadId: string
}

const SUGGESTED_QUESTIONS = [
  'What are the main trends in this data?',
  'Which category has the highest values?',
  'Are there any notable outliers?',
  'What insights can you provide about this dataset?',
]

export function ChatInterface({ uploadId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [question, setQuestion] = useState('')
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (questionText: string) => {
    if (!questionText.trim() || loading) return

    setError(null)
    setLoading(true)

    // Add user message immediately
    const userMessage: ConversationMessage = {
      role: 'user',
      content: questionText,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setQuestion('')

    try {
      const response = await api.queryData({
        upload_id: uploadId,
        question: questionText,
        conversation_id: conversationId,
      })

      // Add assistant response
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: response.timestamp,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setConversationId(response.conversation_id)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message)
      } else {
        setError('Failed to get response. Please try again.')
      }
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setConversationId(undefined)
    setQuestion('')
    setError(null)
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <CardTitle>Ask Questions About Your Data</CardTitle>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Try asking questions like:
            </p>
            <div className="grid gap-2">
              {SUGGESTED_QUESTIONS.map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleSubmit(q)}
                  disabled={loading}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Ask a question about your data..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(question)
              }
            }}
            disabled={loading}
          />
          <Button
            onClick={() => handleSubmit(question)}
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
