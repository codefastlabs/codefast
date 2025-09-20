# Checkbox Group

Accessible checkbox group component built with React and Radix UI for creating interactive form controls with full keyboard navigation support.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast-ui/checkbox-group.svg)](https://www.npmjs.com/package/@codefast-ui/checkbox-group)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)

## Installation

Install the component via pnpm (recommended):

```bash
pnpm add @codefast-ui/checkbox-group
```

Or using npm:

```bash
npm install @codefast-ui/checkbox-group
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
- TypeScript version 5.0.0 or higher (recommended)

## Quick Start

```tsx
import { CheckboxGroup } from "@codefast-ui/checkbox-group";

function App() {
  return (
    <CheckboxGroup>
      <CheckboxGroup.Item value="item1">
        <CheckboxGroup.Indicator />
        Option 1
      </CheckboxGroup.Item>
      <CheckboxGroup.Item value="item2">
        <CheckboxGroup.Indicator />
        Option 2
      </CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

## Usage

### Controlled Usage

```tsx
import { useState } from "react";
import { CheckboxGroup } from "@codefast-ui/checkbox-group";

function ControlledExample() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <CheckboxGroup value={value} onValueChange={setValue}>
      <CheckboxGroup.Item value="react">
        <CheckboxGroup.Indicator />
        React
      </CheckboxGroup.Item>
      <CheckboxGroup.Item value="vue">
        <CheckboxGroup.Indicator />
        Vue
      </CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

### Uncontrolled Usage

```tsx
import { CheckboxGroup } from "@codefast-ui/checkbox-group";

function UncontrolledExample() {
  return (
    <CheckboxGroup defaultValue={["react"]}>
      <CheckboxGroup.Item value="react">
        <CheckboxGroup.Indicator />
        React
      </CheckboxGroup.Item>
      <CheckboxGroup.Item value="vue">
        <CheckboxGroup.Indicator />
        Vue
      </CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

### Required Selection

```tsx
import { CheckboxGroup } from "@codefast-ui/checkbox-group";

function RequiredExample() {
  return (
    <CheckboxGroup defaultValue={["option1"]} required>
      <CheckboxGroup.Item value="option1">
        <CheckboxGroup.Indicator />
        Required Option
      </CheckboxGroup.Item>
      <CheckboxGroup.Item value="option2">
        <CheckboxGroup.Indicator />
        Optional
      </CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

### Disabled State

```tsx
import { CheckboxGroup } from "@codefast-ui/checkbox-group";

function DisabledExample() {
  return (
    <CheckboxGroup disabled>
      <CheckboxGroup.Item value="option1">
        <CheckboxGroup.Indicator />
        Disabled Option
      </CheckboxGroup.Item>
      <CheckboxGroup.Item value="option2" disabled>
        <CheckboxGroup.Indicator />
        Individually Disabled
      </CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

### Orientation and Layout

```tsx
import { CheckboxGroup } from "@codefast-ui/checkbox-group";

function OrientationExample() {
  return (
    <CheckboxGroup orientation="horizontal" loop={false}>
      <CheckboxGroup.Item value="left">
        <CheckboxGroup.Indicator />
        Left
      </CheckboxGroup.Item>
      <CheckboxGroup.Item value="center">
        <CheckboxGroup.Indicator />
        Center
      </CheckboxGroup.Item>
      <CheckboxGroup.Item value="right">
        <CheckboxGroup.Indicator />
        Right
      </CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

## Props

### CheckboxGroup Props

| Prop            | Type                         | Default     | Description                                    |
| --------------- | ---------------------------- | ----------- | ---------------------------------------------- |
| `value`         | `string[]`                   | `undefined` | Selected values (controlled)                   |
| `defaultValue`  | `string[]`                   | `undefined` | Default values (uncontrolled)                  |
| `onValueChange` | `(value?: string[]) => void` | `undefined` | Callback when value changes                    |
| `disabled`      | `boolean`                    | `false`     | Disable the entire group                       |
| `required`      | `boolean`                    | `false`     | Whether at least one checkbox must be selected |
| `name`          | `string`                     | `undefined` | Name attribute for form field                  |
| `orientation`   | `"horizontal" \| "vertical"` | `undefined` | Orientation of the group                       |
| `dir`           | `"ltr" \| "rtl"`             | `undefined` | Direction for layout                           |
| `loop`          | `boolean`                    | `true`      | Whether focus should loop at boundaries        |

### CheckboxGroup.Item Props

| Prop       | Type      | Default  | Description                   |
| ---------- | --------- | -------- | ----------------------------- |
| `value`    | `string`  | Required | Value of the checkbox item    |
| `disabled` | `boolean` | `false`  | Whether this item is disabled |

### CheckboxGroup.Indicator Props

| Prop         | Type      | Default | Description               |
| ------------ | --------- | ------- | ------------------------- |
| `forceMount` | `boolean` | `false` | Force mount the indicator |

## API Reference

### `CheckboxGroupProps`

Main interface for CheckboxGroup component.

```typescript
interface CheckboxGroupProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value?: string[]) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  loop?: boolean;
  children: React.ReactNode;
}
```

### `CheckboxGroupItemProps`

Interface for CheckboxGroup.Item component.

```typescript
interface CheckboxGroupItemProps {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}
```

### `CheckboxGroupIndicatorProps`

Interface for CheckboxGroup.Indicator component.

```typescript
interface CheckboxGroupIndicatorProps {
  forceMount?: boolean;
  children?: React.ReactNode;
}
```

### Component Structure

```tsx
<CheckboxGroup>
  <CheckboxGroup.Item value="item1">
    <CheckboxGroup.Indicator />
    Item Label
  </CheckboxGroup.Item>
</CheckboxGroup>
```

### Alternative Import Syntax

You can also use the component aliases:

```tsx
import { Root, Item, Indicator } from "@codefast-ui/checkbox-group";

<Root>
  <Item value="item1">
    <Indicator />
    Item Label
  </Item>
</Root>;
```

### Keyboard Navigation

- **Tab**: Move focus between checkbox items
- **Space**: Toggle focused checkbox
- **Arrow Keys**: Move focus within group (based on orientation)
- **Home**: Focus first item
- **End**: Focus last item

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
pnpm dev --filter=@codefast-ui/checkbox-group

# Run tests
pnpm test --filter=@codefast-ui/checkbox-group

# Run tests with coverage
pnpm test:coverage --filter=@codefast-ui/checkbox-group

# Lint and format
pnpm lint:fix
pnpm format
```

5. Commit and submit a pull request.

See details at [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Contact

- npm: [@codefast-ui/checkbox-group](https://www.npmjs.com/package/@codefast-ui/checkbox-group)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [Component Docs](https://codefast.dev/docs/components/checkbox-group)

## Accessibility

This component follows WAI-ARIA standards and provides full keyboard navigation support. It includes:

- Proper ARIA roles and attributes
- Keyboard navigation with arrow keys
- Focus management with roving focus
- Screen reader compatibility
- High contrast mode support

Built with [Radix UI](https://www.radix-ui.com/) primitives for maximum accessibility compliance.
