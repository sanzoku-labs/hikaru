# Hikaru Design System - Quick Reference Card

**Print this page or keep it open while coding!**

---

## Primary Colors (Hex Codes)

```
Primary:   #3B82F6  (main blue)
Success:   #22C55E  (green)
Warning:   #F59E0B  (amber)
Error:     #EF4444  (red)
Info:      #0EA5E9  (cyan)

White:     #FFFFFF
Black:     #0A0A0A

Text Dark: #1F2937 (light mode)
Text Dark: #FFFFFF (dark mode)
```

---

## Common Tailwind Classes

### Buttons

```tsx
// Primary
className="px-4 py-2 rounded-base bg-primary-500 text-white hover:bg-primary-600"

// Secondary
className="px-4 py-2 rounded-base border border-neutral-300 bg-neutral-100 hover:bg-neutral-200"

// Danger
className="px-4 py-2 rounded-base bg-error-500 text-white hover:bg-error-600"
```

### Inputs

```tsx
className="rounded-base border border-neutral-200 px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-100"
```

### Cards

```tsx
className="rounded-base border border-neutral-200 bg-white p-6 shadow-subtle dark:border-neutral-700 dark:bg-neutral-100"
```

### Dark Mode

```tsx
// Add "dark:" prefix
className="bg-white dark:bg-neutral-100 text-neutral-900 dark:text-neutral-100"
```

---

## Spacing Scale (4px Base)

| Class | Value | Usage |
|-------|-------|-------|
| `p-2` | 8px | Tight padding |
| `p-4` | 16px | Standard padding |
| `p-6` | 24px | Card padding |
| `p-8` | 32px | Large sections |
| `gap-2` | 8px | Element gap |
| `gap-4` | 16px | Component gap |
| `space-y-4` | 16px | Vertical spacing |
| `space-y-8` | 32px | Section spacing |

---

## Border Radius Scale

| Value | Class | Usage |
|-------|-------|-------|
| 0px | `rounded-none` | Flat edges |
| 4px | `rounded-sm` | Very subtle |
| 8px | `rounded-base` | DEFAULT (buttons, inputs, cards) |
| 12px | `rounded-md` | Modals, popovers |
| 16px | `rounded-lg` | Larger rounding |
| 9999px | `rounded-full` | Badges, avatars |

---

## Type Sizes

| Size | Class | Usage |
|------|-------|-------|
| 12px | `text-xs` | Labels, badges |
| 14px | `text-sm` | Secondary text |
| 16px | `text-base` | Body text (default) |
| 20px | `text-lg` | Subheadings |
| 24px | `text-xl` | Page headings |
| 32px | `text-2xl` | Page titles |

**Font Weights**: `font-normal` (400) | `font-medium` (500) | `font-semibold` (600)

---

## Shadows

```tsx
shadow-subtle:    // Hover states
shadow-medium:    // Cards, dropdowns
shadow-high:      // Modals, popovers
shadow-very-high: // Major modals
```

---

## Form Components

### Input Field
```tsx
<input
  className="rounded-base border border-neutral-200 px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-100"
/>
```

### Label
```tsx
<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
  Label Text
</label>
```

### Helper Text
```tsx
<p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
  Helper text
</p>
```

### Error Text
```tsx
<p className="text-xs text-error-600 dark:text-error-400 mt-1">
  Error message
</p>
```

---

## Color Utilities

### Text Colors
```tsx
text-neutral-900        // Primary text (light mode)
text-neutral-700        // Secondary text
text-neutral-600        // Tertiary text
text-error-600          // Error color
text-primary-600        // Link color

dark:text-neutral-100   // Primary text (dark mode)
dark:text-neutral-400   // Secondary text
```

### Background Colors
```tsx
bg-white                // Main background (light)
bg-neutral-50           // Subtle background
bg-primary-100          // Highlight background

dark:bg-neutral-0       // Main background (dark)
dark:bg-neutral-100     // Card background
```

### Border Colors
```tsx
border-neutral-200      // Default border (light)
border-primary-500      // Focus border

dark:border-neutral-700 // Default border (dark)
dark:border-neutral-600 // Subtle border
```

---

## Component Sizing

### Button Heights
```
Small:  h-8   (32px)
Medium: h-10  (40px) - minimum touch target
Large:  h-12  (48px)
```

**Ensure minimum 44px touch targets!**

### Input Heights
```
Standard: h-[44px] (must be at least 44px)
```

---

## Focus States

### All Interactive Elements

```tsx
focus:outline-none
focus:ring-2
focus:ring-primary-500
focus:ring-offset-2
dark:focus:ring-offset-neutral-0
```

---

## Status Indicators

