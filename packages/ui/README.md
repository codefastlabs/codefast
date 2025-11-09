# UI Components Library

Core UI components library built with React, Tailwind CSS, and Radix UI for creating modern, accessible, and customizable user interfaces with a comprehensive design system.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast/ui.svg)](https://www.npmjs.com/package/@codefast/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)

## Installation

Install the component library via pnpm (recommended):

```bash
pnpm add @codefast/ui
```

Or using npm:

```bash
npm install @codefast/ui
```

**Peer Dependencies**:

Make sure you have installed the peer dependencies:

```bash
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
```

**Styling**:

Import the CSS styles in your application:

```tsx
import "@codefast/ui/styles.css";
```

**Requirements**:

- Node.js version 20.0.0 or higher
- React version 19.0.0 or higher
- TypeScript version 5.9.2 or higher (recommended)

## Quick Start

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@codefast/ui";

function App() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Welcome to CodeFast UI</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          A comprehensive UI components library built with React and Tailwind CSS.
        </p>
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

## Usage

### Components Overview

The library provides a comprehensive set of components organized into categories:

#### Layout Components

- **Box**: Flexible container component
- **Card**: Content containers with header, content, and footer sections
- **Separator**: Visual dividers between content sections
- **AspectRatio**: Maintain consistent aspect ratios for content

#### Form Components

- **Button**: Interactive buttons with various styles and sizes
- **Input**: Text input fields with validation support
- **Checkbox**: Individual checkboxes and checkbox groups
- **RadioGroup**: Radio button groups for single selection
- **Select**: Dropdown selection components
- **Switch**: Toggle switches for boolean values
- **Slider**: Range input sliders
- **Label**: Form labels with accessibility features

#### Navigation Components

- **Breadcrumb**: Navigation breadcrumbs
- **NavigationMenu**: Complex navigation menus
- **Menubar**: Application menu bars
- **Tabs**: Tabbed interfaces

#### Overlay Components

- **Dialog**: Modal dialogs and popups
- **AlertDialog**: Confirmation and alert dialogs
- **Popover**: Contextual popovers
- **Tooltip**: Informational tooltips
- **HoverCard**: Rich hover cards with content

#### Data Display Components

- **Avatar**: User profile images and fallbacks
- **Badge**: Status indicators and labels
- **Alert**: System messages and notifications
- **Progress**: Progress indicators
- **Accordion**: Expandable content sections
- **Calendar**: Date selection calendars
- **Carousel**: Content carousels and sliders

### Basic Component Usage

#### Using Form Components

```tsx
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@codefast/ui";
import { useState } from "react";

function ContactForm() {
  const [email, setEmail] = useState("");

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

#### Using Navigation Components

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui";

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

#### Using Overlay Components

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from "@codefast/ui";

function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">{/* Form content */}</div>
      </DialogContent>
    </Dialog>
  );
}
```

### Theming and Customization

The library uses Tailwind CSS for styling and supports theme customization:

```tsx
import { ThemeProvider } from "next-themes";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="bg-background text-foreground min-h-screen">{/* Your app content */}</div>
    </ThemeProvider>
  );
}
```

## API Reference

### Common Props

Most components accept these common props:

| Prop        | Type              | Default     | Description            |
| ----------- | ----------------- | ----------- | ---------------------- |
| `className` | `string`          | `undefined` | Additional CSS classes |
| `children`  | `React.ReactNode` | `undefined` | Child components       |

### Component Categories

#### Layout Components

- **Box**: `BoxProps` - Flexible container with layout utilities
- **Card**: `CardProps` - Content container with sections
- **Separator**: `SeparatorProps` - Visual divider element
- **AspectRatio**: `AspectRatioProps` - Aspect ratio container

#### Form Components

- **Button**: `ButtonProps` - Interactive button with variants
- **Input**: `InputProps` - Text input with validation
- **Label**: `LabelProps` - Form label with accessibility
- **Checkbox**: `CheckboxProps` - Boolean input control
- **RadioGroup**: `RadioGroupProps` - Single selection group
- **Select**: `SelectProps` - Dropdown selection
- **Switch**: `SwitchProps` - Boolean toggle control
- **Slider**: `SliderProps` - Range input control

#### Navigation Components

- **Tabs**: `TabsProps` - Tabbed interface container
- **NavigationMenu**: `NavigationMenuProps` - Complex navigation
- **Breadcrumb**: `BreadcrumbProps` - Navigation breadcrumbs
- **Menubar**: `MenubarProps` - Application menu bar

#### Overlay Components

- **Dialog**: `DialogProps` - Modal dialog container
- **AlertDialog**: `AlertDialogProps` - Confirmation dialog
- **Popover**: `PopoverProps` - Contextual overlay
- **Tooltip**: `TooltipProps` - Informational overlay
- **HoverCard**: `HoverCardProps` - Rich content overlay

### TypeScript Support

All components are fully typed with TypeScript. Import types alongside components:

```tsx
import type { ButtonProps, CardProps, InputProps, ComponentProps } from "@codefast/ui";

// Component props are fully typed using ComponentProps
function MyButton(props: ComponentProps<typeof Button>) {
  return <Button {...props} />;
}

// Alternative using ButtonProps
function MyCustomButton(props: ButtonProps) {
  return <Button {...props} />;
}
```

### Accessibility Features

All components follow WAI-ARIA guidelines and provide:

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus order and visual indicators
- **High Contrast**: Support for high contrast themes
- **Reduced Motion**: Respects user's motion preferences

#### Keyboard Navigation

Common keyboard shortcuts across components:

- **Tab/Shift+Tab**: Navigate between focusable elements
- **Enter/Space**: Activate buttons and controls
- **Arrow Keys**: Navigate within component groups
- **Escape**: Close overlays and cancel actions
- **Home/End**: Navigate to first/last items in lists

## Contributing

We welcome all contributions! To get started with development:

### Environment Setup

1. Fork this repository
2. Clone to your machine: `git clone <your-fork-url>`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/feature-name`

### Development Workflow

```bash
# Build all packages
pnpm build:packages

# Development mode for UI components
pnpm dev --filter=@codefast/ui

# Run tests
pnpm test --filter=@codefast/ui

# Run tests with coverage
pnpm test:coverage --filter=@codefast/ui

# Lint and format
pnpm lint:fix
pnpm format
```

### Adding New Components

1. Create component files in `src/components/[component-name]/`
2. Export component and types from `src/index.ts`
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Contact

- npm: [@codefast/ui](https://www.npmjs.com/package/@codefast/ui)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [Component Docs](https://codefast.dev/docs/components)

## Acknowledgments

This library is built on top of excellent open-source projects:

- **[Radix UI](https://radix-ui.com/)** - Accessible component primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[React Hook Form](https://react-hook-form.com/)** - Form validation
- **[Next Themes](https://github.com/pacocoursey/next-themes)** - Theme management

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and version history.
