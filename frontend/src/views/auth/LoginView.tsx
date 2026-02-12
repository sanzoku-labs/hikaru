import { cn } from '@/lib/utils'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { AuthHeroIllustration, TopographicLines } from '@/components/illustrations'

interface LoginViewProps {
  // Form data
  username: string
  password: string
  errors: { username?: string; password?: string }

  // Handlers
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void

  // Status
  isSubmitting: boolean
  submitError: string | null
}

export function LoginView({
  username,
  password,
  errors,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  isSubmitting,
  submitError,
}: LoginViewProps) {
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden">
        {/* Gradient background + pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <TopographicLines opacity={0.2} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="animate-in-up">
            {/* Logo */}
            <div
              className={cn(
                'inline-flex items-center justify-center',
                'w-16 h-16 rounded-2xl mb-8',
                'bg-gradient-to-br from-primary to-accent',
                'shadow-xl shadow-primary/20'
              )}
            >
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Welcome back to
              <span className="block text-primary">Hikaru</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Transform your data into beautiful, actionable insights with the power of AI.
            </p>

            {/* Feature highlights */}
            <div className="mt-12 space-y-4">
              {['Upload CSV or Excel files', 'Auto-generate charts', 'AI-powered insights'].map(
                (feature, i) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-muted-foreground"
                    style={{ animationDelay: `${(i + 1) * 100}ms` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{feature}</span>
                  </div>
                )
              )}
            </div>

            {/* Hero illustration */}
            <div className="mt-10 flex justify-center">
              <AuthHeroIllustration size={260} />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md animate-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div
              className={cn(
                'inline-flex items-center justify-center',
                'w-14 h-14 rounded-xl mb-4',
                'bg-gradient-to-br from-primary to-accent',
                'shadow-lg shadow-primary/20'
              )}
            >
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Hikaru</h1>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Sign in</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Error alert */}
          {submitError && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in-scale">
              {submitError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username/Email field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className={cn(
                  'h-11',
                  errors.username && 'border-destructive focus-visible:ring-destructive'
                )}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : undefined}
                autoComplete="username"
                autoFocus
              />
              {errors.username && (
                <p id="username-error" role="alert" className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className={cn(
                    'h-11 pr-10',
                    errors.password && 'border-destructive focus-visible:ring-destructive'
                  )}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-auto w-auto p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}
