# @codefast/ui

A modern, high-performance UI component library built with React, TypeScript, and Tailwind CSS. Designed for scalable web applications with comprehensive accessibility support and seamless dark mode integration.

## Features

- 🎨 **50+ Components** - Comprehensive collection of UI components
- 🌙 **Dark Mode** - Built-in dark mode support with smooth transitions
- ♿ **Accessible** - WCAG compliant components built on Radix UI primitives
- 🎯 **TypeScript** - Full TypeScript support with comprehensive type definitions
- 🚀 **Performance** - Optimized for bundle size and runtime performance
- 🎨 **Customizable** - Easily themeable with CSS variables and Tailwind CSS
- 📱 **Responsive** - Mobile-first responsive design
- 🔧 **Developer Experience** - Excellent IntelliSense and documentation

## Installation

```bash
# Using pnpm (recommended)
pnpm add @codefast/ui

# Using npm
npm install @codefast/ui

# Using yarn
yarn add @codefast/ui
```

## Quick Start

### 1. CSS Configuration

Import the required styles in your global CSS file (e.g., `app/globals.css`):

```css
@import "tailwindcss";
@import "@codefast/ui/styles.css";

@source '../../node_modules/@codefast/ui';
@custom-variant dark (&:where(.dark, .dark *));

@layer base {
  :root {
    --input: var(--color-neutral-200);
    --border: var(--color-neutral-200);
    --ring: var(--color-neutral-400);
    --background: var(--color-white);
    --foreground: var(--color-neutral-950);
    --primary: var(--color-sky-500);
    --primary-foreground: var(--color-neutral-50);
    --secondary: var(--color-neutral-100);
    --secondary-foreground: var(--color-neutral-900);
    --destructive: var(--color-red-600);
    --accent: var(--color-neutral-100);
    --accent-foreground: var(--color-neutral-900);
    --muted: var(--color-neutral-100);
    --muted-foreground: var(--color-neutral-500);
    --popover: var(--color-white);
    --popover-foreground: var(--color-neutral-950);
    --popover-overlay: --alpha(var(--color-neutral-900) / 20%);
    --card: var(--color-white);
    --card-foreground: var(--color-neutral-950);
    --sidebar: var(--color-neutral-50);
    --sidebar-foreground: var(--color-neutral-950);
    --sidebar-primary: var(--color-sky-500);
    --sidebar-primary-foreground: var(--color-neutral-50);
    --sidebar-accent: var(--color-neutral-100);
    --sidebar-accent-foreground: var(--color-neutral-900);
    --sidebar-border: var(--color-neutral-200);
    --sidebar-ring: var(--color-neutral-400);
    --chart-1: var(--color-orange-600);
    --chart-2: var(--color-teal-600);
    --chart-3: var(--color-cyan-600);
    --chart-4: var(--color-amber-600);
    --chart-5: var(--color-amber-500);
  }

  @variant dark {
    --input: var(--color-neutral-700);
    --border: --alpha(var(--color-neutral-700) / 50%);
    --ring: var(--color-neutral-500);
    --background: var(--color-neutral-950);
    --foreground: var(--color-neutral-50);
    --primary: var(--color-sky-700);
    --primary-foreground: var(--color-neutral-50);
    --secondary: var(--color-neutral-800);
    --secondary-foreground: var(--color-neutral-50);
    --destructive: var(--color-red-400);
    --accent: var(--color-neutral-700);
    --accent-foreground: var(--color-neutral-50);
    --muted: var(--color-neutral-800);
    --muted-foreground: var(--color-neutral-400);
    --popover: var(--color-neutral-800);
    --popover-foreground: var(--color-neutral-50);
    --popover-overlay: --alpha(var(--color-neutral-900) / 80%);
    --card: var(--color-neutral-900);
    --card-foreground: var(--color-neutral-50);
    --sidebar: var(--color-neutral-900);
    --sidebar-foreground: var(--color-neutral-50);
    --sidebar-primary: var(--color-sky-700);
    --sidebar-primary-foreground: var(--color-neutral-50);
    --sidebar-accent: var(--color-neutral-800);
    --sidebar-accent-foreground: var(--color-neutral-50);
    --sidebar-border: var(--color-neutral-800);
    --sidebar-ring: var(--color-neutral-600);
    --chart-1: var(--color-blue-700);
    --chart-2: var(--color-emerald-500);
    --chart-3: var(--color-amber-500);
    --chart-4: var(--color-purple-500);
    --chart-5: var(--color-rose-500);
  }
}
```

