import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatFlow } from './useChatFlow'
import { useUIStore } from '@/stores/uiStore'

// Mock useQueryChat mutation
const mockChatMutateAsync = vi.fn()
vi.mock('@/services/api/mutations/useQueryChat', () => ({
  useQueryChat: () => ({
    mutateAsync: mockChatMutateAsync,
    isPending: false,
  }),
}))

describe('useChatFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUIStore.setState({ chatPanelOpen: false })
  })

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    expect(result.current.messages).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isOpen).toBe(false)
    expect(result.current.canChat).toBe(true)
  })

  it('canChat is false without uploadId', () => {
    const { result } = renderHook(() => useChatFlow({ uploadId: null }))

    expect(result.current.canChat).toBe(false)
  })

  it('sends a message and receives a response', async () => {
    mockChatMutateAsync.mockResolvedValue({
      conversation_id: 'conv-1',
      answer: 'Revenue is growing',
      timestamp: '2024-01-01T00:00:00Z',
      chart: null,
    })

    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    await act(async () => {
      await result.current.sendMessage('What are the trends?')
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0].role).toBe('user')
    expect(result.current.messages[0].content).toBe('What are the trends?')
    expect(result.current.messages[1].role).toBe('assistant')
    expect(result.current.messages[1].content).toBe('Revenue is growing')
  })

  it('passes conversation_id on follow-up messages', async () => {
    mockChatMutateAsync.mockResolvedValue({
      conversation_id: 'conv-1',
      answer: 'First answer',
      timestamp: '2024-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    await act(async () => {
      await result.current.sendMessage('First question')
    })

    mockChatMutateAsync.mockResolvedValue({
      conversation_id: 'conv-1',
      answer: 'Follow-up answer',
      timestamp: '2024-01-01T00:00:01Z',
    })

    await act(async () => {
      await result.current.sendMessage('Follow-up question')
    })

    expect(mockChatMutateAsync).toHaveBeenLastCalledWith({
      upload_id: 'u1',
      question: 'Follow-up question',
      conversation_id: 'conv-1',
    })
  })

  it('does nothing when sendMessage called without uploadId', async () => {
    const { result } = renderHook(() => useChatFlow({ uploadId: null }))

    await act(async () => {
      await result.current.sendMessage('test')
    })

    expect(mockChatMutateAsync).not.toHaveBeenCalled()
    expect(result.current.messages).toHaveLength(0)
  })

  it('handles API error with error message in chat', async () => {
    mockChatMutateAsync.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    await act(async () => {
      await result.current.sendMessage('test')
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1].role).toBe('assistant')
    expect(result.current.messages[1].content).toContain('error')
  })

  it('clears chat', async () => {
    mockChatMutateAsync.mockResolvedValue({
      conversation_id: 'conv-1',
      answer: 'Hi',
      timestamp: '',
    })

    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    await act(async () => {
      await result.current.sendMessage('hello')
    })

    act(() => { result.current.clearChat() })

    expect(result.current.messages).toEqual([])
  })

  it('opens chat panel', () => {
    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    act(() => { result.current.openChat() })
    expect(result.current.isOpen).toBe(true)
  })

  it('closes chat panel', () => {
    useUIStore.setState({ chatPanelOpen: true })
    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    act(() => { result.current.closeChat() })
    expect(result.current.isOpen).toBe(false)
  })

  it('toggles chat panel', () => {
    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    act(() => { result.current.toggleChat() })
    expect(result.current.isOpen).toBe(true)

    act(() => { result.current.toggleChat() })
    expect(result.current.isOpen).toBe(false)
  })

  it('openChat does nothing if already open', () => {
    useUIStore.setState({ chatPanelOpen: true })
    const { result } = renderHook(() => useChatFlow({ uploadId: 'u1' }))

    act(() => { result.current.openChat() })
    expect(result.current.isOpen).toBe(true) // still open, toggle was NOT called
  })
})
