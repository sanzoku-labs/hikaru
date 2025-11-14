import { Button } from '../ui/button'
import { Plus } from 'lucide-react'

interface ChatSession {
  id: string
  title: string
  firstQuestion: string
  timestamp: string
  isActive: boolean
}

interface ChatHistorySidebarProps {
  sessions: ChatSession[]
  onNewChat: () => void
  onSelectSession: (sessionId: string) => void
}

export function ChatHistorySidebar({
  sessions,
  onNewChat,
  onSelectSession
}: ChatHistorySidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Chat History</h3>
        <Button
          onClick={onNewChat}
          className="w-full bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No chat history yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new conversation</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                session.isActive
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <p className={`font-medium text-sm mb-1 ${
                session.isActive ? 'text-gray-900' : 'text-gray-900'
              }`}>
                {session.title}
              </p>
              <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                {session.firstQuestion}
              </p>
              <p className="text-gray-400 text-xs mt-1">{session.timestamp}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
