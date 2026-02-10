import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectsListFlow } from './useProjectsListFlow'
import type { ProjectResponse } from '@/types/api'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock projects query
const mockProjects: ProjectResponse[] = [
  {
    id: 1,
    name: 'Project A',
    description: 'First project',
    user_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    file_count: 3,
  },
  {
    id: 2,
    name: 'Project B',
    description: null,
    user_id: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    file_count: 0,
  },
]

vi.mock('@/services/api/queries/useProjects', () => ({
  useProjects: () => ({
    data: mockProjects,
    isLoading: false,
    error: null,
  }),
}))

// Mock create/delete mutations
const mockCreateMutateAsync = vi.fn()
const mockDeleteMutateAsync = vi.fn()

vi.mock('@/services/api/mutations/useCreateProject', () => ({
  useCreateProject: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
}))

vi.mock('@/services/api/mutations/useDeleteProject', () => ({
  useDeleteProject: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}))

describe('useProjectsListFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns projects from query', () => {
    const { result } = renderHook(() => useProjectsListFlow())

    expect(result.current.projects).toEqual(mockProjects)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchError).toBeNull()
  })

  describe('create form', () => {
    it('starts closed', () => {
      const { result } = renderHook(() => useProjectsListFlow())
      expect(result.current.createForm.isOpen).toBe(false)
    })

    it('opens with empty fields', () => {
      const { result } = renderHook(() => useProjectsListFlow())

      act(() => {
        result.current.openCreateForm()
      })

      expect(result.current.createForm.isOpen).toBe(true)
      expect(result.current.createForm.name).toBe('')
      expect(result.current.createForm.description).toBe('')
    })

    it('closes the form', () => {
      const { result } = renderHook(() => useProjectsListFlow())

      act(() => {
        result.current.openCreateForm()
      })
      act(() => {
        result.current.closeCreateForm()
      })

      expect(result.current.createForm.isOpen).toBe(false)
    })

    it('updates form fields', () => {
      const { result } = renderHook(() => useProjectsListFlow())

      act(() => {
        result.current.setCreateField('name', 'New Project')
        result.current.setCreateField('description', 'A new project')
      })

      expect(result.current.createForm.name).toBe('New Project')
      expect(result.current.createForm.description).toBe('A new project')
    })

    it('validates name is required', async () => {
      const { result } = renderHook(() => useProjectsListFlow())

      await act(async () => {
        await result.current.handleCreate()
      })

      expect(result.current.createForm.errors.name).toBe('Project name is required')
      expect(mockCreateMutateAsync).not.toHaveBeenCalled()
    })

    it('validates name min length', async () => {
      const { result } = renderHook(() => useProjectsListFlow())

      act(() => {
        result.current.setCreateField('name', 'AB')
      })

      await act(async () => {
        await result.current.handleCreate()
      })

      expect(result.current.createForm.errors.name).toBe(
        'Project name must be at least 3 characters'
      )
    })

    it('creates project and navigates on valid submit', async () => {
      mockCreateMutateAsync.mockResolvedValue({ id: 99, name: 'New Project' })

      const { result } = renderHook(() => useProjectsListFlow())

      act(() => {
        result.current.setCreateField('name', 'New Project')
        result.current.setCreateField('description', 'Description')
      })

      await act(async () => {
        await result.current.handleCreate()
      })

      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        name: 'New Project',
        description: 'Description',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/projects/99')
    })
  })

  describe('delete', () => {
    it('calls delete mutation with project ID', async () => {
      mockDeleteMutateAsync.mockResolvedValue(undefined)

      const { result } = renderHook(() => useProjectsListFlow())

      await act(async () => {
        await result.current.handleDelete(1)
      })

      expect(mockDeleteMutateAsync).toHaveBeenCalledWith(1)
    })
  })

  describe('navigateToProject', () => {
    it('navigates to project detail page', () => {
      const { result } = renderHook(() => useProjectsListFlow())

      act(() => {
        result.current.navigateToProject(42)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42')
    })
  })
})
