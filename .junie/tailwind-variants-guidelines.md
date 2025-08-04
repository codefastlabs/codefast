# Tailwind Variants Classification Guidelines

## Overview

This document provides comprehensive guidelines for analyzing and classifying CSS classes in Tailwind Variants (`tv`) functions. These guidelines ensure consistent organization and maintainability of component styling across the CodeFast UI library.

## Understanding Tailwind Variants Structure

### Basic Structure
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

### Key Concepts
- **Base**: Common styles applied to all component instances
- **Variants**: Different style variations organized by category (size, variant, etc.)
- **DefaultVariants**: Specifies which variants are applied by default
- **Compound Variants**: Advanced feature for combining multiple variant conditions

## CSS Class Classification System

### 1. State-based Grouping (Component States)

**Purpose**: Group classes that respond to user interactions and component states.

**Categories**:
- **Hover States**: `hover:`, `hover:not-disabled:`
- **Focus States**: `focus:`, `focus-visible:`, `focus-within:`
- **Active States**: `active:`
- **Disabled States**: `disabled:`, `aria-disabled:`
- **Data States**: `data-[state=*]:`, `data-[active=*]:`
- **Aria States**: `aria-invalid:`, `aria-expanded:`

**Best Practices**:
- Always include `:not-disabled` modifier for interactive states when applicable
- Use `focus-visible:` instead of `focus:` for better accessibility
- Combine states logically: `hover:not-disabled:not-data-[state=on]:`
- Group related states together in the same variant

**Examples**:
```
Good: Logical state combinations
hover:not-disabled:bg-primary/80 focus-visible:ring-3 disabled:opacity-50

Avoid: Conflicting or redundant states
hover:bg-red-500 hover:bg-blue-500 (Conflicting)
```

### 2. Responsive Breakpoints Grouping

**Purpose**: Group classes that apply at different screen sizes.

**Categories**:
- **Mobile First**: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Container Queries**: `@container:`
- **Print Styles**: `print:`

**Best Practices**:
- Follow mobile-first approach
- Use consistent breakpoint naming
- Group responsive variants logically
- Consider container queries for component-level responsiveness

**Examples**:
```
Good: Mobile-first responsive design
h-8 sm:h-10 md:h-12 lg:h-14

Good: Logical grouping
px-2 sm:px-4 md:px-6 lg:px-8
```

### 3. Dark/Light Mode Grouping

**Purpose**: Group classes that change appearance based on color scheme.

**Categories**:
- **Dark Mode**: `dark:`
- **Light Mode**: Default (no prefix)
- **System Preference**: Combined with `@media (prefers-color-scheme)`

**Best Practices**:
- Always provide dark mode alternatives for colored elements
- Use semantic color tokens instead of hardcoded colors
- Test both modes during development
- Consider opacity variations for dark mode

**Examples**:
```
Good: Semantic colors with dark mode support
bg-primary text-primary-foreground dark:bg-primary/80 dark:text-primary-foreground

Good: Proper opacity handling
ring-primary/20 dark:ring-primary/40
```

### 4. Size Variants Grouping

**Purpose**: Group classes that control component dimensions and scaling.

**Categories**:
- **Height**: `h-*`
- **Width**: `w-*`, `min-w-*`, `max-w-*`
- **Size**: `size-*` (width and height together)
- **Padding**: Size-related padding adjustments
- **Typography**: Size-related font adjustments

**Best Practices**:
- Use consistent size scales (e.g., 32px, 36px, 40px)
- Include comments with pixel values for clarity
- Adjust padding proportionally with size
- Consider icon spacing adjustments per size

**Example Size Variants**:
```
sm: "h-8 px-3 text-sm has-[>svg]:px-2.5"  // 32px
md: "h-9 px-4 text-sm has-[>svg]:px-3"    // 36px  
lg: "h-10 px-6 text-base has-[>svg]:px-4" // 40px
```

### 5. Layout and Positioning Grouping

**Purpose**: Group classes that control element layout and positioning.