### 2. Next.js Configuration (Optional)

For better performance in Next.js applications, add this to your `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@codefast/ui"],
  },
};

export default nextConfig;
```

## Usage Examples

### Basic Components

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@codefast/ui";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Get Started</Button>
        <Button variant="outline">Learn More</Button>
      </CardContent>
    </Card>
  );
}
```

### Form Components

```tsx
import { Input, Label, Button, Form } from "@codefast/ui";

export function LoginForm() {
  return (
    <Form>
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Enter your password" />
        </div>
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </div>
    </Form>
  );
}
```

### Navigation Components

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@codefast/ui";

export function Navigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="/products/web">Web Apps</NavigationMenuLink>
            <NavigationMenuLink href="/products/mobile">Mobile Apps</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Available Components

### Layout & Structure

- **Container** - Responsive container component
- **Box** - Flexible box component
- **Section** - Semantic section wrapper
- **Separator** - Visual divider component
- **AspectRatio** - Maintain aspect ratios
- **Resizable** - Resizable panels

### Navigation

- **NavigationMenu** - Accessible navigation menus
- **Breadcrumb** - Breadcrumb navigation
- **Pagination** - Page navigation
- **Menubar** - Menu bar component
- **Sidebar** - Collapsible sidebar

### Data Display

- **Card** - Flexible content containers
- **Table** - Data tables with sorting
- **Badge** - Status and category badges
- **Avatar** - User profile images
- **Skeleton** - Loading placeholders
- **Progress** - Progress indicators
- **Chart** - Data visualization components

### Feedback

- **Alert** - Alert messages
- **AlertDialog** - Modal alerts
- **Sonner** - Toast notifications
- **Spinner** - Loading spinners
- **Progress Circle** - Circular progress

### Forms & Input

- **Input** - Text input fields
- **InputNumber** - Numeric input
- **InputPassword** - Password input
- **InputSearch** - Search input
- **InputOTP** - One-time password input
- **Textarea** - Multi-line text input
- **Select** - Dropdown selection
- **Checkbox** - Checkbox input
- **CheckboxGroup** - Grouped checkboxes
- **CheckboxCards** - Card-style checkboxes
- **Radio** - Radio button input
- **RadioGroup** - Grouped radio buttons
- **RadioCards** - Card-style radio buttons
- **Switch** - Toggle switch
- **Slider** - Range slider
- **Label** - Form labels
- **Form** - Form wrapper with validation

### Interactive

- **Button** - Action buttons
- **Toggle** - Toggle buttons
- **ToggleGroup** - Grouped toggles
- **Tabs** - Tabbed interfaces
- **Accordion** - Collapsible content
- **Collapsible** - Show/hide content
- **Dialog** - Modal dialogs
- **Drawer** - Slide-out panels
- **Sheet** - Side panels
- **Popover** - Floating content
- **Tooltip** - Contextual hints
- **HoverCard** - Hover-triggered cards
- **ContextMenu** - Right-click menus
- **DropdownMenu** - Dropdown menus
- **Command** - Command palette
- **Calendar** - Date picker
- **Carousel** - Image/content carousel

### Typography

- **Heading** - Semantic headings
- **Text** - Text component
- **Blockquote** - Quote blocks
- **Code** - Inline code
- **Pre** - Code blocks
- **Em** - Emphasized text
- **Strong** - Strong text
- **Kbd** - Keyboard shortcuts
- **Quote** - Quote component

### Utility

- **ScrollArea** - Custom scrollbars
- **Inline** - Inline wrapper

## Theming

The library uses CSS variables for theming. You can customize the appearance by modifying the CSS variables in your global styles:

```css
:root {
  --primary: var(--color-blue-600);
  --primary-foreground: var(--color-white);
  /* ... other variables */
}
```

## TypeScript Support

All components are fully typed with TypeScript. Import types as needed:

```tsx
import type { ButtonProps, CardProps } from "@codefast/ui";
```

## Accessibility

All components follow WCAG 2.1 guidelines and include:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- High contrast support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/codefastlabs/codefast/blob/main/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Documentation](https://github.com/codefastlabs/codefast/tree/main/packages/ui)
- [GitHub Repository](https://github.com/codefastlabs/codefast)
- [Issues](https://github.com/codefastlabs/codefast/issues)
- [Changelog](CHANGELOG.md)
