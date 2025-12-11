import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegister } from '@/services/api/mutations/useRegister'

interface RegisterFormState {
  email: string
  username: string
  password: string
  fullName: string
  errors: {
    email?: string
    username?: string
    password?: string
    fullName?: string
  }
}

export interface UseRegisterFlowReturn {
  // Form state
  form: RegisterFormState

  // Handlers
  setField: (field: keyof Omit<RegisterFormState, 'errors'>, value: string) => void
  handleSubmit: () => Promise<void>

  // Status
  isSubmitting: boolean
  submitError: string | null
}

export function useRegisterFlow(): UseRegisterFlowReturn {
  const navigate = useNavigate()
  const registerMutation = useRegister()

  const [form, setForm] = useState<RegisterFormState>({
    email: '',
    username: '',
    password: '',
    fullName: '',
    errors: {},
  })

  const setField = useCallback((field: keyof Omit<RegisterFormState, 'errors'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  const validate = useCallback((): boolean => {
    const errors: RegisterFormState['errors'] = {}

    // Email validation
    if (!form.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Username validation
    if (!form.username.trim()) {
      errors.username = 'Username is required'
    } else if (form.username.length < 3) {
      errors.username = 'Username must be at least 3 characters'
    }

    // Password validation (matches backend requirements)
    if (!form.password) {
      errors.password = 'Password is required'
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(form.password)) {
      errors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[a-z]/.test(form.password)) {
      errors.password = 'Password must contain at least one lowercase letter'
    } else if (!/[0-9]/.test(form.password)) {
      errors.password = 'Password must contain at least one number'
    }

    // Full name is optional but if provided, validate length
    if (form.fullName && form.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters'
    }

    setForm((prev) => ({ ...prev, errors }))
    return Object.keys(errors).length === 0
  }, [form.email, form.username, form.password, form.fullName])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    try {
      await registerMutation.mutateAsync({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        full_name: form.fullName.trim() || undefined,
      })

      // Redirect to home after successful registration
      navigate('/', { replace: true })
    } catch {
      // Error is handled by mutation state
    }
  }, [validate, form, registerMutation, navigate])

  // Extract error message from mutation error
  const submitError = registerMutation.error
    ? (registerMutation.error as Error).message || 'Registration failed. Please try again.'
    : null

  return {
    form,
    setField,
    handleSubmit,
    isSubmitting: registerMutation.isPending,
    submitError,
  }
}
