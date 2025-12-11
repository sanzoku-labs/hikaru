# Hikaru Design System - Visual Guide

**This guide shows the design system through practical examples and visual demonstrations.**

---

## Color Palette Showcase

### Primary Color: Trust Through Blue

```
LIGHT MODE - Primary Blue (#3B82F6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#EFF6FF  Very light - subtle backgrounds
#DBEAFE  Light - hover backgrounds, very light fills
#BFDBFE  Light-medium - light fills, alt backgrounds
#93C5FD  Medium-light - secondary interactive
#60A5FA  Medium - interactive (darker mode)
#3B82F6  PRIMARY - Main CTAs, focus, interactive (USE THIS MOST)
#2563EB  Dark - Hover state on primary button
#1D4ED8  Darker - Active/pressed state
#1E40AF  Very dark - Deep interactive states
#1E3A8A  Darkest - Maximum contrast (rare use)

DARK MODE - Lighter Blue (#60A5FA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use lighter variant (#60A5FA) for buttons in dark mode
for better contrast on dark backgrounds
```

### Semantic Colors in Action

```
SUCCESS (Positive Actions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#F0FDF4  Background + Label = "#F0FDF4 with #15803D text"
#22C55E  Checkmark icon, status indicator
#16A34A  Active/hover state
Perfect for: "File uploaded successfully"

WARNING (Cautions, Secondary Actions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#FFFBEB  Background + Label = "#FFFBEB with #92400E text"
#F59E0B  Warning icon, secondary highlight
#D97706  Hover state
Perfect for: "Please review before submitting"

ERROR (Destructive Actions, Alerts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#FEF2F2  Background + Label = "#FEF2F2 with #991B1B text"
#EF4444  Error icon, destructive button
#DC2626  Hover state
Perfect for: "Delete this project?"

INFO (Informational Messages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#F0F9FF  Background + Label = "#F0F9FF with #075985 text"
#0EA5E9  Info icon, notification
#0284C7  Hover state
Perfect for: "You can upload up to 5 files"
```

### Neutral Grays - The Foundation

```
LIGHT MODE NEUTRALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#FFFFFF  Pure white - main backgrounds
#FAFAFA  Off-white - subtle alt backgrounds
#F3F4F6  Very light gray - section backgrounds
#E5E7EB  Light gray - borders, dividers
#D1D5DB  Medium-light gray - emphasized borders
#9CA3AF  Medium gray - icons (default state)
#6B7280  Medium-dark gray - secondary text
#4B5563  Dark gray - tertiary/helper text
#374151  Darker gray - disabled text
#1F2937  Very dark gray - secondary headings
#111827  Darkest gray - PRIMARY TEXT, headings

DARK MODE NEUTRALS (INVERTED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#0A0A0A  Pure black - main backgrounds (OLED optimized)
#1A1A1A  Very dark gray - subtle alt backgrounds
#262626  Dark gray - card backgrounds
#404040  Medium dark gray - section backgrounds
#525252  Medium gray - borders, dividers
#A3A3A3  Medium-light gray - secondary text
#D4D4D4  Light gray - tertiary/helper text
#E5E5E5  Very light gray - disabled text
#F5F5F5  Off-white - secondary headings
#FFFFFF  Pure white - PRIMARY TEXT, headings
```

---

## Typography in Action

### Type Scale Visualization

```
TEXT SIZES AND USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

12px (xs) - LABELS, BADGES, FOOTNOTES
14px (sm) - SECONDARY TEXT, HELPER TEXT
16px (base) - BODY TEXT (default, most readable)
20px (lg) - CALL-TO-ACTION TEXT
24px (xl) - PAGE SUBHEADINGS
32px (2xl) - PAGE HEADINGS
40px (3xl) - MAJOR HEADINGS
48px (4xl) - HERO TITLES

HEADING HIERARCHY EXAMPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

48px  My Projects              (4xl, font-semibold)
32px  Recently Active          (2xl, font-semibold)
20px  Sales Analytics Q4       (lg, font-semibold - card title)

16px  This is body text that explains what users should know.
      It's readable, has good line height, and flows naturally.
      Use this for all regular copy.

14px  Secondary information like metadata or descriptions
12px  Helper text, labels, badges
```

### Font Pairing: Inter

```
Inter works everywhere:
- Headings: Clean, modern, professional
- Body: Highly readable at all sizes
- UI text: Perfect for buttons, labels, forms
- Data: Clear at small sizes in tables

No need to mix fonts! Inter handles all roles.

For monospace (data tables, code):
- JetBrains Mono (preferred)
- OR Fira Code (alternative)
```