### Badges
```tsx
// Success
className="bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200"

// Error
className="bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-200"

// Warning
className="bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200"

// Info
className="bg-info-100 text-info-700 dark:bg-info-900 dark:text-info-200"
```

---

## Common Patterns

### Centered Form
```tsx
<form className="max-w-md mx-auto space-y-4">
  {/* inputs */}
</form>
```

### Data Table
```tsx
<div className="overflow-x-auto rounded-base border border-neutral-200 dark:border-neutral-700">
  <table className="w-full">
    {/* rows */}
  </table>
</div>
```

### Modal Overlay
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
  <div className="bg-white dark:bg-neutral-100 rounded-md shadow-high max-w-sm w-full p-6">
    {/* content */}
  </div>
</div>
```

### Alert/Toast
```tsx
<div className="rounded-base border border-error-200 bg-error-50 p-4 dark:border-error-700 dark:bg-error-900">
  <p className="text-error-900 dark:text-error-100">Alert message</p>
</div>
```

---

## Accessibility Essentials

### Minimum Touch Target
```tsx
min-h-[44px] min-w-[44px]  // Always include this
```

### Focus Indicator
```tsx
focus:outline-none focus:ring-2 focus:ring-primary-500
```

### Color + Label
```tsx
// NEVER use color alone!
<span className="text-error-600">Required</span>  // Good
<span style={{color: '#EF4444'}} />             // Bad - no context
```

### Contrast Testing
- Use WebAIM contrast checker: https://webaim.org/resources/contrastchecker/
- Enter foreground and background hex codes
- Verify WCAG AA (4.5:1) minimum

---

## Dark Mode Template

```tsx
<div className="
  bg-white dark:bg-neutral-100
  text-neutral-900 dark:text-neutral-100
  border border-neutral-200 dark:border-neutral-700
  shadow-subtle dark:shadow-medium
  rounded-base
  p-4
">
  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
    Heading
  </h3>
  <p className="text-neutral-600 dark:text-neutral-400 mt-2">
    Description text
  </p>
  <button className="
    mt-4
    px-4 py-2
    rounded-base
    bg-primary-500 hover:bg-primary-600
    text-white
    transition-colors
  ">
    Action
  </button>
</div>
```

---

## Responsive Classes

### Mobile-First
```tsx
// Tailwind is mobile-first!
className="text-base md:text-lg lg:text-xl"
// Default: base size
// Tablet+: lg size
// Desktop+: xl size
```

### Breakpoints
```
sm: 640px   (tablet)
md: 768px   (tablet+)
lg: 1024px  (desktop)
xl: 1280px  (large desktop)
2xl: 1536px (very large)
```

---

## Hover/Active States

```tsx
// Button hover
hover:bg-primary-600 active:bg-primary-700

// Card hover
hover:shadow-medium hover:border-primary-300

// Text link hover
hover:text-primary-700 hover:underline

// Input focus
focus:ring-2 focus:ring-primary-500
```

---

## Common Mistakes to Avoid

1. **Forget 44px minimum**: Always `min-h-[44px]` on buttons/inputs
2. **No focus state**: All interactive elements need `focus:ring-2 focus:ring-primary-500`
3. **Color only**: Never use color as sole indicator (always label too)
4. **Forgot dark mode**: Add `dark:` classes to ALL color utilities
5. **Wrong spacing**: Use 4px scale only (`p-2`, `p-4`, `p-6`, not `p-3`, `p-5`)
6. **Inconsistent radius**: Use `rounded-base` (8px) for buttons, inputs, cards
7. **Shadows on hover**: Modals use `shadow-high`, cards use `shadow-subtle`
8. **Text in colored bg**: Check contrast ratios! Use WCAG checker

---

## Helpful Commands

### Check Tailwind Builds
```bash
npm run build  # See if CSS is included
```

### Check Dark Mode
```bash
# In DevTools Console:
document.documentElement.classList.add('dark')      // Enable
document.documentElement.classList.remove('dark')   // Disable
```

### Check Contrast
https://webaim.org/resources/contrastchecker/
- Enter hex codes
- Verify WCAG AA (4.5:1)

### Check Color Blindness
https://www.color-blindness.com/coblis-color-blindness-simulator/
- Upload screenshot
- View through color-blind lens

---

## File References

**Need more detail?**
- `/hikaru/DESIGN_SYSTEM.md` - Complete specification
- `/hikaru/DESIGN_IMPLEMENTATION.md` - Code examples
- `/hikaru/DESIGN_COLORS.md` - Color testing

**Print this page and keep by your desk!**

---

**Last Updated**: November 27, 2025
**Version**: 1.0.0
**Status**: Ready to Use
