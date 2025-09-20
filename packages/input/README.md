# Input

Accessible input component built with React and Radix UI for creating interactive form controls with full keyboard navigation support and advanced features like loading states, prefix/suffix elements.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast-ui/input.svg)](https://www.npmjs.com/package/@codefast-ui/input)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)

## Installation

Install the component via pnpm (recommended):

```bash
pnpm add @codefast-ui/input
```

Or using npm:

```bash
npm install @codefast-ui/input
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
import { Input, InputField } from "@codefast-ui/input";

function App() {
  return (
    <Input>
      <InputField placeholder="Enter your name" />
    </Input>
  );
}
```

## Usage

### Basic Input

```tsx
import { Input, InputField } from "@codefast-ui/input";

function BasicExample() {
  return (
    <Input className="rounded-md border p-2">
      <InputField placeholder="Basic input" type="text" />
    </Input>
  );
}
```

### Input with Prefix and Suffix

```tsx
import { Input, InputField } from "@codefast-ui/input";

function PrefixSuffixExample() {
  return (
    <Input className="rounded-md border p-2" prefix={<span>$</span>} suffix={<span>.00</span>}>
      <InputField placeholder="0" type="number" />
    </Input>
  );
}
```

### Loading State

```tsx
import { useState } from "react";
import { Input, InputField } from "@codefast-ui/input";

function LoadingExample() {
  const [loading, setLoading] = useState(false);

  return (
    <Input
      className="rounded-md border p-2"
      loading={loading}
      spinner={<div className="spinner">Loading...</div>}
      loaderPosition="suffix"
    >
      <InputField placeholder="Search..." onChange={() => setLoading(true)} />
    </Input>
  );
}
```

### Disabled and Read-only States

```tsx
import { Input, InputField } from "@codefast-ui/input";

function StateExample() {
  return (
    <div className="space-y-4">
      <Input className="rounded-md border p-2" disabled>
        <InputField placeholder="Disabled input" />
      </Input>

      <Input className="rounded-md border p-2" readOnly>
        <InputField value="Read-only value" />
      </Input>
    </div>
  );
}
```

### File Input

```tsx
import { Input, InputField } from "@codefast-ui/input";

function FileExample() {
  return (
    <Input className="rounded-md border p-2" suffix={<button>Browse</button>}>
      <InputField type="file" accept="image/*" />
    </Input>
  );
}
```

### Alternative API using Root and Field

```tsx
import { Root, Field } from "@codefast-ui/input";

function AlternativeExample() {
  return (
    <Root className="rounded-md border p-2">
      <Field placeholder="Using Root and Field" />
    </Root>
  );
}
```

## Props

### Input Props

| Prop             | Type                   | Default     | Description                              |
| ---------------- | ---------------------- | ----------- | ---------------------------------------- |
| `className`      | `string`               | `undefined` | CSS class name for the input container   |
| `prefix`         | `ReactNode`            | `undefined` | Element to display before the input      |
| `suffix`         | `ReactNode`            | `undefined` | Element to display after the input       |
| `spinner`        | `ReactNode`            | `undefined` | Custom spinner element for loading state |
| `disabled`       | `boolean`              | `false`     | Whether the input is disabled            |
| `readOnly`       | `boolean`              | `false`     | Whether the input is in read-only mode   |
| `loading`        | `boolean`              | `false`     | Whether the input is in loading state    |
| `loaderPosition` | `"prefix" \| "suffix"` | `"prefix"`  | Position of the loading spinner          |
| `children`       | `ReactNode`            | `undefined` | Child elements (typically InputField)    |

### InputField Props

| Prop           | Type                                             | Default     | Description                  |
| -------------- | ------------------------------------------------ | ----------- | ---------------------------- |
| `type`         | `string`                                         | `"text"`    | HTML input type              |
| `placeholder`  | `string`                                         | `undefined` | Placeholder text             |
| `value`        | `string`                                         | `undefined` | Input value (controlled)     |
| `defaultValue` | `string`                                         | `undefined` | Default value (uncontrolled) |
| `onChange`     | `(event: ChangeEvent<HTMLInputElement>) => void` | `undefined` | Change event handler         |
| `onFocus`      | `(event: FocusEvent<HTMLInputElement>) => void`  | `undefined` | Focus event handler          |
| `onBlur`       | `(event: FocusEvent<HTMLInputElement>) => void`  | `undefined` | Blur event handler           |

_Note: InputField accepts all standard HTML input attributes._

## API Reference

### `InputProps`

Main interface for Input component.

```typescript
interface InputVisualProps {
  className?: string;
  prefix?: ReactNode;
  spinner?: ReactNode;
  suffix?: ReactNode;
}

interface InputBehaviorProps {
  disabled?: boolean;
  loaderPosition?: "prefix" | "suffix";
  loading?: boolean;
  readOnly?: boolean;
}

type InputProps = PropsWithChildren<InputBehaviorProps & InputVisualProps>;
```

### `InputFieldProps`

Interface for InputField component.

```typescript
type InputFieldProps = ComponentProps<"input">;
```

### Context API

The Input component uses Radix UI's context system internally:

```typescript
interface InputContextValue {
  inputRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  readOnly?: boolean;
}
```

### Component Aliases

- `Root` = `Input` (container component)
- `Field` = `InputField` (input element component)

### Keyboard Navigation

- **Tab**: Move focus to/from input
- **Enter**: Submit form (if inside form)
- **Escape**: Clear focus (browser default)
- **Arrow Keys**: Move cursor within input
- **File Input Special Behavior**: Clicking container opens file dialog

### Accessibility Features

- Full keyboard navigation support
- Proper ARIA attributes
- Screen reader compatibility
- Focus management for container clicks
- Disabled and read-only state handling

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

# Development mode for input component
pnpm dev --filter=@codefast-ui/input

# Run tests
pnpm test --filter=@codefast-ui/input

# Run tests with coverage
pnpm test:coverage --filter=@codefast-ui/input

# Lint and format
pnpm lint:fix
pnpm format
```

5. Commit and submit a pull request.

See details at [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Contact

- npm: [@codefast-ui/input](https://www.npmjs.com/package/@codefast-ui/input)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [Component Docs](https://github.com/codefastlabs/codefast/tree/main/packages/input)

## Accessibility

This component follows WAI-ARIA standards and provides full keyboard navigation support. It includes:

- Proper focus management
- Screen reader compatibility
- Keyboard accessibility
- Support for disabled and read-only states
- File input special handling
