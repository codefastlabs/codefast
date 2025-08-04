# Tailwind Variants (tv) Function - CSS Class Classification Analysis

## Overview

This document analyzes the logic of the `tv` function from the `tailwind-variants` library and provides a comprehensive classification of CSS classes used in the CodeFast UI component library.

## Understanding the `tv` Function Logic

The `tv` function is imported from the `tailwind-variants` library and provides a structured way to define component variants with TypeScript support.

### Structure:
```typescript
const componentVariants = tv({
  base: "common classes applied to all variants",
  defaultVariants: {
    size: "default_size",
    variant: "default_variant"
  },
  variants: {
    size: {
      sm: "small size classes",
      md: "medium size classes",
      lg: "large size classes"
    },
    variant: {
      default: "default variant classes",
      outline: "outline variant classes"
    }
  }
});
```

## CSS Class Classification

Based on analysis of button, toggle, and sidebar-menu-button variants, here's the classification of CSS classes:

### 1. State-based Grouping (Component States)

**Hover States:**
- `hover:not-disabled:bg-primary/80`
- `hover:not-disabled:bg-secondary`
- `hover:not-disabled:text-secondary-foreground`
- `hover:not-disabled:underline`
- `hover:not-disabled:aria-invalid:border-destructive/60`
- `hover:not-disabled:not-data-[state=on]:bg-secondary`
- `hover:bg-sidebar-accent`
- `hover:text-sidebar-accent-foreground`

**Focus States:**
- `focus-visible:ring-3`
- `focus-visible:ring-primary/20`
- `focus-visible:ring-destructive/20`
- `focus-visible:ring-ring/50`
- `focus-visible:border-ring`

**Active States:**
- `active:bg-sidebar-accent`
- `active:text-sidebar-accent-foreground`

**Disabled States:**
- `disabled:opacity-50`
- `disabled:pointer-events-none`

**Data States:**
- `data-[state=on]:bg-secondary`
- `data-[state=on]:text-secondary-foreground`
- `data-[active=true]:bg-sidebar-accent`
- `data-[active=true]:text-sidebar-accent-foreground`
- `data-[active=true]:font-medium`
- `data-[state=open]:hover:bg-sidebar-accent`

**Aria States:**
- `aria-disabled:pointer-events-none`
- `aria-disabled:opacity-50`
- `aria-invalid:border-destructive`
- `focus-within:aria-invalid:ring-destructive/20`

### 2. Responsive Breakpoints Grouping

**Note:** No responsive breakpoints were found in the analyzed files. This suggests components use consistent sizing across breakpoints, with responsive behavior handled at the layout level.

### 3. Dark/Light Mode Grouping

**Dark Mode Classes:**
- `dark:focus-visible:ring-primary/40`
- `dark:bg-destructive/60`
- `dark:focus-visible:ring-destructive/40`
- `dark:hover:not-disabled:bg-secondary/50`
- `dark:aria-invalid:border-destructive/70`
- `dark:focus-within:aria-invalid:ring-destructive/40`
- `dark:bg-input/30`
- `dark:hover:not-disabled:bg-input/50`

### 4. Size Variants Grouping

**Button Sizes:**
- `icon: "size-9"` (36px)
- `sm: "h-8 px-3 has-[>svg]:px-2.5"` (32px)
- `md: "h-9 px-4 has-[>svg]:px-3"` (36px)
- `lg: "h-10 px-6 has-[>svg]:px-4"` (40px)

**Toggle Sizes:**
- `sm: "h-8 min-w-8 px-1.5"` (32px)
- `md: "h-9 min-w-9 px-2"` (36px)
- `lg: "h-10 min-w-10 px-2.5"` (40px)

**Sidebar Menu Button Sizes:**
- `sm: "h-7 text-xs"`
- `md: "h-8 text-sm"`
- `lg: "group-data-[collapsible=icon]:p-0! h-12 text-sm"`

### 5. Layout and Positioning Grouping

**Flexbox Layout:**
- `inline-flex`
- `flex`
- `items-center`
- `justify-center`

**Sizing and Positioning:**
- `shrink-0`
- `w-full`
- `size-9`
- `min-w-8`
- `overflow-hidden`

**Display and Interaction:**
- `select-none`
- `pointer-events-none`

### 6. Typography Grouping

**Font Properties:**
- `text-sm`
- `text-xs`
- `font-medium`
- `text-left`

**Text Colors:**
- `text-primary`
- `text-primary-foreground`
- `text-secondary-foreground`
- `text-white`
- `text-muted-foreground`

**Text Decoration:**
- `underline`
- `underline-offset-4`

**Text Behavior:**
- `whitespace-nowrap`

### 7. Spacing and Margin/Padding Grouping

**Padding:**
- `px-3`, `px-4`, `px-6` (horizontal padding)
- `px-1.5`, `px-2`, `px-2.5` (smaller horizontal padding)
- `p-2` (all-around padding)

**Gaps:**
- `gap-2` (flex gap)

**Height:**
- `h-7`, `h-8`, `h-9`, `h-10`, `h-12`

### 8. Borders and Border Radius Grouping

**Border Radius:**
- `rounded-lg`
- `rounded-md`

**Borders:**
- `border`
- `border-input`
- `border-ring`

**Shadows:**
- `shadow-xs`
- `shadow-[0_0_0_1px_hsl(var(--sidebar-border))]`
- `hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]`

### 9. Accessibility Grouping

**Focus Management:**
- `outline-hidden`
- `focus-visible:ring-3`
- `focus-visible:ring-ring/50`

**Screen Reader Support:**
- `aria-disabled:pointer-events-none`
- `aria-disabled:opacity-50`
- `aria-invalid:border-destructive`

**Keyboard Navigation:**
- `focus-visible:border-ring`
- `focus-within:aria-invalid:ring-destructive/20`

### 10. Special Selectors Grouping (Has Selector and Complex Selectors)

**Has Selectors:**
- `has-[>svg]:px-2.5`
- `has-[>svg]:px-3`
- `has-[>svg]:px-4`

**Child Selectors:**
- `[&_svg:not([class*='size-'])]:size-4`
- `[&_svg]:shrink-0`
- `[&>svg]:size-4`
- `[&>svg]:shrink-0`
- `[&>span:last-child]:truncate`

**Group Selectors:**
- `group-has-data-[sidebar=menu-action]/menu-item:pr-8`
- `group-data-[collapsible=icon]:size-8!`
- `group-data-[collapsible=icon]:p-2!`
- `group-data-[collapsible=icon]:p-0!`

**Peer Selectors:**
- `peer/menu-button`

**Complex State Combinations:**
- `hover:not-disabled:not-data-[state=on]:bg-secondary`
- `hover:not-disabled:aria-invalid:border-destructive/60`

## Additional Patterns Observed

### Transitions and Animations
- `transition`
- `transition-[width,height,padding]`

### Background Colors and Theming
- Uses CSS custom properties: `bg-primary`, `bg-secondary`, `bg-destructive`
- Opacity modifiers: `/80`, `/90`, `/50`, `/20`, `/40`
- Custom sidebar theming: `bg-sidebar-accent`, `text-sidebar-accent-foreground`

### Ring and Focus Indicators
- `ring-3` (ring width)
- `ring-primary/20`, `ring-destructive/20` (ring colors with opacity)
- `ring-sidebar-ring` (custom ring color)
