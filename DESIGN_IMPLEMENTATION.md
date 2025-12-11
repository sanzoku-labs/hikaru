# Hikaru Design System - Tailwind + shadcn/ui Implementation Guide

**Purpose**: Practical implementation steps for applying the design system to Hikaru's React frontend using Tailwind CSS and shadcn/ui

**Tech Stack**:
- React 18 + TypeScript
- Tailwind CSS 3.x
- shadcn/ui components
- Vite build tool

---

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Tailwind Config Updates](#tailwind-config-updates)
3. [shadcn/ui Theme Customization](#shadcnui-theme-customization)
4. [Component Styling Patterns](#component-styling-patterns)
5. [Dark Mode Implementation](#dark-mode-implementation)
6. [Typography Implementation](#typography-implementation)
7. [Color Usage Examples](#color-usage-examples)
8. [Spacing Guidelines](#spacing-guidelines)
9. [Common Patterns](#common-patterns)
10. [Migration Checklist](#migration-checklist)

---

## Setup & Configuration

### 1. Install Required Packages

```bash
cd frontend

# Tailwind CSS (usually already installed)
npm install -D tailwindcss postcss autoprefixer

# shadcn/ui CLI (if not already installed)
npm install -D shadcn-ui

# Inter font via package
npm install next-font @fontsource/inter @fontsource/jetbrains-mono

# Or use Google Fonts (simpler)
# No installation needed, just @import in CSS
```

### 2. Verify Tailwind is Installed

Check for `/frontend/tailwind.config.js` or `/frontend/tailwind.config.ts`

If missing, initialize:
```bash
npx tailwindcss init -p
```

### 3. Check PostCSS Configuration

Verify `/frontend/postcss.config.js` exists:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## Tailwind Config Updates

### Step 1: Replace `tailwind.config.ts`

Create or update `/frontend/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@shadcn/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbef63',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Fira Code', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0em' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '0em' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '0em' }],
        lg: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        xl: ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        '2xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em' }],
        '3xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.01em' }],
        '4xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        high: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'very-high': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      maxWidth: {
        '8xl': '80rem',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
```

### Step 2: Update CSS Entry Point

In `/frontend/src/index.css` (or main.css):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Base element styles */
@layer base {
  html {
    @apply scroll-smooth;
  }

  body {
    @apply bg-neutral-0 text-neutral-900 dark:bg-neutral-0 dark:text-neutral-100;
  }

  h1 {
    @apply text-2xl font-semibold tracking-tight;
  }

  h2 {
    @apply text-xl font-semibold tracking-tight;
  }

  h3 {
    @apply text-lg font-semibold;
  }

  a {
    @apply text-primary-600 hover:text-primary-700 transition-colors;
  }

  code {
    @apply font-mono text-sm;
  }
}

/* Custom component styles */
@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded-base bg-primary-500 text-white font-medium hover:bg-primary-600 active:bg-primary-700 disabled:bg-neutral-300 disabled:text-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }

  .btn-secondary {
    @apply px-4 py-2 rounded-base border border-neutral-300 bg-neutral-100 text-neutral-900 font-medium hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-200 dark:text-neutral-100 dark:hover:bg-neutral-300 transition-colors;
  }

  .card {
    @apply rounded-base border border-neutral-200 bg-neutral-0 shadow-subtle dark:border-neutral-700 dark:bg-neutral-100;
  }

  .input-field {
    @apply rounded-base border border-neutral-200 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-100 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:ring-primary-900 transition-all;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0a0a0a;
    color: #ffffff;
  }
}

/* Accessibility: respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## shadcn/ui Theme Customization

### 1. Update shadcn/ui Theme Colors

shadcn/ui uses `@/lib/utils` for theme configuration. Check `/frontend/src/lib/utils.ts`:

If you're using shadcn/ui, you may have a `cn()` utility function. For theme colors, shadcn typically uses Tailwind directly.

### 2. Override shadcn Component Colors (Optional)

Create `/frontend/src/styles/shadcn-overrides.css` for component-level overrides:

```css
/* Override shadcn Button colors */
.shadcn-button-primary {
  @apply bg-primary-500 hover:bg-primary-600 text-white;
}

.shadcn-button-secondary {
  @apply bg-neutral-100 hover:bg-neutral-200 text-neutral-900;
}

.shadcn-button-destructive {
  @apply bg-error-500 hover:bg-error-600 text-white;
}

/* Override Input */
.shadcn-input {
  @apply input-field;
}

/* Override Card */
.shadcn-card {
  @apply card;
}

/* Override Badge */
.shadcn-badge {
  @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;
}

.shadcn-badge-primary {
  @apply bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200;
}

.shadcn-badge-success {
  @apply bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200;
}

.shadcn-badge-error {
  @apply bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-200;
}
```

Then import in your main CSS file:
```css
@import './styles/shadcn-overrides.css';
```

---

## Component Styling Patterns

### Button Component Examples

**Using Tailwind Classes**:

```typescript
// frontend/src/components/ButtonPrimary.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  isLoading?: boolean
}

export function ButtonPrimary({ children, isLoading, ...props }: ButtonProps) {
  return (
    <button
      className="px-4 py-2 rounded-base bg-primary-500 text-white font-medium
                 hover:bg-primary-600 active:bg-primary-700
                 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
                 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400
                 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
```

**Using shadcn/ui Button**:

```typescript
// frontend/src/components/Button.tsx (if using shadcn)
import { Button } from '@/components/ui/button'

export function MyButton() {
  return (
    <Button
      className="bg-primary-500 hover:bg-primary-600"
      size="lg"
    >
      Click me
    </Button>
  )
}
```

### Input Component Example

```typescript
// frontend/src/components/Input.tsx
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <input
        className={`
          rounded-base border bg-white px-3 py-2 text-neutral-900
          placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed
          transition-all
          dark:bg-neutral-100 dark:text-neutral-100 dark:placeholder:text-neutral-600
          dark:focus:ring-offset-neutral-0
          ${error
            ? 'border-error-300 focus:border-error-500 focus:ring-error-100 dark:border-error-700 dark:focus:ring-error-900'
            : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100 dark:border-neutral-700 dark:focus:ring-primary-900'
          }
          min-h-[44px]
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  )
}
```

### Card Component Example

```typescript
// frontend/src/components/Card.tsx
import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hoverable?: boolean
}

export function Card({ children, hoverable = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-base border border-neutral-200 bg-neutral-0 shadow-subtle
        dark:border-neutral-700 dark:bg-neutral-100
        ${hoverable ? 'hover:shadow-medium hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer transition-all' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
```

### Badge Component Example

```typescript
// frontend/src/components/Badge.tsx
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
}

const variantStyles = {
  default: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
  success: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200',
  error: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-200',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200',
  info: 'bg-info-100 text-info-700 dark:bg-info-900 dark:text-info-200',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
      ${variantStyles[variant]}
    `}>
      {children}
    </span>
  )
}
```

---

## Dark Mode Implementation

### 1. HTML Setup

Ensure your app's root HTML element supports dark mode:

```typescript
// frontend/src/App.tsx
import { useEffect, useState } from 'react'

export function App() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme-mode')
    if (saved) return saved === 'dark'

    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Update HTML class
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme-mode', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme-mode', 'light')
    }
  }, [isDark])

  const toggleDarkMode = () => setIsDark(!isDark)

  return (
    <div>
      <header>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="p-2 rounded-base hover:bg-neutral-100 dark:hover:bg-neutral-200"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </header>
      <main>
        {/* Your app content */}
      </main>
    </div>
  )
}
```

### 2. CSS for Dark Mode

Your Tailwind config already has `darkMode: 'class'`, which enables `dark:` prefix utilities.

Usage example:
```tsx
<div className="bg-white dark:bg-neutral-100 text-neutral-900 dark:text-neutral-100">
  Content adapts to light/dark mode
</div>
```

### 3. Testing Dark Mode

```bash
# In browser DevTools Console:
document.documentElement.classList.add('dark')      # Enable
document.documentElement.classList.remove('dark')   # Disable
```

---

## Typography Implementation

### 1. Font Loading

Already configured in `/frontend/src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
```

### 2. Typography Utility Classes

Add to `/frontend/src/index.css`:

```css
@layer components {
  .text-h1 {
    @apply text-2xl font-semibold leading-10 tracking-tight;
  }

  .text-h2 {
    @apply text-xl font-semibold leading-8 tracking-tight;
  }

  .text-h3 {
    @apply text-lg font-semibold leading-7 -tracking-tighter;
  }

  .text-body {
    @apply text-base font-normal leading-6;
  }

  .text-small {
    @apply text-sm font-normal leading-5;
  }

  .text-tiny {
    @apply text-xs font-normal leading-4;
  }

  .text-label {
    @apply text-xs font-medium uppercase tracking-wide;
  }

  .text-mono {
    @apply font-mono text-sm;
  }
}
```

Usage:
```tsx
<h1 className="text-h1">Page Title</h1>
<p className="text-body">Regular paragraph text</p>
<code className="text-mono">const x = 5</code>
```

### 3. Custom Typography Component

```typescript
// frontend/src/components/Typography.tsx
type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'tiny' | 'label' | 'mono'

const styles: Record<TypographyVariant, string> = {
  h1: 'text-2xl font-semibold leading-10 tracking-tighter',
  h2: 'text-xl font-semibold leading-8 tracking-tighter',
  h3: 'text-lg font-semibold leading-7',
  body: 'text-base font-normal leading-6',
  small: 'text-sm font-normal leading-5',
  tiny: 'text-xs font-normal leading-4',
  label: 'text-xs font-medium uppercase tracking-wide',
  mono: 'font-mono text-sm leading-6',
}

interface TypographyProps {
  variant: TypographyVariant
  children: React.ReactNode
  className?: string
}

export function Typography({ variant, children, className = '' }: TypographyProps) {
  const Element = variant.startsWith('h') ? (variant as 'h1' | 'h2' | 'h3') : 'p'

  return (
    <Element className={`${styles[variant]} ${className}`}>
      {children}
    </Element>
  )
}
```

---

## Color Usage Examples

### Example 1: Status Indicator

```tsx
interface StatusBadgeProps {
  status: 'active' | 'pending' | 'completed' | 'error'
}

const statusColors = {
  active: { bg: 'bg-success-100', text: 'text-success-700', dot: 'bg-success-500' },
  pending: { bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-500' },
  completed: { bg: 'bg-info-100', text: 'text-info-700', dot: 'bg-info-500' },
  error: { bg: 'bg-error-100', text: 'text-error-700', dot: 'bg-error-500' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = statusColors[status]

  return (
    <div className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-sm inline-flex items-center gap-2`}>
      <span className={`${colors.dot} w-2 h-2 rounded-full`} />
      {status}
    </div>
  )
}
```

### Example 2: Project Card with Accent

```tsx
interface ProjectCardProps {
  title: string
  accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'red'
}

const accentColors = {
  blue: 'bg-primary-500',
  purple: 'bg-purple-500',
  green: 'bg-success-500',
  orange: 'bg-warning-500',
  red: 'bg-error-500',
}

export function ProjectCard({ title, accentColor }: ProjectCardProps) {
  return (
    <div className="card p-4">
      <div className={`w-12 h-12 ${accentColors[accentColor]} rounded-md mb-3`} />
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
    </div>
  )
}
```

### Example 3: Data Visualization Colors

```tsx
// Chart colors following design system
const CHART_COLORS = [
  '#3B82F6', // Primary Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F97316', // Orange
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#FBBF24', // Amber
  '#EC4899', // Fuchsia
]

export function LineChart({ data }: { data: any[] }) {
  const chartOptions = {
    color: CHART_COLORS,
    // ... rest of ECharts config
  }

  return <EChart option={chartOptions} />
}
```

---

## Spacing Guidelines

### Spacing Scale Reference

```
0:    0px       gap-0, p-0
0.5:  2px       gap-0.5, p-0.5
1:    4px       gap-1, p-1           ← Small gaps
2:    8px       gap-2, p-2           ← Primary unit (most common)
3:    12px      gap-3, p-3
4:    16px      gap-4, p-4           ← Secondary unit
5:    20px      gap-5, p-5
6:    24px      gap-6, p-6           ← Card/section padding
8:    32px      gap-8, p-8           ← Large spacing
12:   48px      gap-12, p-12
16:   64px      gap-16, p-16
20:   80px      gap-20, p-20
```

### Common Spacing Patterns

```tsx
// Card spacing
<div className="rounded-base border bg-white shadow-subtle p-6">
  {/* 24px padding inside card */}
</div>

// Component gaps
<div className="flex gap-2">
  {/* 8px between inline elements */}
</div>

// Section spacing
<section className="space-y-8">
  {/* 32px between stacked sections */}
</section>

// Form field spacing
<form className="space-y-4">
  <Input label="Name" />
  <Input label="Email" />
  {/* 16px between form fields */}
</form>

// Grid spacing
<div className="grid grid-cols-3 gap-4">
  {/* 16px between grid items */}
</div>
```

---

## Common Patterns

### Pattern 1: Form with Validation

```tsx
interface FormState {
  name: string
  email: string
  errors: Record<string, string>
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    errors: {},
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation logic
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input
        label="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={form.errors.name}
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={form.errors.email}
      />
      <ButtonPrimary type="submit">
        Submit
      </ButtonPrimary>
    </form>
  )
}
```

### Pattern 2: Data Table

```tsx
export function DataTable() {
  return (
    <div className="overflow-x-auto rounded-base border border-neutral-200 dark:border-neutral-700">
      <table className="w-full">
        <thead className="bg-neutral-50 dark:bg-neutral-100">
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Status
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-100 dark:border-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-100 transition-colors">
            <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">
              John Doe
            </td>
            <td className="px-4 py-3">
              <Badge variant="success">Active</Badge>
            </td>
            <td className="px-4 py-3 text-right text-sm font-mono text-neutral-900 dark:text-neutral-100">
              $1,234.56
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

### Pattern 3: Modal Dialog

```tsx
import { useState } from 'react'

export function ConfirmDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ButtonPrimary onClick={() => setOpen(true)}>
        Delete Project
      </ButtonPrimary>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-100 rounded-md shadow-high max-w-sm w-full p-6 space-y-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Delete Project?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-base border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <ButtonPrimary
                onClick={() => {
                  // Handle delete
                  setOpen(false)
                }}
                className="bg-error-500 hover:bg-error-600"
              >
                Delete
              </ButtonPrimary>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

---

## Migration Checklist

Use this checklist to migrate existing components to the design system:

- [ ] **Colors**
  - [ ] Replace all custom hex colors with design system palette
  - [ ] Update all text colors (primary-600, primary-500 for secondary text)
  - [ ] Update all background colors (neutral-0, neutral-50, neutral-100)
  - [ ] Update all border colors (neutral-200 light, neutral-700 dark)
  - [ ] Update all button colors (primary-500 for primary action)
  - [ ] Verify dark mode colors are defined

- [ ] **Typography**
  - [ ] Update heading sizes (h1: text-2xl, h2: text-xl, etc.)
  - [ ] Update font weights (use 400, 500, 600 only)
  - [ ] Apply tracking-tighter to headings
  - [ ] Use Inter font throughout
  - [ ] Use monospace (font-mono) for technical content

- [ ] **Spacing**
  - [ ] Update padding (use 4px scale: p-2, p-4, p-6, p-8)
  - [ ] Update gaps (gap-2, gap-4, gap-6, gap-8)
  - [ ] Update margins (space-y-4, space-y-8, etc.)
  - [ ] Ensure consistent spacing between sections

- [ ] **Components**
  - [ ] Update buttons (rounded-base, min-h-[44px])
  - [ ] Update inputs (rounded-base, focus ring colors)
  - [ ] Update cards (rounded-base, border, shadow-subtle)
  - [ ] Update badges (rounded-full, padding-based sizing)
  - [ ] Update modals (rounded-md, shadow-high)

- [ ] **Borders & Shadows**
  - [ ] Update border colors (neutral-200/700)
  - [ ] Update border radius (8px default, 4px sharp, 12px rounded)
  - [ ] Update shadows (shadow-subtle, shadow-medium)
  - [ ] Remove custom shadow definitions

- [ ] **Dark Mode**
  - [ ] Test all colors in dark mode
  - [ ] Verify contrast ratios (WCAG AA minimum)
  - [ ] Update dark: prefix utilities
  - [ ] Test light/dark toggle functionality

- [ ] **Accessibility**
  - [ ] Verify focus states (ring-2 ring-primary-500)
  - [ ] Check touch targets (min 44px)
  - [ ] Verify contrast ratios
  - [ ] Test keyboard navigation
  - [ ] Verify color-blind safe combinations

- [ ] **Performance**
  - [ ] Font loading: using display=swap
  - [ ] Remove unused CSS
  - [ ] Optimize images
  - [ ] Lazy-load components

---

## Next Steps

1. **Apply Tailwind Config**: Update `tailwind.config.ts` with values from this guide
2. **Update CSS**: Add base and component layers from `index.css` example
3. **Create Component Library**: Build reusable components following patterns in this guide
4. **Migrate Pages**: Update existing pages one-by-one using migration checklist
5. **Dark Mode Testing**: Test all pages in light and dark modes
6. **Accessibility Audit**: Use WebAIM contrast checker and keyboard navigation
7. **Responsive Testing**: Verify mobile (< 640px), tablet (640-1024px), desktop (1024px+)

---

**Ready to implement? Start with the Tailwind config, then work through component creation!**
