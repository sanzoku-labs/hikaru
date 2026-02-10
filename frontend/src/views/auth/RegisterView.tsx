import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Sparkles, Eye, EyeOff, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface RegisterViewProps {
  // Form data
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

  // Handlers
  onFieldChange: (field: 'email' | 'username' | 'password' | 'fullName', value: string) => void
  onSubmit: () => void

  // Status
  isSubmitting: boolean
  submitError: string | null
}

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(password) },
    { label: 'Lowercase', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ]

  const metCount = checks.filter((c) => c.met).length

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-200',
              i <= metCount
                ? metCount <= 2
                  ? 'bg-destructive'
                  : metCount === 3
                  ? 'bg-primary'
                  : 'bg-green-500'
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Requirements list */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check) => (
          <div
            key={check.label}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors duration-200',
              check.met ? 'text-green-500' : 'text-muted-foreground'
            )}
          >
            {check.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-current" />
            )}
            {check.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RegisterView({
  email,
  username,
  password,
  fullName,
  errors,
  onFieldChange,
  onSubmit,
  isSubmitting,
  submitError,
}: RegisterViewProps) {
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

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
              Start your journey with
              <span className="block text-primary">Hikaru</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Create your account and unlock the power of AI-driven data analytics.
            </p>

            {/* Testimonial or social proof */}
            <div className="mt-12 p-6 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-foreground/90 italic">
                "Hikaru transformed how we analyze our sales data. The AI insights are incredibly
                accurate and save us hours every week."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  SK
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sarah Kim</p>
                  <p className="text-xs text-muted-foreground">Data Analyst, TechCorp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
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
            <h2 className="text-2xl font-semibold text-foreground">Create account</h2>
            <p className="mt-2 text-muted-foreground">
              Fill in your details to get started
            </p>
          </div>

          {/* Error alert */}
          {submitError && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in-scale">
              {submitError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name field (optional) */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => onFieldChange('fullName', e.target.value)}
                className={cn(
                  'h-11',
                  errors.fullName && 'border-destructive focus-visible:ring-destructive'
                )}
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                autoComplete="name"
                autoFocus
              />
              {errors.fullName && (
                <p id="fullName-error" role="alert" className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => onFieldChange('email', e.target.value)}
                className={cn(
                  'h-11',
                  errors.email && 'border-destructive focus-visible:ring-destructive'
                )}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => onFieldChange('username', e.target.value)}
                className={cn(
                  'h-11',
                  errors.username && 'border-destructive focus-visible:ring-destructive'
                )}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'reg-username-error' : undefined}
                autoComplete="username"
              />
              {errors.username && (
                <p id="reg-username-error" role="alert" className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => onFieldChange('password', e.target.value)}
                  className={cn(
                    'h-11 pr-10',
                    errors.password && 'border-destructive focus-visible:ring-destructive'
                  )}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'reg-password-error' : undefined}
                  autoComplete="new-password"
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
              {errors.password ? (
                <p id="reg-password-error" role="alert" className="text-sm text-destructive">{errors.password}</p>
              ) : (
                password && <PasswordStrength password={password} />
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full mt-6"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
