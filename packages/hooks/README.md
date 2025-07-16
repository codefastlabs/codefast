# @codefast/hooks

Collection of reusable React hooks for common functionality, providing robust solutions for animation, clipboard operations, responsive design, DOM observation, and pagination with TypeScript support.

## Features

- 🎯 **Animation** - Smooth value animations with easing functions
- 📋 **Clipboard** - Copy text to clipboard with feedback state
- 📱 **Responsive** - Media query and mobile detection utilities
- 👀 **DOM Observation** - Monitor DOM mutations with MutationObserver
- 📄 **Pagination** - Smart pagination logic with ellipsis handling
- 🔒 **Type Safe** - Full TypeScript support with comprehensive type definitions
- ⚡ **Performance** - Optimized with proper cleanup and memoization
- 🧪 **Well Tested** - Comprehensive test coverage for reliability
- 🌐 **SSR Ready** - Safe for server-side rendering environments

## Installation

```bash
# Using pnpm (recommended)
pnpm add @codefast/hooks

# Using npm
npm install @codefast/hooks

# Using yarn
yarn add @codefast/hooks
```

## Available Hooks

### useAnimatedValue

Smoothly animates numeric values with customizable duration and easing.

```tsx
import { useAnimatedValue } from "@codefast/hooks";

function ProgressBar({ progress }: { progress: number }) {
  const animatedProgress = useAnimatedValue(progress, 1000, true);

  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${animatedProgress}%` }} />
      <span>{animatedProgress}%</span>
    </div>
  );
}
```

**Parameters:**

- `targetValue: number | null` - The target value to animate to
- `duration: number` - Animation duration in milliseconds
- `animate?: boolean` - Whether to animate (defaults to true)

**Returns:** `number` - The current animated value (rounded)

### useCopyToClipboard

Provides clipboard functionality with temporary feedback state.

```tsx
import { useCopyToClipboard } from "@codefast/hooks";

function CopyButton({ text }: { text: string }) {
  const { copyToClipboard, isCopied } = useCopyToClipboard({
    onCopy: () => console.log("Copied!"),
    timeout: 2000,
  });

  return <button onClick={() => copyToClipboard(text)}>{isCopied ? "Copied!" : "Copy"}</button>;
}
```

**Parameters:**

- `options.onCopy?: () => void` - Callback fired after successful copy
- `options.timeout?: number` - Duration to show copied state (default: 2000ms)

**Returns:**

- `copyToClipboard: (value: string) => Promise<void>` - Function to copy text
- `isCopied: boolean` - Whether a text was recently copied

### useIsMobile

Detects if the current viewport is mobile-sized (< 768px).

```tsx
import { useIsMobile } from "@codefast/hooks";

function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return <div>{isMobile ? <MobileLayout /> : <DesktopLayout />}</div>;
}
```

**Returns:** `boolean` - True if viewport width is less than 768px

### useMediaQuery

Listens to CSS media queries and returns match status.

```tsx
import { useMediaQuery } from "@codefast/hooks";

function ThemeToggle() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  return (
    <div className={prefersDark ? "dark-theme" : "light-theme"}>
      <h1>Current theme: {prefersDark ? "Dark" : "Light"}</h1>
      <p>Screen size: {isLargeScreen ? "Large" : "Small"}</p>
    </div>
  );
}
```

**Parameters:**

- `query: string` - CSS media query string

**Returns:** `boolean` - Whether the media query matches

### useMutationObserver

Observes DOM mutations using the MutationObserver API.

```tsx
import { useMutationObserver } from "@codefast/hooks";
import { useRef } from "react";

function DynamicContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useMutationObserver(
    containerRef,
    (mutations) => {
      mutations.forEach((mutation) => {
        console.log("DOM changed:", mutation.type);
      });
    },
    {
      childList: true,
      subtree: true,
      attributes: true,
    },
  );

  return (
    <div ref={containerRef}>
      <p>This content is being observed for changes</p>
    </div>
  );
}
```

**Parameters:**

- `ref: RefObject<HTMLElement | null>` - Reference to element to observe
- `callback: MutationCallback` - Function called when mutations occur
- `options?: MutationObserverInit` - Observer configuration options

### usePagination

Calculates pagination logic with smart ellipsis handling.

```tsx
import { usePagination, ELLIPSIS } from "@codefast/hooks";

function Pagination({
  currentPage,
  totalResults,
  onPageChange,
}: {
  currentPage: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}) {
  const paginationRange = usePagination({
    currentPage,
    totalResults,
    resultsPerPage: 10,
    siblingPagesCount: 1,
  });

  return (
    <div className="pagination">
      {paginationRange.map((pageNumber, index) => (
        <button
          key={index}
          disabled={pageNumber === ELLIPSIS}
          className={pageNumber === currentPage ? "active" : ""}
          onClick={() => {
            if (typeof pageNumber === "number") {
              onPageChange(pageNumber);
            }
          }}
        >
          {pageNumber}
        </button>
      ))}
    </div>
  );
}
```

**Parameters:**

- `currentPage: number` - Current active page number
- `totalResults: number` - Total number of results
- `resultsPerPage: number` - Number of results per page
- `siblingPagesCount?: number` - Number of sibling pages to show (default: 1)

**Returns:** Array of page numbers and ellipsis indicators

**Exports:**

- `ELLIPSIS: string` - Constant for ellipsis indicator ("•••")
- `UsePaginationProps` - TypeScript interface for hook parameters

## TypeScript Support

All hooks are written in TypeScript and provide comprehensive type definitions. Import types as needed:

```tsx
import type { UsePaginationProps } from "@codefast/hooks";

const paginationConfig: UsePaginationProps = {
  currentPage: 1,
  totalResults: 100,
  resultsPerPage: 10,
  siblingPagesCount: 2,
};
```

## Browser Compatibility

These hooks are designed to work in modern browsers and include proper fallbacks for server-side rendering. The hooks gracefully handle environments where certain APIs (like `navigator.clipboard` or `matchMedia`) are not available.

## Contributing

This package is part of the CodeFast monorepo. Please refer to the main repository for contribution guidelines.

## License

MIT © [Vuong Phan](https://github.com/codefastlabs/codefast)