---

## Component Showcase

### Button States

```
PRIMARY BUTTON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REST STATE:
[████████████ Create Project ████████████]
Background: #3B82F6 (Primary-500)
Text: White
Shadow: None

HOVER STATE:
[████████████ Create Project ████████████]  ↑ shadow-subtle
Background: #2563EB (Primary-600) - darker
Text: White
Shadow: subtle

ACTIVE/PRESSED:
[████████████ Create Project ████████████]
Background: #1D4ED8 (Primary-700) - even darker
Text: White

DISABLED:
[████████████ Create Project ████████████] [grayed out]
Background: #D1D5DB (Neutral-300)
Text: #9CA3AF (Neutral-400)
Cursor: not-allowed


SECONDARY BUTTON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REST STATE:
[─────────── Cancel ───────────]
Background: #F3F4F6 (Neutral-100)
Border: 1px #D1D5DB (Neutral-300)
Text: #1F2937 (Neutral-800)

HOVER STATE:
[─────────── Cancel ───────────]  ↑ shadow-subtle
Background: #E5E7EB (Neutral-200)
Border: 1px #D1D5DB
Text: #1F2937


DANGER BUTTON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REST STATE:
[████████████ Delete ████████████]
Background: #EF4444 (Error-500)
Text: White

HOVER STATE:
[████████████ Delete ████████████]  ↑ shadow-subtle
Background: #DC2626 (Error-600)
Text: White
```

### Input Fields

```
FOCUSED INPUT (WITH VALUE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────┐
│ Project Name                │  ← Text in Neutral-900
├─────────────────────────────┤
Height: 44px minimum (touch target)
Border: 2px #3B82F6 (Primary-500 - FOCUS)
Ring: 3px #EFF6FF (Primary-50 - focus ring)
Padding: 12px horizontal, 8px vertical
Background: White (#FFFFFF)


EMPTY INPUT (UNFOCUSED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────┐
│ Enter project name...       │  ← Placeholder in Neutral-400
├─────────────────────────────┤
Border: 1px #E5E7EB (Neutral-200)
Background: White (#FFFFFF)
Padding: 12px × 8px


ERROR INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────┐
│ Sales_Q4_2024.xlsx          │
├─────────────────────────────┤
✗ This field is required      ← Error text in #DC2626
Border: 2px #EF4444 (Error-500)
Background: White (#FFFFFF)
```

### Card Layout

```
CARD WITH CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌───────────────────────────────┐
│ ▲ Sales Analytics Q4          │  ← Heading in 20px
│                               │
│ Comprehensive analysis of Q4   │  ← Description in 14px
│ sales data with AI insights    │
│                               │
│ Files: 12                      │  ← Metadata in 12px
│ Last Updated: 2 hours ago      │
│ Size: 2.4 MB                   │
└───────────────────────────────┘
Padding: 24px all sides
Border: 1px #E5E7EB (Neutral-200)
Background: #FFFFFF
Shadow: subtle (hovers to medium)
Border-radius: 8px


CARD HOVER STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────┐
│ ▲ Sales Analytics Q4        │  ↑ Shadow increases to medium
│ [Same content, lifted up]   │  → Cursor changes to pointer
└─────────────────────────────┘
```

### Badge States

```
BADGE STYLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Success:  [✓ Active]
          Background: #F0FDF4, Text: #15803D
          Size: 12px, rounded full (pill)

Warning:  [! Pending]
          Background: #FFFBEB, Text: #92400E

Error:    [✗ Failed]
          Background: #FEF2F2, Text: #991B1B

Info:     [ⓘ In Progress]
          Background: #F0F9FF, Text: #075985

Default:  [Primary]
          Background: #EFF6FF, Text: #1D4ED8
```

---

## Spacing in Action

### Component Spacing Grid

