# @codefast/ui

Core UI components library built with React, Tailwind CSS, and Radix UI for creating modern, accessible, and customizable user interfaces with a comprehensive design system.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/ui.svg)](https://www.npmjs.com/package/@codefast/ui)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/ui.svg)](https://www.npmjs.com/package/@codefast/ui)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@codefast/ui)](https://bundlephobia.com/package/@codefast/ui)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Components](#components)
  - [Layout](#layout)
  - [Form](#form)
  - [Navigation](#navigation)
  - [Overlay](#overlay)
  - [Data Display](#data-display)
- [Usage Examples](#usage-examples)
- [Theming and Customization](#theming-and-customization)
- [API Reference](#api-reference)
- [Accessibility](#accessibility)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Overview

`@codefast/ui` provides **60+ accessible components** for building production-grade user interfaces. Every component is built on [Radix UI](https://radix-ui.com/) primitives, styled with [Tailwind CSS 4](https://tailwindcss.com/), and fully typed with TypeScript.

**Key features:**

- **60+ Components** -- Layout, form, navigation, overlay, and data display categories.
- **Accessible by Default** -- WAI-ARIA compliant with keyboard navigation and screen reader support.
- **Fully Typed** -- Complete TypeScript definitions for all components and props.
- **Customizable** -- Extend styles with Tailwind CSS utility classes or Tailwind Variants.
- **Tree-shakeable** -- Import only the components you use.

## Installation

```bash
pnpm add @codefast/ui
```

Or using npm:

```bash
npm install @codefast/ui
```

**Peer dependencies:**

```bash
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
```

**Styling:**

Import the CSS styles in your application entry point:

```tsx
import '@codefast/ui/css/style.css';
```

**Requirements:**

- Node.js >= 20.0.0
- React >= 19.0.0
- TypeScript >= 5.9.2 (recommended)

## Quick Start

```tsx
import '@codefast/ui/css/style.css';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@codefast/ui';

function App() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Welcome to CodeFast UI</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">A comprehensive UI components library built with React and Tailwind CSS.</p>
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

## Components

### Layout

| Component   | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| Card        | Content container with header, content, and footer sections |
| Separator   | Visual divider between content sections                     |
| AspectRatio | Maintain consistent aspect ratios for media content         |

### Form

| Component  | Description                                         |
| ---------- | --------------------------------------------------- |
| Button     | Interactive button with multiple variants and sizes |
| Input      | Text input with validation support                  |
| Checkbox   | Individual checkbox and checkbox groups             |
| RadioGroup | Radio button group for single selection             |
| Select     | Dropdown selection component                        |
| Switch     | Toggle switch for boolean values                    |
| Slider     | Range input slider                                  |
| Label      | Form label with accessibility features              |

### Navigation

| Component      | Description                            |
| -------------- | -------------------------------------- |
| Breadcrumb     | Navigation breadcrumb trail            |
| NavigationMenu | Complex navigation menus with submenus |
| Menubar        | Application menu bar                   |
| Tabs           | Tabbed interface with content panels   |

### Overlay

| Component   | Description                          |
| ----------- | ------------------------------------ |
| Dialog      | Modal dialog and popup               |
| AlertDialog | Confirmation and alert dialog        |
| Popover     | Contextual popover                   |
| Tooltip     | Informational tooltip                |
| HoverCard   | Rich hover card with preview content |

### Data Display

| Component | Description                      |
| --------- | -------------------------------- |
| Avatar    | User profile image with fallback |
| Badge     | Status indicator and label       |
| Alert     | System message and notification  |
| Progress  | Progress indicator               |
| Accordion | Expandable content sections      |
| Calendar  | Date selection calendar          |
| Carousel  | Content carousel and slider      |

## Usage Examples

### Form Components

```tsx
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@codefast/ui';
import { useState } from 'react';

function ContactForm() {
  const [email, setEmail] = useState('');

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button className="w-full">Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Navigation Components

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@codefast/ui';

function TabExample() {
  return (
    <Tabs defaultValue="account" className="w-96">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="mt-4">
        <p>Make changes to your account here.</p>
      </TabsContent>
      <TabsContent value="password" className="mt-4">
        <p>Change your password here.</p>
      </TabsContent>
    </Tabs>
  );
}
```

### Overlay Components

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from '@codefast/ui';

function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">{/* Form content */}</div>
      </DialogContent>
    </Dialog>
  );
}
```

## Theming and Customization

The library integrates with `@codefast/theme` for theme management:

```tsx
import { ThemeProvider } from '@codefast/theme';

function App() {
  return (
    <ThemeProvider theme="system">
      <div className="bg-background text-foreground min-h-screen">{/* Your app content */}</div>
    </ThemeProvider>
  );
}
```

All components use CSS custom properties for theming, so you can customize colors, spacing, and other design tokens through your Tailwind CSS configuration.

## API Reference

### Common Props

Most components accept these common props:

| Prop        | Type              | Default     | Description            |
| ----------- | ----------------- | ----------- | ---------------------- |
| `className` | `string`          | `undefined` | Additional CSS classes |
| `children`  | `React.ReactNode` | `undefined` | Child elements         |

### TypeScript Support

All components export their prop types for use in custom wrappers:

```tsx
import type { ButtonProps, CardProps, InputProps } from '@codefast/ui';

function MyCustomButton(props: ButtonProps) {
  return <Button {...props} />;
}
```

### Component Prop Types

**Layout:** `CardProps`, `SeparatorProps`, `AspectRatioProps`

**Form:** `ButtonProps`, `InputProps`, `LabelProps`, `CheckboxProps`, `RadioGroupProps`, `SelectProps`, `SwitchProps`, `SliderProps`

**Navigation:** `TabsProps`, `NavigationMenuProps`, `BreadcrumbProps`, `MenubarProps`

**Overlay:** `DialogProps`, `AlertDialogProps`, `PopoverProps`, `TooltipProps`, `HoverCardProps`

## Accessibility

All components follow [WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/) guidelines and provide:

- **Keyboard Navigation** -- Full keyboard support for all interactive elements.
- **Screen Reader Support** -- Proper ARIA labels and descriptions.
- **Focus Management** -- Logical focus order and visible focus indicators.
- **High Contrast** -- Support for high contrast themes.
- **Reduced Motion** -- Respects the `prefers-reduced-motion` media query.

### Keyboard Shortcuts

| Key                 | Action                                |
| ------------------- | ------------------------------------- |
| `Tab` / `Shift+Tab` | Navigate between focusable elements   |
| `Enter` / `Space`   | Activate buttons and controls         |
| `Arrow Keys`        | Navigate within component groups      |
| `Escape`            | Close overlays and cancel actions     |
| `Home` / `End`      | Navigate to first/last items in lists |

## Browser Compatibility

`@codefast/ui` supports all modern browsers:

| Browser | Version         |
| ------- | --------------- |
| Chrome  | Last 2 versions |
| Firefox | Last 2 versions |
| Safari  | Last 2 versions |
| Edge    | Last 2 versions |

> Internet Explorer is not supported.

## Contributing

We welcome contributions! Please see the [contributing guide](../../README.md#contributing) in the root of this repository for detailed instructions.

For package-specific development:

```bash
# Development mode
pnpm dev --filter=@codefast/ui

# Run tests
pnpm test --filter=@codefast/ui

# Run tests with coverage
pnpm test:coverage --filter=@codefast/ui
```

### Adding New Components

1. Create component files in `src/components/[component-name]/`.
2. Export the component and types from the package entry point.
3. Add comprehensive tests.
4. Update documentation.
5. Submit a pull request.

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and version history.
