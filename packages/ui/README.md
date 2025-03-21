# **@codefast/ui** – A Modern and Scalable UI Component Library

**@codefast/ui** is a high-performance, customizable UI library built with **TailwindCSS**, designed to streamline the development of modern web applications. It provides a consistent design system, seamless dark mode support, and a robust component architecture for enhanced scalability and maintainability.

## Installation

Install **@codefast/ui** via **pnpm**:

```sh
pnpm add @codefast/ui
```

Or using **npm**:

```sh
npm install @codefast/ui
```

## Configuration

To enable **@codefast/ui**, import the required styles into your global CSS file (e.g., `/app/globals.css`):

```css
@import 'tailwindcss';

@import '@codefast/ui/styles.css';

@source '../../node_modules/@codefast/ui/dist';

@custom-variant dark (&:where(.dark, .dark *));

@layer base {
  :root {
    --input: oklch(0.922 0 0);
    --border: oklch(0.922 0 0);

    --ring: oklch(0.708 0 0);

    --background: #fff;
    --foreground: oklch(0.145 0 0);

    --primary: oklch(0.685 0.169 237.323);
    --primary-foreground: oklch(0.985 0 0);

    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);

    --destructive: oklch(0.577 0.245 27.325);

    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);

    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);

    --popover: #fff;
    --popover-foreground: oklch(0.145 0 0);
    --popover-overlay: oklch(0.205 0 0 / 20%);

    --card: #fff;
    --card-foreground: oklch(0.145 0 0);

    --sidebar: oklch(0.985 0 0);
    --sidebar-foreground: oklch(0.145 0 0);

    --sidebar-primary: oklch(0.685 0.169 237.323);
    --sidebar-primary-foreground: oklch(0.985 0 0);

    --sidebar-accent: oklch(0.97 0 0);
    --sidebar-accent-foreground: oklch(0.205 0 0);

    --sidebar-border: oklch(0.922 0 0);
    --sidebar-ring: oklch(0.708 0 0);

    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.609 0.126 221.723);
    --chart-4: oklch(0.666 0.179 58.318);
    --chart-5: oklch(0.769 0.188 70.08);
  }

  @variant dark {
    --input: oklch(0.371 0 0);
    --border: oklch(0.371 0 0 / 50%);

    --ring: oklch(0.556 0 0);

    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);

    --primary: oklch(0.5 0.134 242.749);
    --primary-foreground: oklch(0.985 0 0);

    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);

    --destructive: oklch(0.704 0.191 22.216);

    --accent: oklch(0.371 0 0);
    --accent-foreground: oklch(0.985 0 0);

    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);

    --popover: oklch(0.269 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --popover-overlay: oklch(0.205 0 0 / 80%);

    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);

    --sidebar: oklch(0.205 0 0);
    --sidebar-foreground: oklch(0.985 0 0);

    --sidebar-primary: oklch(0.5 0.134 242.749);
    --sidebar-primary-foreground: oklch(0.985 0 0);

    --sidebar-accent: oklch(0.269 0 0);
    --sidebar-accent-foreground: oklch(0.985 0 0);

    --sidebar-border: oklch(0.269 0 0);
    --sidebar-ring: oklch(0.439 0 0);

    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
  }
}
```

## Usage

**@codefast/ui** provides a range of prebuilt components that integrate seamlessly into your application.

Example usage of the **Button** component:

```tsx
import type { JSX } from 'react';

import { Button } from '@codefast/ui';

export default function Home(): JSX.Element {
  return <Button variant="primary">Get Started</Button>;
}
```

## Key Features

- **Fully Customizable** – Easily configure themes, colors, and component properties.
- **Dark Mode Support** – Built-in support for seamless dark mode transitions.
- **Optimized Performance** – Lightweight and designed for high-performance UI rendering.
- **Seamless Integration** – Works out-of-the-box with TailwindCSS and modern React applications.

## License

**@codefast/ui** is licensed under the **MIT License**, allowing free use in both personal and commercial projects.

---

### Enhance Your Development Workflow with **@codefast/ui**

For documentation, examples, and contributions, visit the repository.