```
4px UNIT SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUTTON LAYOUT
┌─────────────────────────────────┐
│  p-4 (16px padding)             │
│  ┌───────────────────────────┐  │
│  │ Create Project (p-2 8px)  │  │
│  └───────────────────────────┘  │
│  gap-2 (8px between items)      │
│  ┌───────────────────────────┐  │
│  │ Cancel                    │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘

FORM SPACING
┌─────────────────────────────┐
│ Email Address               │
│ input (space-y-1: 4px)      │
│ ┌─────────────────────────┐ │
│ │ name@example.com        │ │
│ └─────────────────────────┘ │
│ space-y-4 (16px between)    │
│ Password                    │
│ ┌─────────────────────────┐ │
│ │ ••••••••••              │ │
│ └─────────────────────────┘ │
│ helper text                 │
└─────────────────────────────┘

SECTION SPACING
┌─────────────────────────────────────┐
│ My Projects                         │
│ space-y-8 (32px between sections)   │
│ ┌──────────┐  ┌──────────┐         │
│ │ Project  │  │ Project  │         │
│ │ Card 1   │  │ Card 2   │         │
│ └──────────┘  └──────────┘         │
│                                     │
│ Analytics                           │
│ ┌──────────┐  ┌──────────┐         │
│ │ Chart 1  │  │ Chart 2  │         │
│ └──────────┘  └──────────┘         │
└─────────────────────────────────────┘
```

---

## Dark Mode Comparison

### Same Component, Two Modes

```
LIGHT MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐  ← Border: #E5E7EB
│ Recent Projects                 │  ← Text: #111827
│ ─────────────────────────────── │
│ Sales Analytics Q4        Active │  ← Title: #111827
│ Analysis of Q4 sales data       │  ← Sub: #6B7280
│ 12 files • 2 hours ago          │
│ ┌──────────────┐ ┌────────────┐ │
│ │ View Details │ │ ⋯ More     │ │
│ └──────────────┘ └────────────┘ │
└─────────────────────────────────┘
Background: #FFFFFF
Shadow: subtle (0 1px 2px rgba(0,0,0,0.05))

DARK MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐  ← Border: #404040
│ Recent Projects                 │  ← Text: #F5F5F5
│ ─────────────────────────────── │
│ Sales Analytics Q4        Active │  ← Title: #FFFFFF
│ Analysis of Q4 sales data       │  ← Sub: #A3A3A3
│ 12 files • 2 hours ago          │
│ ┌──────────────┐ ┌────────────┐ │
│ │ View Details │ │ ⋯ More     │ │
│ └──────────────┘ └────────────┘ │
└─────────────────────────────────┘
Background: #262626
Shadow: medium (slightly stronger for visibility)
```

---

## Data Visualization Palette

### Chart Colors in Practice

```
LINE CHART
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Revenue Trend
100 ┤                 ╱╲
    ├          ╱╲    ╱  ╲
80  ├    ╱────╱  ╲──╱    ╲
    ├───╱              ╲   ╲
60  ├─╱                 ╲───╲───
    │
    └─────────────────────────────
    │
Legend:
[████████] #3B82F6 - Primary (main line)
[████████] #8B5CF6 - Purple (secondary)
[████████] #10B981 - Green (growth indicator)


PIE CHART
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

       ╱─────────╲
     ╱ #3B82F6   ╲ 45%
   ╱──────────────╲
  │ #8B5CF6  25%  │ ← Each color distinct
  │               │    and accessible
   ╲──────────────╱
     ╲ #10B981   ╱ 30%
       ╲─────────╱


BAR CHART (GROUPED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        ║ Q1 ║ Q2 ║ Q3 ║ Q4 ║
        ║    ║    ║    ║    ║
  50K ┤ ║    ║ ╔══╗ ║ ╔══╗ ║
     ┤ ║ ╔══╗║ ║  ║ ║ ║  ║ ║
  30K ┤ ║ ║  ║║ ║  ║ ║ ║  ║ ║
     ┤ ║ ║  ║ ║ ║  ║ ║ ║  ║ ║
  10K ┤ ║ ║  ║ ║ ║  ║ ║ ║  ║ ║
     └─╫─╫──╫─╫─╫──╫─╫─╫──╫─╫─
       [#3B82F6] [#8B5CF6] [#10B981]
```

---

## Accessibility in Action

### Contrast Examples

