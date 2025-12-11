import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLogin } from '@/services/api/mutations/useLogin'

interface LoginFormState {
  username: string
  password: string
  errors: {
    username?: string
    password?: string
  }
}

export interface UseLoginFlowReturn {
  // Form state
  form: LoginFormState

  // Handlers
  setUsername: (value: string) => void
  setPassword: (value: string) => void
  handleSubmit: () => Promise<void>

  // Status
  isSubmitting: boolean
  submitError: string | null
}

export function useLoginFlow(): UseLoginFlowReturn {
  const navigate = useNavigate()
  const location = useLocation()
  const loginMutation = useLogin()

  const [form, setForm] = useState<LoginFormState>({
    username: '',
    password: '',
    errors: {},
  })

  const setUsername = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      username: value,
      errors: { ...prev.errors, username: undefined },
    }))
  }, [])

  const setPassword = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      password: value,
      errors: { ...prev.errors, password: undefined },
    }))
  }, [])

  const validate = useCallback((): boolean => {
    const errors: LoginFormState['errors'] = {}

    if (!form.username.trim()) {
      errors.username = 'Username or email is required'
    }

    if (!form.password) {
      errors.password = 'Password is required'
    }

    setForm((prev) => ({ ...prev, errors }))
    return Object.keys(errors).length === 0
  }, [form.username, form.password])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    try {
      await loginMutation.mutateAsync({
        username: form.username.trim(),
        password: form.password,
      })

      // Redirect to the page they tried to visit or home
      const from = (location.state as { from?: Location })?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch {
      // Error is handled by mutation state
    }
  }, [validate, form.username, form.password, loginMutation, navigate, location.state])

  // Extract error message from mutation error
  const submitError = loginMutation.error
    ? (loginMutation.error as Error).message || 'Login failed. Please try again.'
    : null

  return {
    form,
    setUsername,
    setPassword,
    handleSubmit,
    isSubmitting: loginMutation.isPending,
    submitError,
  }
}