**Categories**:
- **Display**: `flex`, `inline-flex`, `block`, `inline-block`
- **Flexbox**: `items-center`, `justify-center`, `flex-col`
- **Grid**: `grid`, `grid-cols-*`, `col-span-*`
- **Position**: `relative`, `absolute`, `fixed`, `sticky`
- **Overflow**: `overflow-hidden`, `overflow-auto`

**Best Practices**:
- Group related layout properties together
- Use flexbox for component internal layout
- Consider grid for complex layouts
- Handle overflow appropriately for content

**Examples**:
```
Good: Logical layout grouping
inline-flex items-center justify-center gap-2 overflow-hidden

Good: Consistent flex patterns
flex w-full items-center gap-2
```

### 6. Typography Grouping

**Purpose**: Group classes that control text appearance and behavior.

**Categories**:
- **Font Size**: `text-xs`, `text-sm`, `text-base`, `text-lg`
- **Font Weight**: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- **Font Family**: `font-sans`, `font-serif`, `font-mono`
- **Text Color**: `text-*`
- **Text Alignment**: `text-left`, `text-center`, `text-right`
- **Text Decoration**: `underline`, `line-through`
- **Text Behavior**: `whitespace-nowrap`, `truncate`

**Best Practices**:
- Use semantic color tokens for text colors
- Maintain consistent font size scales
- Consider readability and contrast
- Handle text overflow appropriately

**Examples**:
```
Good: Semantic text styling
text-sm font-medium text-primary whitespace-nowrap

Good: Proper text handling
text-left [&>span:last-child]:truncate
```

### 7. Spacing and Margin/Padding Grouping

**Purpose**: Group classes that control spacing around and within elements.

**Categories**:
- **Padding**: `p-*`, `px-*`, `py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*`
- **Margin**: `m-*`, `mx-*`, `my-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*`
- **Gap**: `gap-*`, `gap-x-*`, `gap-y-*`
- **Space**: `space-x-*`, `space-y-*`

**Best Practices**:
- Use consistent spacing scales
- Prefer padding over margin for component internals
- Use gap for flex/grid layouts
- Consider responsive spacing needs

**Examples**:
```
Good: Consistent spacing
px-4 py-2 gap-2

Good: Size-appropriate spacing
sm: "h-8 px-3 gap-1.5"
md: "h-9 px-4 gap-2"
lg: "h-10 px-6 gap-2.5"
```

### 8. Borders and Border Radius Grouping

**Purpose**: Group classes that control borders, outlines, and corner rounding.

**Categories**:
- **Border Width**: `border`, `border-0`, `border-2`, `border-4`
- **Border Color**: `border-*`
- **Border Style**: `border-solid`, `border-dashed`, `border-dotted`
- **Border Radius**: `rounded-*`
- **Outline**: `outline-*`
- **Ring**: `ring-*`
- **Shadow**: `shadow-*`

**Best Practices**:
- Use semantic border colors
- Maintain consistent border radius scales
- Prefer ring over outline for focus indicators
- Consider shadow depth hierarchy

**Examples**:
```
Good: Semantic border styling
border border-input rounded-lg shadow-sm

Good: Focus ring styling
focus-visible:ring-3 focus-visible:ring-primary/20
```

### 9. Accessibility Grouping

**Purpose**: Group classes that enhance accessibility and usability.

**Categories**:
- **Focus Management**: `focus-visible:*`, `focus-within:*`
- **Screen Reader**: `sr-only`, `not-sr-only`
- **Keyboard Navigation**: Focus indicators, tab handling
- **ARIA Support**: `aria-*` state handling
- **Reduced Motion**: `motion-reduce:*`

**Best Practices**:
- Always provide visible focus indicators
- Use `focus-visible:` for keyboard-only focus
- Support reduced motion preferences
- Test with screen readers
- Ensure sufficient color contrast

**Examples**:
```
Good: Comprehensive accessibility
focus-visible:ring-3 focus-visible:ring-primary/20 outline-hidden motion-reduce:transition-none

Good: ARIA state handling
aria-invalid:border-destructive focus-within:aria-invalid:ring-destructive/20
```

### 10. Special Selectors Grouping (Has Selector and Complex Selectors)

