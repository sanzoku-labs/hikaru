import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUIStore } from './uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarCollapsed: false,
      chatPanelOpen: false,
      theme: 'light',
    })
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with default state', () => {
    const state = useUIStore.getState()

    expect(state.sidebarCollapsed).toBe(false)
    expect(state.chatPanelOpen).toBe(false)
    expect(state.theme).toBe('light')
  })

  describe('toggleSidebar', () => {
    it('toggles sidebarCollapsed', () => {
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarCollapsed).toBe(true)

      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    })
  })

  describe('toggleChat', () => {
    it('toggles chatPanelOpen', () => {
      useUIStore.getState().toggleChat()
      expect(useUIStore.getState().chatPanelOpen).toBe(true)

      useUIStore.getState().toggleChat()
      expect(useUIStore.getState().chatPanelOpen).toBe(false)
    })
  })

  describe('setTheme', () => {
    it('sets theme to dark', () => {
      useUIStore.getState().setTheme('dark')
      expect(useUIStore.getState().theme).toBe('dark')
    })

    it('sets theme to light', () => {
      useUIStore.getState().setTheme('dark')
      useUIStore.getState().setTheme('light')
      expect(useUIStore.getState().theme).toBe('light')
    })

    it('toggles dark class on document element', () => {
      const spy = vi.spyOn(document.documentElement.classList, 'toggle')

      useUIStore.getState().setTheme('dark')
      expect(spy).toHaveBeenCalledWith('dark', true)

      useUIStore.getState().setTheme('light')
      expect(spy).toHaveBeenCalledWith('dark', false)
    })
  })

  describe('persistence', () => {
    it('persists only sidebarCollapsed and theme (not chatPanelOpen)', () => {
      useUIStore.getState().toggleSidebar()
      useUIStore.getState().toggleChat()
      useUIStore.getState().setTheme('dark')

      const stored = JSON.parse(localStorage.getItem('ui-storage') || '{}')
      expect(stored.state?.sidebarCollapsed).toBe(true)
      expect(stored.state?.theme).toBe('dark')
      expect(stored.state?.chatPanelOpen).toBeUndefined()
    })
  })
})
