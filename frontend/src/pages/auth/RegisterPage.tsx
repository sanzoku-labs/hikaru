import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useRegisterFlow } from '@/hooks/auth'
import { RegisterView } from '@/views/auth'

export default function RegisterPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const {
    form,
    setField,
    handleSubmit,
    isSubmitting,
    submitError,
  } = useRegisterFlow()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <RegisterView
      email={form.email}
      username={form.username}
      password={form.password}
      fullName={form.fullName}
      errors={form.errors}
      onFieldChange={setField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  )
}
