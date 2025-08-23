# Progress Circle

Accessible circular progress component built with React and Radix UI for creating interactive progress indicators with full keyboard navigation support, threshold-based color changes, configurable styling, and both determinate and indeterminate states.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast-ui/progress-circle.svg)](https://www.npmjs.com/package/@codefast-ui/progress-circle)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)

## Installation

Install the component via pnpm (recommended):

```bash
pnpm add @codefast-ui/progress-circle
```

Or using npm:

```bash
npm install @codefast-ui/progress-circle
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
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleIndicator,
  ProgressCircleTrack,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function App() {
  return (
    <ProgressCircleProvider value={75}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
      <ProgressCircleValue />
    </ProgressCircleProvider>
  );
}
```

## Usage

### Basic Progress Circle

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleIndicator,
  ProgressCircleTrack,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function BasicExample() {
  return (
    <ProgressCircleProvider value={60} size={64}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
      <ProgressCircleValue />
    </ProgressCircleProvider>
  );
}
```

### Custom Size and Stroke Width

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleIndicator,
  ProgressCircleTrack,
} from "@codefast-ui/progress-circle";

function CustomSizeExample() {
  return (
    <ProgressCircleProvider value={45} size={120} strokeWidth={8}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
    </ProgressCircleProvider>
  );
}
```

### With Thresholds and Color Changes

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleIndicator,
  ProgressCircleTrack,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function ThresholdExample() {
  const thresholds = [
    { value: 30, color: "#ef4444", background: "#fef2f2" },
    { value: 70, color: "#f59e0b", background: "#fffbeb" },
    { value: 100, color: "#10b981", background: "#f0fdf4" },
  ];

  return (
    <ProgressCircleProvider value={85} thresholds={thresholds} size={80}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
      <ProgressCircleValue />
    </ProgressCircleProvider>
  );
}
```

### Indeterminate State

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleIndicator,
  ProgressCircleTrack,
} from "@codefast-ui/progress-circle";

function IndeterminateExample() {
  return (
    <ProgressCircleProvider value={null}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
    </ProgressCircleProvider>
  );
}
```

### Custom Value Formatting

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleIndicator,
  ProgressCircleTrack,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function CustomFormatExample() {
  const formatValue = (value: number) => `${value} points`;

  return (
    <ProgressCircleProvider value={750} min={0} max={1000} formatValue={formatValue}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
      <ProgressCircleValue />
    </ProgressCircleProvider>
  );
}
```

### Using Aliased Components

```tsx
import { Provider, SVG, Indicator, Track, Value } from "@codefast-ui/progress-circle";

function AliasedExample() {
  return (
    <Provider value={50}>
      <SVG>
        <Track />
        <Indicator />
      </SVG>
      <Value />
    </Provider>
  );
}
```

## Props

### ProgressCircleProvider Props

| Prop          | Type                          | Default     | Description                                                |
| ------------- | ----------------------------- | ----------- | ---------------------------------------------------------- |
| `value`       | `number \| null \| undefined` | `undefined` | Current progress value (null/undefined for indeterminate)  |
| `min`         | `number`                      | `0`         | Minimum progress value                                     |
| `max`         | `number`                      | `100`       | Maximum progress value                                     |
| `size`        | `number`                      | `48`        | Size of the progress circle in pixels                      |
| `strokeWidth` | `number`                      | `4`         | Width of the progress circle's stroke in pixels            |
| `startAngle`  | `number`                      | `-90`       | Starting angle of the progress circle in degrees (0 = top) |
| `thresholds`  | `Threshold[]`                 | `undefined` | Array of threshold configurations for color changes        |
| `formatValue` | `(value: number) => string`   | `undefined` | Custom function to format the numeric value for display    |
| `id`          | `string`                      | `undefined` | Unique identifier for the progress circle component        |
| `children`    | `ReactNode`                   | -           | React children to be rendered inside the progress circle   |

### ProgressCircle Props

Extends all standard HTML `div` element props.

### ProgressCircleSVG Props

Extends all standard HTML `svg` element props.

### ProgressCircleIndicator Props

Extends all standard HTML `circle` element props.

### ProgressCircleTrack Props

Extends all standard HTML `circle` element props.

### ProgressCircleValue Props

Extends all standard HTML `span` element props.

## API Reference

### `Threshold`

Interface for defining color thresholds based on progress values.

```typescript
interface Threshold {
  /** The value at which this threshold becomes active */
  value: number;
  /** Foreground color to be applied */
  color: string;
  /** Background color to be applied */
  background: string;
}
```

### `ProgressCircleProviderProps`

Main interface for ProgressCircleProvider component.

```typescript
interface ProgressCircleProviderProps {
  children: ReactNode;
  formatValue?: (value: number) => string;
  id?: string;
  max?: number;
  min?: number;
  size?: number;
  startAngle?: number;
  strokeWidth?: number;
  thresholds?: Threshold[];
  value?: null | number;
}
```

### Component Exports

The package exports both full component names and convenient aliases:

```typescript
// Full component names
export {
  ProgressCircle,
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleIndicator,
  ProgressCircleTrack,
  ProgressCircleValue,
};

// Convenient aliases
export {
  Root, // ProgressCircle
  Provider, // ProgressCircleProvider
  SVG, // ProgressCircleSVG
  Indicator, // ProgressCircleIndicator
  Track, // ProgressCircleTrack
  Value, // ProgressCircleValue
};
```

### Accessibility Features

- **ARIA Support**: Proper `role="progressbar"` and ARIA attributes
- **Value Announcements**: Screen readers announce current progress values
- **Indeterminate State**: Proper handling for loading states
- **Keyboard Navigation**: Full keyboard accessibility support
- **Custom Labels**: Support for custom value formatting and announcements

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

# Development mode for specific component
pnpm dev --filter=@codefast-ui/progress-circle

# Run tests
pnpm test --filter=@codefast-ui/progress-circle

# Run tests with coverage
pnpm test:coverage --filter=@codefast-ui/progress-circle

# Lint and format
pnpm lint:fix
pnpm format
```

5. Commit and submit a pull request.

See details at [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

## Contact

- npm: [@codefast-ui/progress-circle](https://www.npmjs.com/package/@codefast-ui/progress-circle)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [Component Docs](https://codefast.dev/docs/components/progress-circle)

## Accessibility

This component follows WAI-ARIA standards and provides full keyboard navigation support. It includes proper `progressbar` role and value announcements for screen readers, with support for both determinate and indeterminate states.
