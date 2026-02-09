<h1 align="center">CodeFast</h1>

<!-- Build & Deploy -->
<p align="center">
  <a href="https://github.com/codefastlabs/codefast/actions/workflows/release.yml"><img src="https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg?branch=main" alt="Release"></a>
  <a href="https://codecov.io/gh/codefastlabs/codefast"><img src="https://img.shields.io/codecov/c/github/codefastlabs/codefast" alt="Test Coverage"></a>
</p>

<!-- Package -->
<p align="center">
  <a href="https://www.npmjs.com/package/@codefast/ui"><img src="https://img.shields.io/npm/v/@codefast/ui" alt="NPM Version"></a>
  <a href="https://bundlephobia.com/package/@codefast/ui"><img src="https://img.shields.io/bundlephobia/minzip/@codefast/ui" alt="Bundle Size"></a>
  <a href="https://www.npmjs.com/package/@codefast/ui"><img src="https://img.shields.io/npm/dm/@codefast/ui" alt="NPM Downloads"></a>
  <a href="https://github.com/codefastlabs/codefast/tags"><img src="https://img.shields.io/github/v/tag/codefastlabs/codefast" alt="GitHub tag"></a>
</p>

<!-- Tech Stack -->
<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-blue" alt="React"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript"></a>
  <a href="https://www.radix-ui.com/primitives"><img src="https://img.shields.io/badge/Radix_UI-1-blue" alt="Radix UI"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css&logoColor=white" alt="TailwindCSS"></a>
  <a href="https://tanstack.com/start"><img src="https://img.shields.io/badge/TanStack_Start-1-orange" alt="TanStack Start"></a>
</p>

<!-- Community -->
<p align="center">
  <a href="https://github.com/codefastlabs/codefast/blob/main/LICENSE"><img src="https://img.shields.io/github/license/codefastlabs/codefast" alt="License"></a>
  <a href="https://github.com/codefastlabs/codefast/graphs/contributors"><img src="https://img.shields.io/github/contributors/codefastlabs/codefast" alt="Contributors"></a>
  <a href="https://github.com/codefastlabs/codefast/issues"><img src="https://img.shields.io/github/issues-raw/codefastlabs/codefast" alt="Open Issues"></a>
  <a href="https://github.com/codefastlabs/codefast/stargazers"><img src="https://img.shields.io/github/stars/codefastlabs/codefast" alt="GitHub Stars"></a>
</p>

---

## Introduction

CodeFast is a **monorepo** containing a production-ready UI component library and supporting tools for building modern web applications. The core package, `@codefast/ui`, provides **60+ accessible components** built on **Radix UI** primitives, styled with **Tailwind CSS 4**, and fully typed with **TypeScript**.

## Packages

| Package | Description |
| --- | --- |
| [`@codefast/ui`](packages/ui) | 60+ accessible UI components built on Radix UI primitives |
| [`@codefast/tailwind-variants`](packages/tailwind-variants) | Type-safe variant API for Tailwind CSS (4-7x faster than tailwind-variants) |
| [`@codefast/theme`](packages/theme) | Theme management with React 19 features (optimistic updates, cross-tab sync) |
| [`@codefast/eslint-config`](packages/eslint-config) | Shared ESLint 9 configuration with presets for React, Next.js, and libraries |
| [`@codefast/typescript-config`](packages/typescript-config) | Shared TypeScript configuration presets |

| App | Description |
| --- | --- |
| [`@apps/docs`](apps/docs) | Documentation and component showcase site (TanStack Start) |

## Getting Started

Install the UI component library in your project:

```bash
pnpm add @codefast/ui
```

Then import and use components:

```tsx
import { Button } from '@codefast/ui';

export default function App() {
  return <Button variant="outline">Click me</Button>;
}
```

## Objectives

- **Reusability** -- Versatile UI components that work across multiple projects.
- **Flexible Customization** -- Override or extend default styles with Tailwind Variants.
- **High Performance** -- Optimized for fast loading and minimal bundle size.
- **Clear Codebase** -- Modern, readable, and easy-to-maintain structure.

## Local Development

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** 10.25.0

### Setup

```bash
# Clone the repository
git clone https://github.com/codefastlabs/codefast.git
cd codefast

# Install dependencies and build packages
pnpm install && pnpm build:packages
```

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps and packages in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm test` | Run tests across the monorepo |
| `pnpm test:coverage` | Run tests with coverage reports |
| `pnpm lint` | Lint all packages |
| `pnpm lint:fix` | Lint and auto-fix all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm check-types` | Run TypeScript type checking |
| `pnpm clean` | Clean build artifacts, cache, and node_modules |

## Technologies Used

- **React 19** -- Component framework with hooks, server components, and optimistic updates.
- **TypeScript 5** -- Static type checking for safer, more maintainable code.
- **Tailwind CSS 4** -- Utility-first CSS framework for rapid UI development.
- **Radix UI** -- Unstyled, accessible primitives for building UI components.
- **TanStack Start** -- Full-stack React framework powering the documentation site.
- **Turbo** -- High-performance monorepo build system with caching.
- **pnpm** -- Fast, disk space efficient package manager.
- **Changesets** -- Versioning and changelog management for monorepo packages.
- **Zod** -- TypeScript-first schema validation.

## Contributing

Contributions are welcome! Here's how to get started:

1. [Fork](https://github.com/codefastlabs/codefast/fork) the repository.
2. Create your feature branch: `git checkout -b feat/my-feature`.
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/).
4. Push to your branch and open a [Pull Request](https://github.com/codefastlabs/codefast/pulls).

Please check the [open issues](https://github.com/codefastlabs/codefast/issues) for ideas on where to contribute.

## License

This project is licensed under the [MIT License](LICENSE).
