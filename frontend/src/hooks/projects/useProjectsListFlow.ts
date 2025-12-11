import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '@/services/api/queries/useProjects'
import { useCreateProject } from '@/services/api/mutations/useCreateProject'
import { useDeleteProject } from '@/services/api/mutations/useDeleteProject'
import type { ProjectResponse } from '@/types/api'

interface CreateFormState {
  isOpen: boolean
  name: string
  description: string
  errors: {
    name?: string
    description?: string
  }
}

export interface UseProjectsListFlowReturn {
  // Data
  projects: ProjectResponse[]
  isLoading: boolean
  fetchError: string | null

  // Create form
  createForm: CreateFormState

  // Handlers
  openCreateForm: () => void
  closeCreateForm: () => void
  setCreateField: (field: 'name' | 'description', value: string) => void
  handleCreate: () => Promise<void>
  handleDelete: (projectId: number) => Promise<void>
  navigateToProject: (projectId: number) => void

  // Status
  isCreating: boolean
  isDeleting: boolean
  deletingId: number | null
}

export function useProjectsListFlow(): UseProjectsListFlowReturn {
  const navigate = useNavigate()
  const projectsQuery = useProjects()
  const createMutation = useCreateProject()
  const deleteMutation = useDeleteProject()

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [createForm, setCreateForm] = useState<CreateFormState>({
    isOpen: false,
    name: '',
    description: '',
    errors: {},
  })

  const openCreateForm = useCallback(() => {
    setCreateForm({
      isOpen: true,
      name: '',
      description: '',
      errors: {},
    })
  }, [])

  const closeCreateForm = useCallback(() => {
    setCreateForm((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const setCreateField = useCallback((field: 'name' | 'description', value: string) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  const validateCreateForm = useCallback((): boolean => {
    const errors: CreateFormState['errors'] = {}

    if (!createForm.name.trim()) {
      errors.name = 'Project name is required'
    } else if (createForm.name.length < 3) {
      errors.name = 'Project name must be at least 3 characters'
    }

    setCreateForm((prev) => ({ ...prev, errors }))
    return Object.keys(errors).length === 0
  }, [createForm.name])

  const handleCreate = useCallback(async () => {
    if (!validateCreateForm()) return

    try {
      const project = await createMutation.mutateAsync({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
      })
      closeCreateForm()
      // Navigate to the new project
      navigate(`/projects/${project.id}`)
    } catch {
      // Error handled by mutation state
    }
  }, [validateCreateForm, createForm, createMutation, closeCreateForm, navigate])

  const handleDelete = useCallback(async (projectId: number) => {
    setDeletingId(projectId)
    try {
      await deleteMutation.mutateAsync(projectId)
    } finally {
      setDeletingId(null)
    }
  }, [deleteMutation])

  const navigateToProject = useCallback((projectId: number) => {
    navigate(`/projects/${projectId}`)
  }, [navigate])

  return {
    projects: projectsQuery.data || [],
    isLoading: projectsQuery.isLoading,
    fetchError: projectsQuery.error
      ? (projectsQuery.error as Error).message
      : null,
    createForm,
    openCreateForm,
    closeCreateForm,
    setCreateField,
    handleCreate,
    handleDelete,
    navigateToProject,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    deletingId,
  }
}
