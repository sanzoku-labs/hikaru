# Hikaru Design System 2025

**Version**: 1.0.0
**Last Updated**: November 27, 2025
**Status**: Production Ready
**Target**: Professional AI-powered BI/Analytics Dashboard

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Visual Style](#visual-style)
6. [Data Visualization](#data-visualization)
7. [Components & Patterns](#components--patterns)
8. [Accessibility](#accessibility)
9. [Implementation Guide](#implementation-guide)
10. [Design Direction Options](#design-direction-options)

---

## Design Principles

### 1. Trust & Intelligence
- Professional and credible visual language
- Data-forward design that prioritizes clarity over decoration
- Blue as primary color (industry standard for analytics/fintech)

### 2. Clarity Over Decoration
- Clean, minimal interface with strong visual hierarchy
- Generous whitespace reduces cognitive load
- Remove visual clutter; every element serves purpose

### 3. Efficiency
- Optimize for quick scanning and decision-making
- Consistent patterns enable prediction
- Reduce time-to-insight

### 4. Accessibility First
- WCAG AA compliance minimum (AAA where feasible)
- Color-blind safe palettes
- High contrast for legibility
- Keyboard navigation throughout

### 5. Modern & Timeless
- Current 2025 trends without over-design
- Functional beauty (not trendy for trend's sake)
- 3-5 year design longevity target

---

## Color System

### Light Mode Palette

**Primary Brand Colors**:
```
Primary (Interactive, CTAs, Focus states):
  Primary-50:   #EFF6FF  (lightest backgrounds)
  Primary-100:  #DBEAFE
  Primary-200:  #BFDBFE
  Primary-300:  #93C5FD
  Primary-400:  #60A5FA
  Primary-500:  #3B82F6  ← Main brand blue
  Primary-600:  #2563EB
  Primary-700:  #1D4ED8
  Primary-800:  #1E40AF
  Primary-900:  #1E3A8A  (darkest)
```

**Secondary Colors** (Success, caution, error):
```
Success (positive actions, completions):
  Success-50:   #F0FDF4
  Success-100:  #DCFCE7
  Success-200:  #BBEF63
  Success-300:  #86EFAC
  Success-400:  #4ADE80
  Success-500:  #22C55E  ← Main success
  Success-600:  #16A34A
  Success-700:  #15803D
  Success-800:  #166534
  Success-900:  #145231

Warning (caution, secondary actions):
  Warning-50:   #FFFBEB
  Warning-100:  #FEF3C7
  Warning-200:  #FDE68A
  Warning-300:  #FCD34D
  Warning-400:  #FBBF24
  Warning-500:  #F59E0B  ← Main warning
  Warning-600:  #D97706
  Warning-700:  #B45309
  Warning-800:  #92400E
  Warning-900:  #78350F

Error (destructive, alerts):
  Error-50:     #FEF2F2
  Error-100:    #FEE2E2
  Error-200:    #FECACA
  Error-300:    #FCA5A5
  Error-400:    #F87171
  Error-500:    #EF4444  ← Main error
  Error-600:    #DC2626
  Error-700:    #B91C1C
  Error-800:    #991B1B
  Error-900:    #7F1D1D

Info (educational, notifications):
  Info-50:      #F0F9FF
  Info-100:     #E0F2FE
  Info-200:     #BAE6FD
  Info-300:     #7DD3FC
  Info-400:     #38BDF8
  Info-500:     #0EA5E9  ← Main info
  Info-600:     #0284C7
  Info-700:     #0369A1
  Info-800:     #075985
  Info-900:     #0C4A6E
```

**Neutral Colors** (Text, borders, backgrounds):
```
Neutral (grayscale):
  Neutral-0:    #FFFFFF  (pure white)
  Neutral-50:   #FAFAFA  (lightest gray bg)
  Neutral-100:  #F3F4F6  (very light gray)
  Neutral-200:  #E5E7EB  (light gray, borders)
  Neutral-300:  #D1D5DB  (medium-light gray)
  Neutral-400:  #9CA3AF  (medium gray)
  Neutral-500:  #6B7280  ← Secondary text
  Neutral-600:  #4B5563  (tertiary text)
  Neutral-700:  #374151  (secondary text)
  Neutral-800:  #1F2937  ← Primary text
  Neutral-900:  #111827  (darkest text)
```

### Dark Mode Palette

**Dark Mode Neutrals** (inverted from light mode):
```
Neutral-0:    #0A0A0A  (pure black/base)
Neutral-50:   #1A1A1A  (very dark gray)
Neutral-100:  #262626  (dark gray bg)
Neutral-200:  #404040  (medium-dark gray)
Neutral-300:  #525252  (medium gray)
Neutral-400:  #737373  (medium-light gray)
Neutral-500:  #A3A3A3  ← Secondary text (dark mode)
Neutral-600:  #D4D4D4  (tertiary text)
Neutral-700:  #E5E5E5  (secondary text)
Neutral-800:  #F5F5F5  ← Primary text (dark mode)
Neutral-900:  #FFFFFF  (pure white text)
```

**Dark Mode Primary** (adjusted for OLED/dark backgrounds):
```
Primary-400:  #60A5FA  (buttons/CTAs in dark mode)
Primary-500:  #3B82F6  (hover state)
Primary-600:  #2563EB
```

### Color Usage Guidelines

| Element | Light Mode | Dark Mode | Notes |
|---------|-----------|-----------|-------|
| **Primary CTA Buttons** | Primary-500 | Primary-400 | Hover: Primary-600 |
| **Secondary Buttons** | Neutral-100 border + Neutral-800 text | Neutral-200 border + Neutral-100 text | Ghost style |
| **Text Primary** | Neutral-900 | Neutral-900 | On light/dark bg |
| **Text Secondary** | Neutral-600 | Neutral-500 | Less emphasis |
| **Text Tertiary** | Neutral-500 | Neutral-400 | Lowest emphasis |
| **Backgrounds** | Neutral-0 (white) | Neutral-0 (black) | Main surface |
| **Backgrounds Secondary** | Neutral-50 | Neutral-100 | Cards, sections |
| **Borders** | Neutral-200 | Neutral-200 | Dividers, edges |
| **Success State** | Success-500 | Success-400 | Confirmations |
| **Error State** | Error-500 | Error-400 | Destructive actions |
| **Warning State** | Warning-500 | Warning-400 | Cautions |

### Project Card Accent Colors

For project cards and visual differentiation:

```
Accent Palette (8 colors, all WCAG AA compliant):
1. Blue:      #3B82F6  (primary - used in mockups)
2. Purple:    #A855F7  (secondary projects)
3. Green:     #10B981  (success, completion)
4. Emerald:   #059669  (active status)
5. Orange:    #F97316  (highlight, secondary CTA)
6. Red:       #DC2626  (alert, archived)
7. Cyan:      #0891B2  (cool accent)
8. Fuchsia:   #D946EF  (tertiary accent)

These form the rotating project icon backgrounds.
```

---

## Typography

### Font Stack

**Heading Font** (UI headings, nav):
- **Font**: Inter (system font fallback)
- **Weights**: 500 (medium), 600 (semibold), 700 (bold)
- **Features**: Variable font, excellent legibility, neutral personality
- **Source**: System default or Google Fonts (Inter)
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

**Body Font** (copy, descriptions):
- **Font**: Inter (same as headings for cohesion)
- **Weights**: 400 (regular), 500 (medium)
- **Features**: Optimized for on-screen reading at 14-16px sizes
- **Line Height**: 1.5-1.6 for body text
- **Letter Spacing**: 0 (auto-kerning)

**Monospace Font** (data tables, code, technical):
- **Font**: JetBrains Mono or Fira Code
- **Weights**: 400 (regular), 500 (medium)
- **Usage**: Data cells, SQL, API responses, timestamps
- **Fallback**: Menlo, Monaco, Courier New, monospace
- **Size**: Often -1 or -2 size steps from body (smaller for density)

**Pros of this stack**:
- Single font family (Inter) reduces complexity
- Excellent web performance (variable font = single file)
- Professional, modern appearance
- Pair monospace only for technical content (not everywhere)

### Type Scale

Modular scale using 1.25 ratio (4/3 perfect fourth):

```
Text Size Scale:

xs:   12px / 0.75rem    (labels, badges, footnotes)
sm:   14px / 0.875rem   (secondary text, helper text)
base: 16px / 1rem       (body text, default)
lg:   20px / 1.25rem    (call-to-action text)
xl:   24px / 1.5rem     (page subheadings)
2xl:  32px / 2rem       (page headings)
3xl:  40px / 2.5rem     (major headings, hero)
4xl:  48px / 3rem       (large hero titles)

Line Heights:
xs:   16px (1.3)
sm:   20px (1.4)
base: 24px (1.5)
lg:   28px (1.4)
xl:   32px (1.33)
2xl:  40px (1.25)
3xl:  48px (1.2)
4xl:  56px (1.17)

Letter Spacing:
Headings:     -0.01em (tight, professional)
Body:         0em     (default, readable)
Labels:       0.05em  (slight tracking for emphasis)
```

### Typography Usage

| Element | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---------|------|------|--------|-------------|-----------------|-------|
| **H1 Page Title** | Inter | 2xl (32px) | 600 | 1.25 | -0.01em | Main page heading |
| **H2 Section Head** | Inter | xl (24px) | 600 | 1.33 | -0.01em | Section dividers |
| **H3 Subsection** | Inter | lg (20px) | 600 | 1.4 | -0.01em | Card titles |
| **Body Text** | Inter | base (16px) | 400 | 1.5 | 0 | Main copy |
| **Small Text** | Inter | sm (14px) | 400 | 1.4 | 0 | Secondary info |
| **Helper Text** | Inter | xs (12px) | 400 | 1.3 | 0 | Captions, hints |
| **Button Text** | Inter | sm (14px) | 500 | 1.4 | 0.05em | CTA labels |
| **Label** | Inter | xs (12px) | 500 | 1.3 | 0.05em | Form labels |
| **Data/Monospace** | JB Mono | sm (14px) | 400 | 1.5 | 0 | Table cells |
| **Code Block** | JB Mono | xs (12px) | 400 | 1.6 | 0 | Code snippets |

### Font Loading & Performance

```css
/* Recommended web font loading */
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

/* Variable font import (recommended - single file) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

/* For monospace, use system default or Fira Code */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap');

/* Loading strategy: display=swap for better web vitals */
```

---

## Spacing & Layout

### Spacing Scale

**Base Unit**: 4px (allows for consistent, flexible spacing)

```
Spacing Values:
0:    0px
px:   1px     (borders, dividers)
0.5:  2px
1:    4px     (tight spacing)
1.5:  6px
2:    8px     ← Primary unit (most common)
2.5:  10px
3:    12px
3.5:  14px
4:    16px    ← Secondary unit
5:    20px
6:    24px
7:    28px
8:    32px    ← Large spacing
9:    36px
10:   40px
12:   48px    ← Very large spacing
14:   56px
16:   64px
20:   80px    ← Page-level spacing
24:   96px
```

### Component Spacing

**Button Padding**:
```
Small:   px-3 py-1.5  (12px horizontal, 6px vertical)
Medium:  px-4 py-2    (16px horizontal, 8px vertical) ← Default
Large:   px-6 py-3    (24px horizontal, 12px vertical)
XL:      px-8 py-4    (32px horizontal, 16px vertical)
```

**Card Padding**:
```
Default: p-6  (24px all sides)
Compact: p-4  (16px all sides)
Relaxed: p-8  (32px all sides)
```

**Section Spacing**:
```
Vertical gap between sections:     space-y-8  (32px)
Horizontal gap between elements:   gap-4      (16px) for cards
                                   gap-2      (8px) for inline
Margin top (new section):          mt-12      (48px)
Margin bottom (spacing):           mb-6       (24px)
```

**Input Fields**:
```
Padding:       px-3 py-2 (12px h, 8px v)
Height:        44px (minimum touch target - mobile friendly)
Border radius: 8px
Border width:  1px
Gap (in form): space-y-4 (16px between inputs)
```

### Layout Structure

**Maximum Content Width**:
```
1280px (80rem) ← Max width for readable line length
Applies to: main content areas, dashboards, tables
Sidebar should NOT respect max-width (use full height)
```

**Grid System** (Dashboard):
```
Dashboard Grid:
Base unit: 1fr (CSS Grid column)
Columns:
  - Mobile (< 640px):    1 column
  - Tablet (640-1024px): 2 columns
  - Desktop (1024px+):   3-4 columns

Example: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
Gap between items: gap-4 (16px)
```

**Navigation & Sidebar**:
```
Sidebar width: 240px (fixed)
Collapsible to: 64px (icons only)
Transition: 300ms ease

Top Nav (if applicable):
Height: 64px (includes 16px padding)
Sticky on scroll

Main content offset:
ML: 240px (sidebar width)
MT: 0 (no top nav in current design)
```

---

## Visual Style

### Border Radius Scale

```
Radius Values:
none:     0px      (sharp edges - cards, modals with hard design)
sm:       4px      (very subtle rounding)
base:     8px      ← Primary (buttons, inputs, cards, modals)
md:       12px     (moderate rounding)
lg:       16px     (rounded appearance)
full:     9999px   (pills, badges, circular avatars)

Usage Guide:
  - Buttons/Inputs:        8px (base)
  - Cards/Panels:          8px (base)
  - Modals:                12px (md)
  - Badges/Labels:         16px (lg) or full (pills)
  - Avatars:               full (circular)
  - Dropdowns:             8px (base)
  - Tables:                8px corners (base)
  - Project card icons:    12px (slightly more rounded for distinction)
```

### Shadows & Elevation

**Shadow System** (4 levels):

```
None (flat):
  box-shadow: none

Subtle (elevated 1):
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
  Usage: Hover states, slight depth

Medium (elevated 2):
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06)
  Usage: Cards, dropdowns, floating elements

High (elevated 3):
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05)
  Usage: Modals, popovers, tooltips

Very High (elevated 4):
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04)
  Usage: Toasts, major modals, alerts

Dark Mode Adjustment:
  Increase opacity by 1.5-2x for dark mode
  Example: rgba(0, 0, 0, 0.08) → rgba(0, 0, 0, 0.12)
```

**Shadow Usage**:
| Element | Shadow | Notes |
|---------|--------|-------|
| Cards | Subtle | Default card appearance |
| Cards (hover) | Medium | Interactive feedback |
| Buttons | None | Flat appearance |
| Buttons (active) | Subtle | Depth on press |
| Modals | High | Clear layering |
| Dropdowns | Medium | Floating effect |
| Tooltips | High | Clear separation |
| Chart overlays | Medium | Hierarchy in data |

### Borders

**Border Thickness**:
```
1px ← Default (Tailwind: border)
2px ← Emphasis (Tailwind: border-2)
0px ← None (for flat design)
```

**Border Color**:
```
Light Mode:   Neutral-200 (#E5E7EB)  ← Default
Light Mode:   Neutral-300 (#D1D5DB)  ← Hover
Dark Mode:    Neutral-700 (#374151)  ← Default
Dark Mode:    Neutral-600 (#4B5563)  ← Hover
Accent:       Primary-300 (#93C5FD)  ← Focus/active states
```

**Border Usage**:
- Input fields: 1px, Neutral-200 (light) / Neutral-700 (dark)
- Form inputs (focus): 2px, Primary-500
- Dividers: 1px, Neutral-200 (light) / Neutral-700 (dark)
- Cards: 1px, Neutral-200 (light) / Neutral-700 (dark), optional
- Tables: 1px, Neutral-200 (light) / Neutral-700 (dark)

### Overall Aesthetic Direction

**Modern Minimal with Professional Credibility**:
- Clean, spacious layouts (not cramped)
- Subtle depth through shadows (not neumorphism)
- Flat design with clear interactive states
- Muted colors for trustworthiness (blue + neutrals)
- Accent colors for guidance and hierarchy
- Light/dark mode equally polished

**NOT**:
- Glassmorphism (trendy, poor contrast)
- Heavy gradients (distraction from data)
- Excessive animation (professional appearance)
- Highly skeuomorphic (dated look)

**CHARACTERISTICS**:
- Generous whitespace
- Clear visual hierarchy
- Accessibility-first
- Data-forward (minimal decoration)
- Professional but approachable

---

## Data Visualization

### Chart Color Palette

**Primary Data Colors** (8-color palette for maximum contrast):

```
Color Palette (WCAG AAA compliant in most combinations):
1. Blue:      #3B82F6  (primary, lines)
2. Purple:    #8B5CF6  (secondary, areas)
3. Green:     #10B981  (tertiary, success indicators)
4. Orange:    #F97316  (warm accent, highlights)
5. Red:       #EF4444  (alerts, errors in data)
6. Cyan:      #06B6D4  (cool accent, trends)
7. Amber:     #FBBF24  (warm secondary)
8. Fuchsia:   #EC4899  (distinct, high visibility)

Extended Palette (12 colors, for complex datasets):
9.  Slate:    #64748B
10. Rose:     #F43F5E
11. Teal:     #14B8A6
12. Indigo:   #6366F1
```

**Semantic Data Colors**:
```
Positive/Growth:    #10B981 (Green)
Negative/Decline:   #EF4444 (Red)
Neutral/Stable:     #6B7280 (Gray)
Trend/Forecast:     #3B82F6 (Blue)
Highlight/Target:   #F97316 (Orange)
```

**Chart Styling**:
```
Grid lines:        Neutral-200 (light) / Neutral-700 (dark)
Grid opacity:      0.3 (subtle background)
Axis labels:       Neutral-600 (light) / Neutral-500 (dark)
Axis line:         Neutral-300 (light) / Neutral-600 (dark)
Legend text:       Neutral-800 (light) / Neutral-200 (dark)
Legend background: Transparent (or Neutral-50/100 with light border)
Tooltip background:Primary-900 (dark) / Neutral-900 (very dark)
Tooltip text:      White (on dark background)
```

**Line Charts**:
- Line width: 2-2.5px
- Dot size: 4-6px (hover: 8px)
- Opacity: Full (1.0)
- Smoothing: Monotone (smooth curves)

**Bar Charts**:
- Bar width: Auto (calculate for available space)
- Border radius: 4px top (for modern look)
- Opacity: Full (1.0)
- Spacing: 20-30% gap between groups

**Pie Charts**:
- Donut variant preferred (cleaner, allows center text)
- Border: 2px white (light) / 2px dark gray (dark mode)
- Tooltip: Hover effect, show percentage + value

**Area Charts**:
- Fill opacity: 0.1-0.2 (very subtle fill)
- Line: 2-2.5px (solid color)
- Gradient: Optional (bottom fade to transparent)

---

## Components & Patterns

### Button Styles

**Primary Button**:
```
Background:   Primary-500 → Primary-600 (hover)
Text:         White
Padding:      px-4 py-2
Border:       None
Border-radius: 8px
Shadow:       None (hover: subtle)
Icon:         12px left margin
State:
  Rest:   Primary-500
  Hover:  Primary-600 + shadow-subtle
  Active: Primary-700
  Disabled: Neutral-300 with Neutral-500 text
```

**Secondary Button**:
```
Background:   Neutral-100 (light) / Neutral-200 (dark)
Text:         Neutral-800 (light) / Neutral-100 (dark)
Border:       1px Neutral-300 (light) / Neutral-600 (dark)
Padding:      px-4 py-2
Border-radius: 8px
Shadow:       None
State:
  Rest:   Neutral-100 bg
  Hover:  Neutral-200 bg + shadow-subtle
  Active: Neutral-300 bg
  Disabled: Neutral-50 bg with Neutral-400 text
```

**Ghost/Link Button**:
```
Background:   Transparent
Text:         Primary-600 (light) / Primary-400 (dark)
Border:       None
Padding:      px-3 py-1 (less padding than solid)
State:
  Rest:   Transparent, Primary-600 text
  Hover:  Neutral-100 (light) / Neutral-200 (dark) bg
  Active: Primary-700 text
```

**Danger Button**:
```
Background:   Error-500 → Error-600 (hover)
Text:         White
Border:       None
Padding:      px-4 py-2
Confirmation: Require additional confirmation for destructive
```

### Input Fields

**Text Input**:
```
Background:   White (light) / Neutral-100 (dark)
Border:       1px Neutral-200 (light) / Neutral-700 (dark)
Text:         Neutral-900 (light) / Neutral-100 (dark)
Placeholder:  Neutral-400
Padding:      px-3 py-2 (12px h, 8px v)
Height:       44px (minimum touch target)
Border-radius: 8px
Focus:
  Border:     2px Primary-500
  Box-shadow: 0 0 0 3px Primary-100 (light) / Primary-900 (dark)
  Outline:    None
```

**Select Dropdown**:
```
Same as text input
Icon:         Chevron down on right (12px)
Placeholder:  "Select option..."
Padding-right: 36px (for icon)
```

**Checkbox & Radio**:
```
Size:         16px × 16px (minimum touch target)
Border:       1px Neutral-300
Checked:      Background Primary-500, white checkmark
Focus:        Box-shadow: 0 0 0 2px Primary-100 (light)
Spacing:      gap-2 (8px) between control and label
```

**Form Groups**:
```
Label:        font-medium, sm (14px)
Spacing:      space-y-1 (4px) between label and input
Helper text:  xs (12px), Neutral-600 (light)
Error text:   xs (12px), Error-600 (light)
Error input:  Border color → Error-300 (light)
```

### Card Styles

**Default Card**:
```
Background:   Neutral-0 (light) / Neutral-100 (dark)
Border:       1px Neutral-200 (light) / Neutral-700 (dark)
Padding:      p-6 (24px)
Border-radius: 8px
Shadow:       subtle
Hover:        shadow-medium (optional, for interactive cards)
```

**Card with Header**:
```
Header:       Border-bottom 1px
Header padding: pb-4 (16px)
Header text:  font-semibold, lg (20px)
Body padding: pt-4
```

### Badge & Label

```
Small Badge:
  Padding:      px-2 py-1 (8px h, 4px v)
  Font size:    xs (12px)
  Font weight:  500
  Border-radius: full (pill shape)

Default:
  Background:   Primary-100 (light) / Primary-900 (dark)
  Text:         Primary-700 (light) / Primary-200 (dark)

Success:
  Background:   Success-100 (light) / Success-900 (dark)
  Text:         Success-700 (light) / Success-200 (dark)

Error:
  Background:   Error-100 (light) / Error-900 (dark)
  Text:         Error-700 (light) / Error-200 (dark)

Warning:
  Background:   Warning-100 (light) / Warning-900 (dark)
  Text:         Warning-700 (light) / Warning-200 (dark)
```

### Navigation Patterns

**Sidebar Navigation**:
```
Width:          240px (fixed)
Collapse width: 64px (icons only)
Item height:    40px (with 8px vertical padding)
Item padding:   px-4 py-2
Item spacing:   gap-2 (8px between icon and text)
Item colors:
  Rest:         Neutral-700 (light) / Neutral-300 (dark)
  Hover:        Neutral-100 bg (light) / Neutral-200 (dark)
  Active:       Primary-500 bg + Primary-500 text + left border
Section:        Text uppercase, xs (12px), tracking-wide
```

### Dropdown & Popovers

```
Background:     Neutral-0 (light) / Neutral-100 (dark)
Border:         1px Neutral-200 (light) / Neutral-700 (dark)
Padding:        p-1 (4px)
Border-radius:  8px
Shadow:         medium
Item height:    36px
Item padding:   px-3 py-2
Hover item:     Neutral-100 bg (light) / Neutral-200 (dark)
Selected:       Primary-100 bg (light) / Primary-900 (dark)
```

### Table Styling

```
Header:
  Background:   Neutral-50 (light) / Neutral-100 (dark)
  Text:         Neutral-700 (light) / Neutral-300 (dark)
  Font weight:  600
  Padding:      px-4 py-3
  Border-bottom: 1px Neutral-200 (light) / Neutral-700 (dark)

Row:
  Height:       40px minimum
  Padding:      px-4 py-3
  Border-bottom: 1px Neutral-100 (light) / Neutral-200 (dark)
  Hover:        Neutral-50 bg (light) / Neutral-100 (dark)

Cell (data):
  Font:         Monospace for numeric/technical
  Text color:   Neutral-900 (light) / Neutral-100 (dark)
  Alignment:    Right for numbers, left for text
```

### Modal & Dialog

```
Background:     Neutral-0 (light) / Neutral-100 (dark)
Border:         None (shadow provides elevation)
Border-radius:  12px
Shadow:         high
Padding:        p-6 (24px)
Width:          90vw max, max 500px
Header:
  Font:         2xl, font-semibold
  Margin-bottom: mb-4
  Close button: Top right corner
Footer (optional):
  Border-top:   1px Neutral-200 (light) / Neutral-700 (dark)
  Margin-top:   mt-6
  Padding-top:  pt-6
  Button gap:   gap-3 (12px)
```

### Toast & Notifications

```
Position:       Bottom right (40px from edge)
Width:          400px max (responsive)
Padding:        p-4
Border-radius:  8px
Shadow:         high
Duration:       4 seconds (user-dismissable)

Success:
  Background:   Success-50 (light) / Success-900 (dark)
  Border:       1px Success-200 (light) / Success-700 (dark)
  Icon:         Success-500
  Text:         Success-900 (light) / Success-100 (dark)

Error:
  Background:   Error-50 (light) / Error-900 (dark)
  Border:       1px Error-200 (light) / Error-700 (dark)
  Icon:         Error-500
  Text:         Error-900 (light) / Error-100 (dark)

Info:
  Background:   Info-50 (light) / Info-900 (dark)
  Border:       1px Info-200 (light) / Info-700 (dark)
  Icon:         Info-500
  Text:         Info-900 (light) / Info-100 (dark)
```

### Pagination

```
Button size:    36px × 36px (touch target)
Gap:            gap-1 (4px)
Current page:   Background Primary-500, white text
Other pages:    Neutral-100 bg (light) / Neutral-200 (dark)
Hover:          Neutral-200 bg (light) / Neutral-300 (dark)
Disabled:       Neutral-100 bg, Neutral-300 text, no cursor
```

---

## Accessibility

### Color Contrast

**WCAG AA Minimum** (4.5:1 for normal text, 3:1 for large text):

All color combinations must pass:
- Primary-500 (#3B82F6) on Neutral-0 (white): 4.48:1 ✓
- Primary-500 (#3B82F6) on Neutral-100: 3.8:1 (large text only)
- Error-500 (#EF4444) on Neutral-0: 4.11:1 ✓
- Success-500 (#22C55E) on Neutral-0: 4.54:1 ✓
- Neutral-600 on Neutral-0: 6.47:1 ✓
- Neutral-700 on Neutral-0: 9.64:1 ✓ (excellent)

**Testing**: Use WebAIM contrast checker or Stark plugin

### Color-Blind Safe

- Never use color alone to communicate information (use text labels too)
- Test with color-blind simulators (Deuteranopia, Protanopia, Tritanopia)
- Ensure blue/orange primary/secondary distinction (safer for most forms of color blindness)

### Typography Accessibility

- **Minimum font size**: 14px (body text)
- **Line height**: Minimum 1.5 for body (24px at 16px size)
- **Line length**: Max 80 characters per line (optimal readability)
- **Font weight**: Avoid extra light (< 400) for body text
- **Avoid justified text**: Use left-aligned for better readability

### Interactive Elements

- **Minimum touch target**: 44px × 44px (buttons, checkboxes, radio)
- **Focus states**: Always visible (border or outline)
- **Focus indicator**: 2-3px border/outline in high contrast color
- **Keyboard navigation**: All interactive elements accessible via Tab
- **Skip links**: For main navigation (desktop)

### Motion & Animation

- Respect `prefers-reduced-motion` media query
- Default to minimal animation (200-300ms)
- Avoid auto-playing animations
- Use subtle fades/slides over bounces

### Dark Mode

- Ensure equal accessibility in both light and dark modes
- Test color contrast in both modes
- OLED devices: Pure black (#000000) for maximum contrast
- Status page: Include color mode preference in system settings

---

## Implementation Guide

### Tailwind CSS Configuration

Create/update `frontend/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBEF63',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#145231',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '0' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
        lg: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        xl: ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        '2xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em' }],
        '3xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.01em' }],
        '4xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.01em' }],
      },
      spacing: {
        // Base unit: 4px
        px: '1px',
        0: '0',
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
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
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        high: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
        'very-high': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
      },
      maxWidth: {
        '8xl': '80rem',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
} satisfies Config
```

### CSS Variables (Alternative/Complement)

Create `frontend/src/index.css` with CSS variables:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');

:root {
  /* Light mode colors */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;

  --color-neutral-0: #ffffff;
  --color-neutral-50: #fafafa;
  --color-neutral-200: #e5e7eb;
  --color-neutral-500: #6b7280;
  --color-neutral-800: #1f2937;
  --color-neutral-900: #111827;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Shadows */
  --shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-medium: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-high: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary-400: #60a5fa;
    --color-neutral-0: #0a0a0a;
    --color-neutral-100: #1a1a1a;
    --color-neutral-800: #f5f5f5;
    --color-neutral-900: #ffffff;
  }
}

/* Base styles */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--color-neutral-0);
  color: var(--color-neutral-900);
  line-height: 1.5;
}

code, pre {
  font-family: 'Fira Code', monospace;
}

/* Utility classes */
.text-primary {
  color: var(--color-primary-500);
}

.bg-primary {
  background-color: var(--color-primary-500);
}

/* etc. */
```

### Dark Mode Setup

In React component (example):

```typescript
// App.tsx or root component
import { useEffect, useState } from 'react'

export function App() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(prefersDark)

    // Apply to HTML root
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      {/* Your app content */}
      <button onClick={toggleDarkMode}>
        Toggle Dark Mode
      </button>
    </div>
  )
}
```

---

## Design Direction Options

### Option 1: Modern Minimal (Recommended)

**Characteristics**:
- Clean, spacious layouts with generous whitespace
- Subtle shadows and borders (minimal visual weight)
- Blue primary, gray neutrals, colorful accents
- Flat design with clear interactive states
- Professional, trustworthy aesthetic

**Best for**: Professional analysts, corporate environments, SaaS-first users
**Competitors**: Linear, Vercel, modern Figma
**Implementation**: Start here for Hikaru v1.0+

**Visual Traits**:
```
Borders: 1px, subtle gray
Shadows: Subtle to medium (no heavy drop shadows)
Radius: 8px base (modern, not overly rounded)
Spacing: 16-24px between sections (generous)
Density: Medium (not cramped, not sparse)
Colors: Blue + gray + colorful accents (not rainbow)
```

---

### Option 2: Bold & Colorful

**Characteristics**:
- Higher contrast, more vibrant colors
- Larger, bolder typography
- More pronounced shadows
- Playful but still professional
- Higher visual engagement

**Best for**: Creative teams, marketing analytics, startups
**Competitors**: Retool (slightly), Data Studio
**Consideration**: May reduce serious/trustworthy perception

**Visual Traits**:
```
Borders: 1.5-2px, medium contrast
Shadows: Medium to high
Radius: 12px+ (more rounded)
Spacing: Tighter (12-16px between elements)
Density: Higher (more information visible)
Colors: Bright, saturated accent colors
Primary: Brighter blue (#2563EB instead of #3B82F6)
```

---

### Option 3: Professional & Traditional

**Characteristics**:
- Conservative design language
- High density layouts (financial dashboard style)
- Clear, technical typography (monospace more common)
- Restrained use of color
- Emphasis on data over design

**Best for**: Finance, data science, academic users
**Competitors**: Tableau, Excel-like interfaces
**Consideration**: Risk of appearing outdated

**Visual Traits**:
```
Borders: 1px, prominent
Shadows: Minimal to subtle
Radius: 4px (sharp, technical look)
Spacing: Compact (12-16px)
Density: Very high
Colors: Neutral + one accent color only
Typography: More monospace usage
```

---

## Summary & Next Steps

### Recommended Implementation Path

1. **Phase 1**: Implement color system in Tailwind config (this document)
2. **Phase 2**: Update typography (Inter font stack)
3. **Phase 3**: Establish spacing and component padding/margin standards
4. **Phase 4**: Create component library (buttons, inputs, cards)
5. **Phase 5**: Audit and update all pages with design tokens
6. **Phase 6**: Implement dark mode with proper contrast testing
7. **Phase 7**: Performance optimization (font loading, lazy-load charts)

### Design System Audit Checklist

- [ ] All colors use design system palette (no custom hex codes)
- [ ] All spacing uses 4px base unit scale
- [ ] All border radius follows defined scale (8px default)
- [ ] All shadows follow elevation system
- [ ] All typography uses defined sizes and weights
- [ ] All interactive elements: 44px+ touch targets
- [ ] All interactive elements: visible focus states
- [ ] All text meets WCAG AA contrast minimum
- [ ] Dark mode: equal accessibility and polish
- [ ] Responsive: works on mobile (< 640px)
- [ ] Charts: use defined data visualization palette
- [ ] Icons: consistent size and style

### Design System Maintenance

**Quarterly Review**:
- Audit for off-brand colors or spacing
- Test new features for consistency
- Update documentation with new patterns

**Annual Update**:
- Review against design trends
- Propose improvements/expansions
- Ensure modern relevance

---

## Appendix: Color Reference (Hex Codes)

### All Colors at a Glance

**Primary Blue**:
`#EFF6FF` `#DBEAFE` `#BFDBFE` `#93C5FD` `#60A5FA` `#3B82F6` `#2563EB` `#1D4ED8` `#1E40AF` `#1E3A8A`

**Success Green**:
`#F0FDF4` `#DCFCE7` `#BBEF63` `#86EFAC` `#4ADE80` `#22C55E` `#16A34A` `#15803D` `#166534` `#145231`

**Warning Amber**:
`#FFFBEB` `#FEF3C7` `#FDE68A` `#FCD34D` `#FBBF24` `#F59E0B` `#D97706` `#B45309` `#92400E` `#78350F`

**Error Red**:
`#FEF2F2` `#FEE2E2` `#FECACA` `#FCA5A5` `#F87171` `#EF4444` `#DC2626` `#B91C1C` `#991B1B` `#7F1D1D`

**Info Cyan**:
`#F0F9FF` `#E0F2FE` `#BAE6FD` `#7DD3FC` `#38BDF8` `#0EA5E9` `#0284C7` `#0369A1` `#075985` `#0C4A6E`

**Neutral Gray**:
`#FFFFFF` `#FAFAFA` `#F3F4F6` `#E5E7EB` `#D1D5DB` `#9CA3AF` `#6B7280` `#4B5563` `#374151` `#1F2937` `#111827`

---

**Document Status**: Complete & Ready for Implementation
**Recommendation**: Use Option 1 (Modern Minimal) as the primary design direction for Hikaru v1.0+
**Questions?**: Reference this document for design consistency and accessibility compliance
