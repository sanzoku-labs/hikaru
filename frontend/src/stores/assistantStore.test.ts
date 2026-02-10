import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAssistantStore } from './assistantStore'
import type { FileContext, ConversationMessageDetail } from '@/types/api'

const mockFile: FileContext = {
  file_id: 1,
  filename: 'sales.csv',
  project_id: 1,
  project_name: 'Project A',
}

describe('assistantStore', () => {
  beforeEach(() => {
    useAssistantStore.setState({
      selectedFiles: [],
      conversationId: null,
      messages: [],
    })
    vi.restoreAllMocks()
  })

  describe('file selection', () => {
    it('starts with empty selected files', () => {
      expect(useAssistantStore.getState().selectedFiles).toEqual([])
    })

    it('adds a file', () => {
      useAssistantStore.getState().addFile(mockFile)
      expect(useAssistantStore.getState().selectedFiles).toHaveLength(1)
      expect(useAssistantStore.getState().selectedFiles[0]!.file_id).toBe(1)
    })

    it('prevents duplicate files', () => {
      useAssistantStore.getState().addFile(mockFile)
      useAssistantStore.getState().addFile(mockFile)
      expect(useAssistantStore.getState().selectedFiles).toHaveLength(1)
    })

    it('limits to 5 files', () => {
      for (let i = 1; i <= 6; i++) {
        useAssistantStore.getState().addFile({
          file_id: i,
          filename: `file${i}.csv`,
          project_id: 1,
          project_name: 'P',
        })
      }
      expect(useAssistantStore.getState().selectedFiles).toHaveLength(5)
    })

    it('removes a file by id', () => {
      useAssistantStore.getState().addFile(mockFile)
      useAssistantStore.getState().addFile({ ...mockFile, file_id: 2, filename: 'b.csv' })

      useAssistantStore.getState().removeFile(1)
      expect(useAssistantStore.getState().selectedFiles).toHaveLength(1)
      expect(useAssistantStore.getState().selectedFiles[0]!.file_id).toBe(2)
    })

    it('clears all files', () => {
      useAssistantStore.getState().addFile(mockFile)
      useAssistantStore.getState().clearFiles()
      expect(useAssistantStore.getState().selectedFiles).toEqual([])
    })
  })

  describe('conversation state', () => {
    it('starts with null conversationId and empty messages', () => {
      const state = useAssistantStore.getState()
      expect(state.conversationId).toBeNull()
      expect(state.messages).toEqual([])
    })

    it('sets conversationId', () => {
      useAssistantStore.getState().setConversationId('conv-1')
      expect(useAssistantStore.getState().conversationId).toBe('conv-1')
    })

    it('adds a message', () => {
      useAssistantStore.getState().addMessage({
        id: 'm1',
        role: 'user',
        content: 'Hello',
        timestamp: '2024-01-01T00:00:00Z',
      })
      expect(useAssistantStore.getState().messages).toHaveLength(1)
      expect(useAssistantStore.getState().messages[0]!.content).toBe('Hello')
    })

    it('loads messages from conversation detail', () => {
      const serverMessages = [
        { id: 1, role: 'user' as const, content: 'Question', chart: null, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, role: 'assistant' as const, content: 'Answer', chart: null, created_at: '2024-01-01T00:00:01Z' },
      ] as ConversationMessageDetail[]

      useAssistantStore.getState().loadMessages(serverMessages, 'conv-1')

      const state = useAssistantStore.getState()
      expect(state.conversationId).toBe('conv-1')
      expect(state.messages).toHaveLength(2)
      expect(state.messages[0]!.id).toBe('1')
      expect(state.messages[0]!.role).toBe('user')
      expect(state.messages[1]!.role).toBe('assistant')
    })

    it('clears conversation', () => {
      useAssistantStore.getState().setConversationId('conv-1')
      useAssistantStore.getState().addMessage({
        id: 'm1',
        role: 'user',
        content: 'Hello',
        timestamp: '',
      })

      useAssistantStore.getState().clearConversation()

      expect(useAssistantStore.getState().conversationId).toBeNull()
      expect(useAssistantStore.getState().messages).toEqual([])
    })
  })

})
