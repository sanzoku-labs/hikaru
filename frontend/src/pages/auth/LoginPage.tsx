import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLoginFlow } from '@/hooks/auth'
import { LoginView } from '@/views/auth'

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const {
    form,
    setUsername,
    setPassword,
    handleSubmit,
    isSubmitting,
    submitError,
  } = useLoginFlow()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <LoginView
      username={form.username}
      password={form.password}
      errors={form.errors}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  )
}
