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

## 🎨 Configuration

To enable **@codefast/ui**, import the required styles into your global CSS file (e.g., `/app/globals.css`):

```css
@import 'tailwindcss';
@import '@codefast/ui/styles.css';
@import '../node_modules/@codefast/ui/dist';

/* Dark mode configuration */
@custom-variant dark (&:where(.dark, .dark *));

/* Theme variables */
@layer base {
  :root {
    --input: var(--color-zinc-300);
    --input-hover: var(--color-zinc-400);
    --input-focus: var(--color-zinc-500);

    --border: var(--color-zinc-200);
    --ring: --alpha(var(--color-zinc-400) / 35%);

    --background: var(--color-zinc-50);
    --foreground: var(--color-zinc-950);

    --primary: var(--color-zinc-900);
    --primary-hover: var(--color-zinc-800);
    --primary-foreground: var(--color-zinc-50);

    --secondary: var(--color-zinc-200);
    --secondary-hover: var(--color-zinc-300);
    --secondary-foreground: var(--color-zinc-900);

    --destructive: var(--color-red-500);
    --destructive-hover: var(--color-red-600);
    --destructive-foreground: var(--color-red-950);

    --accent: var(--color-zinc-100);
    --accent-foreground: var(--color-zinc-900);

    --muted: var(--color-zinc-200);
    --muted-foreground: var(--color-zinc-600);

    --popover: var(--color-zinc-50);
    --popover-overlay: --alpha(var(--color-zinc-900) / 35%);
    --popover-foreground: var(--color-zinc-900);

    --card: var(--color-zinc-50);
    --card-foreground: var(--color-zinc-900);

    --chart-1: var(--color-orange-400);
    --chart-2: var(--color-cyan-400);
    --chart-3: var(--color-lime-400);
    --chart-4: var(--color-yellow-400);
    --chart-5: var(--color-fuchsia-400);
  }

  /* Dark mode */
  .dark {
    --input: var(--color-zinc-800);
    --input-hover: var(--color-zinc-700);
    --input-focus: var(--color-zinc-600);

    --border: var(--color-zinc-800);
    --ring: --alpha(var(--color-zinc-600) / 35%);

    --background: var(--color-zinc-950);
    --foreground: var(--color-zinc-50);

    --primary: var(--color-zinc-100);
    --primary-hover: var(--color-zinc-200);
    --primary-foreground: var(--color-zinc-950);

    --secondary: var(--color-zinc-800);
    --secondary-hover: var(--color-zinc-700);
    --secondary-foreground: var(--color-zinc-100);

    --destructive: var(--color-red-500);
    --destructive-hover: var(--color-red-400);
    --destructive-foreground: var(--color-red-50);

    --accent: var(--color-zinc-900);
    --accent-foreground: var(--color-zinc-100);

    --muted: var(--color-zinc-800);
    --muted-foreground: var(--color-zinc-400);

    --popover: var(--color-zinc-950);
    --popover-overlay: --alpha(var(--color-zinc-100) / 35%);
    --popover-foreground: var(--color-zinc-100);

    --card: var(--color-zinc-950);
    --card-foreground: var(--color-zinc-100);

    --chart-1: var(--color-orange-600);
    --chart-2: var(--color-cyan-600);
    --chart-3: var(--color-lime-600);
    --chart-4: var(--color-yellow-600);
    --chart-5: var(--color-fuchsia-600);
  }
}
```

## Usage

**@codefast/ui** provides a range of prebuilt components that integrate seamlessly into your application.

Example usage of the **Button** component:

```tsx
import { Button } from '@codefast/ui';

export default function Home() {
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