```
WCAG AA COMPLIANT COMBINATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Text on White Background:
┌──────────────────────────┐
│ #111827 on #FFFFFF       │  21:1 ratio ✓✓✓ (Excellent)
│ #1F2937 on #FFFFFF       │  14.8:1 ratio ✓✓✓
│ #374151 on #FFFFFF       │  9.64:1 ratio ✓✓
│ #6B7280 on #FFFFFF       │  4.54:1 ratio ✓ (AA only)
└──────────────────────────┘

Text on Dark Background:
┌──────────────────────────┐
│ #FFFFFF on #0A0A0A       │  21:1 ratio ✓✓✓ (Excellent)
│ #F5F5F5 on #0A0A0A       │  19.4:1 ratio ✓✓✓
│ #E5E5E5 on #0A0A0A       │  17.8:1 ratio ✓✓✓
│ #D4D4D4 on #0A0A0A       │  15.7:1 ratio ✓✓✓
└──────────────────────────┘

Color Not Sole Indicator:
┌──────────────────────────┐
│ ✓ Status: Complete       │  GOOD (icon + text + color)
│ ✓ [GREEN CIRCLE] Active  │  GOOD (icon + color + text)
│ ✗ [Red Box]              │  BAD (color only, no context)
└──────────────────────────┘
```

### Touch Targets

```
MINIMUM 44px × 44px RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ GOOD - Comfortable touch target
┌────────────────────────┐
│                        │  44px tall
│  [Button with padding] │
│                        │
└────────────────────────┘

✗ BAD - Too small (mobile friendly fails)
┌──────────────┐
│ [Small btn]  │  24px tall - Difficult to tap
└──────────────┘

✓ GOOD - Proper button sizing
┌──────────────────────┐
│ [    Click me    ]    │  min-h-[44px]
└──────────────────────┘
```

---

## Real-World Dashboard Example

```
HIKARU DASHBOARD LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────┐
│  Hikaru                    🔍    🔔    👤          │  ← Nav (8px spacing)
├─────────────────────────────────────────────────────┤
│ ▯ Projects                                          │
│ ▯ Analytics                                         │
│ ▯ Comparisons                 My Projects           │
│ ▯ Merging                                           │
│ ▯ Q&A Chat                    [+ New Project]      │
│                                                     │
│              ┌──────────────────────────────────┐  │
│              │ Total Projects      24           │  │  ← Stat cards
│              │ [████] Files        156         │  │     p-6 (24px)
│              │                                  │  │     gap-4 (16px)
│              └──────────────────────────────────┘  │
│                                                     │
│              ┌──────────────┐  ┌──────────────┐    │
│              │ Sales Q4     │  │ Customer     │    │
│              │ [Blue icon]  │  │ Segmentation │    │
│              │ Active       │  │ [Purple icon]│    │
│              │ 12 files     │  │ In Progress  │    │
│              │ 2.4 MB       │  │ 8 files      │    │
│              └──────────────┘  └──────────────┘    │
│                                                     │
│              ┌──────────────┐  ┌──────────────┐    │
│              │ ...more      │  │ ...more      │    │
│              │ cards        │  │ cards        │    │
│              └──────────────┘  └──────────────┘    │
│                                                     │
│              [1] [2] [3] [4]                        │
└─────────────────────────────────────────────────────┘

Colors Used:
- Nav background: #FFFFFF (light) / #0A0A0A (dark)
- Sidebar background: #F3F4F6 (light) / #262626 (dark)
- Card backgrounds: #FFFFFF (light) / #262626 (dark)
- Primary CTA: #3B82F6
- Project icons: Multiple colors (#3B82F6, #A855F7, #10B981, #F97316)
- Borders: 1px #E5E7EB (light) / #404040 (dark)
- Spacing: p-6 cards, gap-4 grid, space-y-8 sections
```

---

## Animation & Interaction

### Focus Ring Example

```
FOCUS RING PROGRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REST:
┌─────────────────┐
│   Click me      │  Clean appearance
└─────────────────┘

HOVER:
┌─────────────────┐
│   Click me  ✨  │  shadow-subtle appears
└─────────────────┘

FOCUS (User tabs to it):
╔═════════════════╗
║   Click me      ║  2px ring (#3B82F6)
╠═════════════════╠  3px offset
╚═════════════════╝

ACTIVE (User clicks):
┌┌───────────────┐┐
││   Click me    ││  Darker background
└└───────────────┘┘  Pressed appearance
```

---

## Print This Guide!

This visual guide works best when printed and posted near your desk while developing.

**Key Takeaways**:
1. Blue (#3B82F6) is primary - use for main CTAs
2. Spacing: 4px base unit (p-2, p-4, p-6 most common)
3. Radius: 8px default for buttons, inputs, cards
4. Dark mode: Use `dark:` prefix on all colors
5. Touch targets: Always minimum 44px × 44px
6. Contrast: Check ratios with WebAIM checker
7. Accessibility: Never use color alone

---

**Last Updated**: November 27, 2025
**Status**: Ready for Reference
**Print Status**: Print-friendly format
