import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAssistantFlow } from './useAssistantFlow'
import { useAssistantStore } from '@/stores/assistantStore'
import type { FileContext } from '@/types/api'

// Mock queries
vi.mock('@/services/api/queries/useProjects', () => ({
  useProjects: () => ({
    data: [{ id: 1, name: 'Project A' }],
    isLoading: false,
  }),
}))

vi.mock('@/services/api/queries/useConversations', () => ({
  useConversations: () => ({
    data: {
      conversations: [
        { conversation_id: 'c1', title: 'Chat 1', file_context: [], message_count: 3, created_at: '', updated_at: '' },
      ],
    },
    isLoading: false,
  }),
  useConversation: () => ({
    data: null,
  }),
}))

// Mock mutations
const mockQueryMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useAssistantQuery', () => ({
  useAssistantQuery: () => ({
    mutateAsync: mockQueryMutateAsync,
    isPending: false,
    error: null,
  }),
}))

const mockDeleteMutate = vi.fn()
vi.mock('@/services/api/mutations/useDeleteConversation', () => ({
  useDeleteConversation: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}))

const mockFile: FileContext = {
  file_id: 10,
  filename: 'sales.csv',
  project_id: 1,
  project_name: 'Project A',
}

describe('useAssistantFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAssistantStore.setState({
      selectedFiles: [],
      conversationId: null,
      messages: [],
      isChatOpen: true,
    })
  })

  it('returns projects data', () => {
    const { result } = renderHook(() => useAssistantFlow())

    expect(result.current.projects).toEqual([{ id: 1, name: 'Project A' }])
    expect(result.current.isLoadingProjects).toBe(false)
  })

  it('returns conversations list', () => {
    const { result } = renderHook(() => useAssistantFlow())

    expect(result.current.conversations).toHaveLength(1)
    expect(result.current.conversations[0]!.conversation_id).toBe('c1')
  })

  it('adds a file to selection', () => {
    const { result } = renderHook(() => useAssistantFlow())

    act(() => { result.current.addFile(mockFile) })

    expect(result.current.selectedFiles).toHaveLength(1)
    expect(result.current.selectedFiles[0]!.file_id).toBe(10)
    expect(result.current.canAddMoreFiles).toBe(true)
  })

  it('prevents adding more than 5 files', () => {
    useAssistantStore.setState({
      selectedFiles: [
        { file_id: 1, filename: 'a.csv', project_id: 1, project_name: 'P' },
        { file_id: 2, filename: 'b.csv', project_id: 1, project_name: 'P' },
        { file_id: 3, filename: 'c.csv', project_id: 1, project_name: 'P' },
        { file_id: 4, filename: 'd.csv', project_id: 1, project_name: 'P' },
        { file_id: 5, filename: 'e.csv', project_id: 1, project_name: 'P' },
      ],
    })

    const { result } = renderHook(() => useAssistantFlow())
    expect(result.current.canAddMoreFiles).toBe(false)

    act(() => { result.current.addFile(mockFile) })
    expect(result.current.selectedFiles).toHaveLength(5)
  })

  it('removes a file from selection', () => {
    useAssistantStore.setState({ selectedFiles: [mockFile] })

    const { result } = renderHook(() => useAssistantFlow())

    act(() => { result.current.removeFile(10) })

    expect(result.current.selectedFiles).toHaveLength(0)
  })

  it('clears all files', () => {
    useAssistantStore.setState({ selectedFiles: [mockFile] })

    const { result } = renderHook(() => useAssistantFlow())

    act(() => { result.current.clearFiles() })

    expect(result.current.selectedFiles).toHaveLength(0)
  })

  it('loads a conversation', () => {
    const { result } = renderHook(() => useAssistantFlow())

    act(() => { result.current.loadConversation('c1') })

    expect(result.current.conversationId).toBe('c1')
  })

  it('starts a new conversation (clears state)', () => {
    useAssistantStore.setState({
      conversationId: 'c1',
      messages: [{ id: '1', role: 'user', content: 'hello', timestamp: '' }],
      selectedFiles: [mockFile],
    })

    const { result } = renderHook(() => useAssistantFlow())

    act(() => { result.current.startNewConversation() })

    expect(result.current.conversationId).toBeNull()
    expect(result.current.messages).toHaveLength(0)
    expect(result.current.selectedFiles).toHaveLength(0)
  })

  it('sends a message and adds user + assistant messages', async () => {
    useAssistantStore.setState({ selectedFiles: [mockFile] })
    mockQueryMutateAsync.mockResolvedValue({
      conversation_id: 'c-new',
      answer: 'Analysis shows growth',
      chart: null,
      timestamp: '2024-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useAssistantFlow())

    await act(async () => {
      await result.current.sendMessage('What are the trends?')
    })

    expect(mockQueryMutateAsync).toHaveBeenCalledWith({
      file_ids: [10],
      question: 'What are the trends?',
      conversation_id: undefined,
    })
    // Should have added user message + assistant message
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]!.role).toBe('user')
    expect(result.current.messages[1]!.role).toBe('assistant')
    expect(result.current.conversationId).toBe('c-new')
  })

  it('throws error when sending message without files', async () => {
    const { result } = renderHook(() => useAssistantFlow())

    await expect(
      act(async () => { await result.current.sendMessage('test') })
    ).rejects.toThrow('Please select at least one file to query')
  })

  it('deletes a conversation', () => {
    const { result } = renderHook(() => useAssistantFlow())

    act(() => { result.current.deleteConversation('c1') })

    expect(mockDeleteMutate).toHaveBeenCalledWith('c1', expect.any(Object))
  })

  it('clears current conversation when deleting it', () => {
    useAssistantStore.setState({ conversationId: 'c1', messages: [{ id: '1', role: 'user', content: 'hi', timestamp: '' }] })

    const { result } = renderHook(() => useAssistantFlow())

    // Simulate onSuccess callback
    mockDeleteMutate.mockImplementation((_id: string, opts: { onSuccess: () => void }) => {
      opts.onSuccess()
    })

    act(() => { result.current.deleteConversation('c1') })

    expect(result.current.conversationId).toBeNull()
    expect(result.current.messages).toHaveLength(0)
  })
})
