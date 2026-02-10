import { create } from 'zustand'
import type { FileContext, ConversationMessageDetail, ChartData } from '@/types/api'

interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  chart?: ChartData | null
  timestamp: string
}

interface AssistantState {
  // File selection (max 5)
  selectedFiles: FileContext[]
  addFile: (file: FileContext) => void
  removeFile: (fileId: number) => void
  clearFiles: () => void

  // Conversation state
  conversationId: string | null
  messages: AssistantMessage[]
  setConversationId: (id: string | null) => void
  addMessage: (message: AssistantMessage) => void
  loadMessages: (messages: ConversationMessageDetail[], conversationId: string) => void
  clearConversation: () => void

}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  // File selection
  selectedFiles: [],
  addFile: (file: FileContext) => {
    const current = get().selectedFiles
    if (current.length >= 5) {
      import('sonner').then(({ toast }) => toast.warning('Maximum 5 files allowed'))
      return
    }
    if (current.some((f) => f.file_id === file.file_id)) return
    set({ selectedFiles: [...current, file] })
  },
  removeFile: (fileId: number) => {
    set({
      selectedFiles: get().selectedFiles.filter((f) => f.file_id !== fileId),
    })
  },
  clearFiles: () => set({ selectedFiles: [] }),

  // Conversation state
  conversationId: null,
  messages: [],
  setConversationId: (id: string | null) => set({ conversationId: id }),
  addMessage: (message: AssistantMessage) => {
    set({ messages: [...get().messages, message] })
  },
  loadMessages: (messages: ConversationMessageDetail[], conversationId: string) => {
    set({
      conversationId,
      messages: messages.map((m) => ({
        id: m.id.toString(),
        role: m.role,
        content: m.content,
        chart: m.chart,
        timestamp: m.created_at,
      })),
    })
  },
  clearConversation: () => set({ conversationId: null, messages: [] }),
}))