**Purpose**: Group advanced CSS selectors and pseudo-classes.

**Categories**:
- **Has Selectors**: `has-[*]:*`
- **Child Selectors**: `[&>*]:*`, `[&_*]:*`
- **Group Selectors**: `group-*:*`
- **Peer Selectors**: `peer-*:*`
- **Complex Combinations**: Multiple pseudo-classes combined

**Best Practices**:
- Use has selectors for conditional styling based on content
- Prefer child selectors over descendant selectors when possible
- Document complex selectors with comments
- Test selector specificity and performance

**Examples**:
```
Good: Has selector for icon spacing
px-4 has-[>svg]:px-3

Good: Child selector for icon sizing
[&>svg]:size-4 [&>svg]:shrink-0

Good: Complex group selector
group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2
```

## Classification Workflow

### Step 1: Analyze the Component
1. Identify the component's purpose and behavior
2. List all CSS classes used in the component
3. Note any complex selectors or state combinations
4. Document responsive and accessibility requirements

### Step 2: Extract and Categorize Classes
1. Create a comprehensive list of all classes
2. Group classes by the 10 categories
3. Note any classes that don't fit standard categories
4. Identify patterns and relationships between classes

### Step 3: Organize by Priority
1. **Base classes**: Common styles applied to all variants
2. **Size variants**: Different size options
3. **Style variants**: Different visual styles
4. **State handling**: Interactive and accessibility states
5. **Responsive behavior**: Breakpoint-specific styles

### Step 4: Document Patterns
1. Note consistent patterns across similar components
2. Document any deviations and their reasons
3. Create reusable class combinations
4. Update component documentation

## Best Practices for Variant Organization

### Naming Conventions
- Use descriptive variant names: `default`, `destructive`, `outline`, `ghost`
- Use consistent size naming: `sm`, `md`, `lg`, `xl`
- Use semantic color names: `primary`, `secondary`, `destructive`

### Class Organization Within Variants
1. **Layout and positioning** (flex, grid, positioning)
2. **Sizing** (width, height, padding)
3. **Typography** (font size, weight, color)
4. **Background and borders** (background, border, shadow)
5. **States** (hover, focus, disabled)
6. **Special selectors** (has, child selectors)

### Performance Considerations
- Avoid overly complex selectors
- Use efficient CSS selectors
- Consider bundle size impact
- Test rendering performance

### Maintenance Guidelines
- Keep variants focused and single-purpose
- Document complex class combinations
- Use consistent patterns across components
- Regular review and refactoring

## Common Patterns and Anti-Patterns

### ✅ Good Patterns
```
Logical state combinations:
hover:not-disabled:bg-primary/80

Consistent size scaling:
sm: "h-8 px-3 text-sm"
md: "h-9 px-4 text-sm"
lg: "h-10 px-6 text-base"

Semantic color usage:
bg-primary text-primary-foreground

Proper accessibility:
focus-visible:ring-3 outline-hidden
```

### ❌ Anti-Patterns
```
Conflicting classes:
bg-red-500 bg-blue-500

Hardcoded colors without dark mode:
bg-red-500 text-white

Missing accessibility:
focus:outline-none (without alternative focus indicator)

Inconsistent sizing:
sm: "h-6 px-2"
md: "h-12 px-8" (Too large jump)
```

## Tools and Resources

### Recommended Tools
- **Tailwind CSS IntelliSense**: VS Code extension for class completion
- **Headless UI**: For accessible component patterns
- **Radix UI**: For complex component behaviors
- **Tailwind Variants**: For type-safe variant management

### Testing Checklist
- [ ] All interactive states work correctly
- [ ] Dark mode variants are properly implemented
- [ ] Focus indicators are visible and accessible
- [ ] Responsive behavior works across breakpoints
- [ ] Screen reader compatibility is maintained
- [ ] Performance impact is acceptable

## Conclusion

Following these guidelines ensures consistent, maintainable, and accessible component styling across the CodeFast UI library. Regular review and updates of these guidelines help maintain code quality and developer experience.

For questions or suggestions regarding these guidelines, please refer to the project documentation or create an issue in the repository.
