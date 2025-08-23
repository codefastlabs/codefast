# React Hooks Collection

Collection of reusable React hooks for common functionality, built with TypeScript and comprehensive testing support.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast/hooks.svg)](https://www.npmjs.com/package/@codefast/hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)

## Installation

Install the hooks collection via pnpm (recommended):

```bash
pnpm add @codefast/hooks
```

Or using npm:

```bash
npm install @codefast/hooks
```

**Peer Dependencies**:

Make sure you have installed the peer dependencies:

```bash
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
```

**Requirements**:

- Node.js version 20.0.0 or higher
- React version 19.0.0 or higher
- TypeScript version 5.9.2 or higher (recommended)

## Quick Start

```tsx
import { useMediaQuery, useCopyToClipboard, useIsMobile } from "@codefast/hooks";

function App() {
  const isMobile = useIsMobile();
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  const handleCopy = () => {
    copyToClipboard("Hello World!");
  };

  return (
    <div>
      <p>Device: {isMobile ? "Mobile" : "Desktop"}</p>
      <p>Large screen: {isLargeScreen ? "Yes" : "No"}</p>
      <button onClick={handleCopy}>{isCopied ? "Copied!" : "Copy Text"}</button>
    </div>
  );
}
```

## Usage

### Media Query Hook

Listen to CSS media queries and get real-time updates:

```tsx
import { useMediaQuery } from "@codefast/hooks";

function ResponsiveComponent() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isLandscape = useMediaQuery("(orientation: landscape)");

  return (
    <div>
      <p>Mobile: {isMobile ? "Yes" : "No"}</p>
      <p>Dark mode: {isDarkMode ? "Yes" : "No"}</p>
      <p>Landscape: {isLandscape ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Copy to Clipboard Hook

Copy text to clipboard with state feedback:

```tsx
import { useCopyToClipboard } from "@codefast/hooks";

function CopyExample() {
  const { copyToClipboard, isCopied } = useCopyToClipboard({
    timeout: 3000, // Reset after 3 seconds
    onCopy: () => console.log("Text copied!"),
  });

  return (
    <div>
      <button onClick={() => copyToClipboard("Hello World!")}>
        {isCopied ? "Copied!" : "Copy Text"}
      </button>
    </div>
  );
}
```

### Mobile Detection Hook

Detect mobile devices using media queries:

```tsx
import { useIsMobile } from "@codefast/hooks";

function MobileAwareComponent() {
  const isMobile = useIsMobile();

  return <div>{isMobile ? <MobileNavigation /> : <DesktopNavigation />}</div>;
}
```

### Animated Value Hook

Create smooth animations between values:

```tsx
import { useAnimatedValue } from "@codefast/hooks";

function AnimatedCounter() {
  const [target, setTarget] = useState(0);
  const animatedValue = useAnimatedValue(target, {
    duration: 1000,
    easing: "easeOut",
  });

  return (
    <div>
      <p>Value: {Math.round(animatedValue)}</p>
      <button onClick={() => setTarget(target + 10)}>Increment</button>
    </div>
  );
}
```

### Mutation Observer Hook

Observe DOM mutations with ease:

```tsx
import { useRef } from "react";
import { useMutationObserver } from "@codefast/hooks";

function MutationExample() {
  const ref = useRef<HTMLDivElement>(null);

  useMutationObserver(
    ref,
    (mutations) => {
      mutations.forEach((mutation) => {
        console.log("Mutation detected:", mutation.type);
      });
    },
    {
      childList: true,
      attributes: true,
    },
  );

  return <div ref={ref}>Watch me for changes</div>;
}
```

### Pagination Hook

Handle pagination logic with ease:

```tsx
import { usePagination, ELLIPSIS } from "@codefast/hooks";

function PaginationComponent() {
  const pagination = usePagination({
    total: 100,
    page: 1,
    siblings: 1,
    boundaries: 1,
  });

  return (
    <div>
      {pagination.range.map((page, index) => (
        <button
          key={index}
          disabled={page === ELLIPSIS}
          onClick={() => page !== ELLIPSIS && pagination.setPage(page)}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
```

## API Reference

### `useMediaQuery(query: string): boolean`

Listen to CSS media query changes.

**Parameters:**

- `query`: CSS media query string

**Returns:** Boolean indicating if the media query matches

### `useCopyToClipboard(options?): { copyToClipboard, isCopied }`

Copy text to clipboard with state management.

**Options:**

- `onCopy?: () => void`: Callback when text is copied
- `timeout?: number`: Time in milliseconds before resetting copied state (default: 2000)

**Returns:**

- `copyToClipboard: (value: string) => Promise<void>`: Function to copy text
- `isCopied: boolean`: Whether text was recently copied

### `useIsMobile(): boolean`

Detect if the current device is mobile.

**Returns:** Boolean indicating if device is mobile (max-width: 768px)

### `useAnimatedValue(target, options?): number`

Animate between numeric values smoothly.

**Parameters:**

- `target: number`: Target value to animate to
- `options?: { duration?: number; easing?: string }`: Animation options

**Returns:** Current animated value

### `useMutationObserver(target, callback, options?): void`

Observe DOM mutations on a target element.

**Parameters:**

- `target: RefObject<Element>`: React ref to the target element
- `callback: (mutations: MutationRecord[]) => void`: Callback for mutations
- `options?: MutationObserverInit`: MutationObserver options

### `usePagination(props): PaginationResult`

Handle pagination logic and generate page ranges.

**Props:**

- `total: number`: Total number of items
- `page: number`: Current page number
- `siblings?: number`: Number of siblings around current page
- `boundaries?: number`: Number of boundary pages

**Returns:**

- `range: (number | typeof ELLIPSIS)[]`: Array of page numbers and ellipsis
- `active: number`: Current active page
- `setPage: (page: number) => void`: Function to change page
- `next: () => void`: Go to next page
- `previous: () => void`: Go to previous page
- `first: () => void`: Go to first page
- `last: () => void`: Go to last page

## Contributing

We welcome all contributions! To get started with development:

### Environment Setup

1. Fork this repository.
2. Clone to your machine: `git clone <your-fork-url>`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/feature-name`

### Development Workflow

```bash
# Build all packages
pnpm build:packages

# Development mode for hooks
pnpm dev --filter=@codefast/hooks

# Run tests
pnpm test --filter=@codefast/hooks

# Run tests with coverage
pnpm test:coverage --filter=@codefast/hooks

# Lint and format
pnpm lint:fix
pnpm format
```

5. Commit and submit a pull request.

See details at [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Contact

- npm: [@codefast/hooks](https://www.npmjs.com/package/@codefast/hooks)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Homepage: [Package Homepage](https://github.com/codefastlabs/codefast/tree/main/packages/hooks#readme)

## Accessibility

All hooks are designed to work seamlessly with React's accessibility features and provide no interference with screen readers or keyboard navigation. The hooks handle SSR (Server-Side Rendering) gracefully and include proper error handling for browser compatibility.
