# Input Number

Accessible number input component built with React and Radix UI for creating interactive numeric form controls with full keyboard navigation support, increment/decrement buttons, locale-aware formatting, and advanced validation features.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast-ui/input-number.svg)](https://www.npmjs.com/package/@codefast-ui/input-number)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)

## Installation

Install the component via pnpm (recommended):

```bash
pnpm add @codefast-ui/input-number
```

Or using npm:

```bash
npm install @codefast-ui/input-number
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
import { InputNumber, InputNumberField } from "@codefast-ui/input-number";

function App() {
  return (
    <InputNumber>
      <InputNumberField placeholder="Enter a number" />
    </InputNumber>
  );
}
```

## Usage

### Basic Number Input

```tsx
import { InputNumber, InputNumberField } from "@codefast-ui/input-number";

function BasicExample() {
  return (
    <InputNumber>
      <InputNumberField placeholder="Enter amount" />
    </InputNumber>
  );
}
```

### Controlled Usage

```tsx
import { useState } from "react";
import { InputNumber, InputNumberField } from "@codefast-ui/input-number";

function ControlledExample() {
  const [value, setValue] = useState<number>(0);

  return (
    <InputNumber value={value} onChange={setValue}>
      <InputNumberField />
    </InputNumber>
  );
}
```

### With Increment/Decrement Buttons

```tsx
import {
  InputNumber,
  InputNumberField,
  InputNumberIncrementButton,
  InputNumberDecrementButton,
} from "@codefast-ui/input-number";

function StepperExample() {
  return (
    <InputNumber>
      <InputNumberDecrementButton>-</InputNumberDecrementButton>
      <InputNumberField placeholder="0" />
      <InputNumberIncrementButton>+</InputNumberIncrementButton>
    </InputNumber>
  );
}
```

### With Min/Max and Step

```tsx
import {
  InputNumber,
  InputNumberField,
  InputNumberIncrementButton,
  InputNumberDecrementButton,
} from "@codefast-ui/input-number";

function MinMaxStepExample() {
  return (
    <InputNumber min={0} max={100} step={5} defaultValue={10}>
      <InputNumberDecrementButton>-</InputNumberDecrementButton>
      <InputNumberField />
      <InputNumberIncrementButton>+</InputNumberIncrementButton>
    </InputNumber>
  );
}
```

### Locale-Aware Formatting

```tsx
import { InputNumber, InputNumberField } from "@codefast-ui/input-number";

function LocaleExample() {
  return (
    <InputNumber
      locale="de-DE"
      formatOptions={{
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      }}
      defaultValue={1234.56}
    >
      <InputNumberField />
    </InputNumber>
  );
}
```

### Disabled State

```tsx
import { InputNumber, InputNumberField } from "@codefast-ui/input-number";

function DisabledExample() {
  return (
    <InputNumber disabled defaultValue={42}>
      <InputNumberField />
    </InputNumber>
  );
}
```

## Props

### InputNumber Props

| Prop                 | Type                       | Default                                          | Description                           |
| -------------------- | -------------------------- | ------------------------------------------------ | ------------------------------------- |
| `value`              | `number`                   | `undefined`                                      | Current value (controlled)            |
| `defaultValue`       | `number`                   | `undefined`                                      | Default value (uncontrolled)          |
| `onChange`           | `(value?: number) => void` | `undefined`                                      | Callback when value changes           |
| `min`                | `number`                   | `undefined`                                      | Minimum allowed value                 |
| `max`                | `number`                   | `undefined`                                      | Maximum allowed value                 |
| `step`               | `number`                   | `1`                                              | Step size for increments/decrements   |
| `locale`             | `string`                   | `undefined`                                      | Locale for number formatting          |
| `formatOptions`      | `Intl.NumberFormatOptions` | `{ minimumFractionDigits: 0, style: 'decimal' }` | Number formatting options             |
| `id`                 | `string`                   | `undefined`                                      | Unique identifier for the input       |
| `ariaIncrementLabel` | `string`                   | `undefined`                                      | Accessible label for increment button |
| `ariaDecrementLabel` | `string`                   | `undefined`                                      | Accessible label for decrement button |
| `disabled`           | `boolean`                  | `false`                                          | Whether the input is disabled         |
| `readOnly`           | `boolean`                  | `false`                                          | Whether the input is read-only        |

### InputNumberField Props

| Prop          | Type                                     | Default     | Description            |
| ------------- | ---------------------------------------- | ----------- | ---------------------- |
| `placeholder` | `string`                                 | `undefined` | Placeholder text       |
| `onBlur`      | `FocusEventHandler<HTMLInputElement>`    | `undefined` | Blur event handler     |
| `onKeyDown`   | `KeyboardEventHandler<HTMLInputElement>` | `undefined` | Key down event handler |

### InputNumberIncrementButton Props

| Prop       | Type                                   | Default     | Description         |
| ---------- | -------------------------------------- | ----------- | ------------------- |
| `children` | `ReactNode`                            | `undefined` | Button content      |
| `onClick`  | `MouseEventHandler<HTMLButtonElement>` | `undefined` | Click event handler |

### InputNumberDecrementButton Props

| Prop       | Type                                   | Default     | Description         |
| ---------- | -------------------------------------- | ----------- | ------------------- |
| `children` | `ReactNode`                            | `undefined` | Button content      |
| `onClick`  | `MouseEventHandler<HTMLButtonElement>` | `undefined` | Click event handler |

## API Reference

### `InputNumberProps`

Main interface for InputNumber component.

```typescript
interface InputNumberProps extends ComponentProps<typeof InputPrimitive.Root> {
  ariaDecrementLabel?: string;
  ariaIncrementLabel?: string;
  defaultValue?: number;
  formatOptions?: Intl.NumberFormatOptions;
  id?: string;
  locale?: string;
  max?: number;
  min?: number;
  onChange?: (value?: number) => void;
  step?: number;
  value?: number;
}
```

### `InputNumberFieldProps`

Interface for InputNumberField component.

```typescript
type InputNumberFieldProps = Omit<
  ComponentProps<typeof InputPrimitive.Field>,
  | "defaultValue"
  | "disabled"
  | "id"
  | "max"
  | "min"
  | "onChange"
  | "prefix"
  | "readOnly"
  | "step"
  | "value"
>;
```

### `InputNumberIncrementButtonProps`

Interface for InputNumberIncrementButton component.

```typescript
type InputNumberIncrementButtonProps = Omit<
  ComponentProps<typeof NumberStepperButton>,
  "operation"
>;
```

### `InputNumberDecrementButtonProps`

Interface for InputNumberDecrementButton component.

```typescript
type InputNumberDecrementButtonProps = Omit<
  ComponentProps<typeof NumberStepperButton>,
  "operation"
>;
```

### Keyboard Navigation

- **Arrow Up**: Increment by step value
- **Arrow Down**: Decrement by step value
- **Page Up**: Increment to maximum value
- **Page Down**: Decrement to minimum value
- **Enter**: Format and validate current value
- **Tab**: Move focus between elements
- **Mouse Wheel**: Increment/decrement when focused (requires focus on input)

### Features

- **Accessible by Default**: Built with Radix UI primitives for WCAG compliance
- **Numeric Input Only**: Intelligent input validation that only allows numeric values
- **Keyboard Navigation**: Full keyboard support for increment/decrement operations
- **Mouse Wheel Support**: Scroll to increment/decrement when input is focused
- **Hold-to-Repeat**: Press and hold increment/decrement buttons for continuous value changes
- **Locale-Aware Formatting**: Automatic number formatting based on locale settings
- **Min/Max Constraints**: Configurable minimum and maximum value limits
- **Step Control**: Customizable step size for increments and decrements
- **Form Integration**: Full support for form reset and validation
- **TypeScript First**: Comprehensive TypeScript support with type definitions

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
pnpm dev --filter=@codefast-ui/input-number

# Run tests
pnpm test --filter=@codefast-ui/input-number

# Lint and format
pnpm lint:fix
pnpm format
```

5. Commit and submit a pull request.

See details at [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Contact

- npm: [@codefast-ui/input-number](https://www.npmjs.com/package/@codefast-ui/input-number)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Homepage: [Input Number Documentation](https://github.com/codefastlabs/codefast/tree/main/packages/input-number#readme)

## Accessibility

This component follows WAI-ARIA standards and provides full keyboard navigation support. All interactive elements are properly labeled and announce changes to screen readers. The component supports focus management and integrates seamlessly with form validation frameworks.
