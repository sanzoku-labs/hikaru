/**
 * Chat - Q&A Chat interface with AI (Mockup 6)
 *
 * Features:
 * - Chat message history
 * - Message input with suggestions
 * - Context selection (project/file)
 * - AI-powered responses
 * - Suggested follow-up questions
 */

import { useState, useRef, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface ContextOption {
  type: 'project' | 'file'
  id: number
  name: string
}

const suggestedQuestions = [
  'What are the key trends in this data?',
  'Show me the top performers',
  'Compare this month vs last month',
  'What anomalies should I be aware of?',
  'Summarize the main insights'
]

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedContext, setSelectedContext] = useState<string>('none')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock context options (in real app, fetch from API)
  const contextOptions: ContextOption[] = [
    { type: 'project', id: 1, name: 'Q4 Sales Analysis' },
    { type: 'file', id: 1, name: 'sales_data.csv' },
    { type: 'file', id: 2, name: 'customer_data.csv' }
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // TODO: Call AI query API
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a simulated AI response. In the production version, this will connect to the Claude API to provide intelligent answers based on your data context.',
        timestamp: new Date(),
        suggestions: [
          'Tell me more about this trend',
          'What caused this change?',
          'Show me related data'
        ]
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Failed to get response:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="border-b bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Q&A Chat</h1>
                  <p className="text-xs text-muted-foreground">
                    Ask questions about your data
                  </p>
                </div>
              </div>

              {/* Context Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Context:</span>
                <Select value={selectedContext} onValueChange={setSelectedContext}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select context..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No context</SelectItem>
                    {contextOptions.map((option) => (
                      <SelectItem
                        key={`${option.type}-${option.id}`}
                        value={`${option.type}-${option.id}`}
                      >
                        <div className="flex items-center gap-2">
                          {option.type === 'project' ? (
                            <FolderOpen className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          <span className="truncate">{option.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Start a Conversation</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Ask questions about your data and get AI-powered insights
                </p>

                {/* Suggested Questions */}
                <div className="space-y-2 w-full max-w-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Suggested questions:
                  </p>
                  {suggestedQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-4',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        'flex flex-col gap-2 max-w-2xl',
                        message.role === 'user' && 'items-end'
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-lg px-4 py-3',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>

                      <span className="text-xs text-muted-foreground px-2">
                        {formatTime(message.timestamp)}
                      </span>

                      {/* Follow-up Suggestions */}
                      {message.role === 'assistant' && message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleSuggestedQuestion(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {/* Loading Indicator */}
                {loading && (
                  <div className="flex gap-4">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4 text-primary animate-pulse" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2 max-w-2xl">
                      <div className="rounded-lg px-4 py-3 bg-muted">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t bg-card p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={!input.trim() || loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {selectedContext !== 'none' && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Context selected: {contextOptions.find(o => `${o.type}-${o.id}` === selectedContext)?.name}
              </p>
            )}
          </div>
        </div>

        {/* Right Sidebar - Context Info (Optional) */}
        <div className="w-80 border-l bg-card p-6 space-y-6 hidden xl:block">
          <div>
            <h3 className="text-sm font-semibold mb-3">Tips</h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs flex-shrink-0">1</Badge>
                <p>Select a project or file context for more relevant answers</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs flex-shrink-0">2</Badge>
                <p>Ask specific questions about trends, patterns, or anomalies</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs flex-shrink-0">3</Badge>
                <p>Use follow-up suggestions to dive deeper into insights</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Example Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.slice(0, 3).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors text-xs"
                >
                  {question}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
