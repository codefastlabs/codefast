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

### Global CSS configuration

To enable **@codefast/ui**, import the required styles into your global CSS file (e.g., `/app/globals.css`):

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

### Next.js configuration

To optimize importing packages, you need to update the `next.config.ts` file in your project. Add the following configuration:

```
experimental: {
  optimizePackageImports: ['@codefast/ui'],
},
```

#### Ví dụ:

Below is an example of a complete `next.config.ts` file:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@codefast/ui"],
  },
};

export default nextConfig;
```

This configuration improves performance by optimizing the import process of libraries from `@codefast/ui`.

## Usage

**@codefast/ui** provides a range of prebuilt components that integrate seamlessly into your application.

Example usage of the **Button** component:

```tsx
import type { JSX } from "react";

import { Button } from "@codefast/ui";

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
