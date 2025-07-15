# @codefast-ui/input-number

Accessible number input component built with React and Radix UI, providing a robust solution for numeric input with advanced features like increment/decrement buttons, keyboard navigation, locale-aware formatting, and sophisticated value validation.

## Features

- 🎯 **Accessible by Default** - Built with Radix UI primitives for WCAG compliance
- 🔢 **Numeric Input Only** - Intelligent input validation that only allows numeric values
- ⌨️ **Keyboard Navigation** - Arrow keys for increment/decrement, Page Up/Down for min/max
- 🖱️ **Mouse Wheel Support** - Scroll to increment/decrement when focused
- 🎛️ **Increment/Decrement Buttons** - Built-in stepper buttons with hold-to-repeat functionality
- 🌍 **Locale-Aware Formatting** - Automatic number formatting based on locale settings
- 📊 **Min/Max Constraints** - Configurable minimum and maximum value limits
- 📏 **Step Control** - Customizable step size for increments and decrements
- 🎨 **Flexible Composition** - Separate components for maximum customization flexibility
- 🔒 **Context-Based** - Uses Radix UI context for seamless component communication
- 📱 **Touch Friendly** - Optimized for both desktop and mobile interactions
- 🔄 **Controlled & Uncontrolled** - Supports both controlled and uncontrolled usage patterns
- 🚫 **Disabled & ReadOnly States** - Full support for disabled and read-only modes
- 📐 **TypeScript First** - Full TypeScript support with comprehensive type definitions
- 🧪 **Well Tested** - Comprehensive test coverage for reliability

## Installation

```bash
# Using pnpm (recommended)
pnpm add @codefast-ui/input-number

# Using npm
npm install @codefast-ui/input-number

# Using yarn
yarn add @codefast-ui/input-number
```

### Peer Dependencies

This package requires React 19+ and its types:

```bash
pnpm add react@^19.0 react-dom@^19.0
pnpm add -D @types/react@^19.0 @types/react-dom@^19.0
```

## Usage

### Basic Example

```tsx
import { InputNumber, InputNumberField } from "@codefast-ui/input-number";

function BasicExample() {
  return (
    <InputNumber>
      <InputNumberField placeholder="Enter a number..." />
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
    <div className="space-y-4">
      {/* US English formatting */}
      <InputNumber locale="en-US" formatOptions={{ style: "decimal", minimumFractionDigits: 2 }} defaultValue={1234.56}>
        <InputNumberField />
      </InputNumber>

      {/* German formatting */}
      <InputNumber locale="de-DE" formatOptions={{ style: "decimal", minimumFractionDigits: 2 }} defaultValue={1234.56}>
        <InputNumberField />
      </InputNumber>

      {/* Currency formatting */}
      <InputNumber locale="en-US" formatOptions={{ style: "currency", currency: "USD" }} defaultValue={1234.56}>
        <InputNumberField />
      </InputNumber>

      {/* Percentage formatting */}
      <InputNumber locale="en-US" formatOptions={{ style: "percent" }} defaultValue={0.1234}>
        <InputNumberField />
      </InputNumber>
    </div>
  );
}
```

### Disabled and ReadOnly States

```tsx
import {
  InputNumber,
  InputNumberField,
  InputNumberIncrementButton,
  InputNumberDecrementButton,
} from "@codefast-ui/input-number";

function StateExample() {
  return (
    <div className="space-y-4">
      {/* Disabled input */}
      <InputNumber disabled defaultValue={42}>
        <InputNumberDecrementButton>-</InputNumberDecrementButton>
        <InputNumberField />
        <InputNumberIncrementButton>+</InputNumberIncrementButton>
      </InputNumber>

      {/* ReadOnly input */}
      <InputNumber readOnly defaultValue={42}>
        <InputNumberDecrementButton>-</InputNumberDecrementButton>
        <InputNumberField />
        <InputNumberIncrementButton>+</InputNumberIncrementButton>
      </InputNumber>
    </div>
  );
}
```

### Custom Accessibility Labels

```tsx
import {
  InputNumber,
  InputNumberField,
  InputNumberIncrementButton,
  InputNumberDecrementButton,
} from "@codefast-ui/input-number";

function AccessibilityExample() {
  return (
    <InputNumber ariaIncrementLabel="Increase quantity" ariaDecrementLabel="Decrease quantity">
      <InputNumberDecrementButton>-</InputNumberDecrementButton>
      <InputNumberField aria-label="Product quantity" />
      <InputNumberIncrementButton>+</InputNumberIncrementButton>
    </InputNumber>
  );
}
```

## API Reference

### InputNumber

The root component that provides context for all child components.

#### Props

| Prop                 | Type                       | Default                                          | Description                           |
| -------------------- | -------------------------- | ------------------------------------------------ | ------------------------------------- |
| `value`              | `number`                   | `undefined`                                      | The controlled value of the input     |
| `defaultValue`       | `number`                   | `undefined`                                      | The default value when uncontrolled   |
| `onChange`           | `(value?: number) => void` | `undefined`                                      | Callback fired when the value changes |
| `min`                | `number`                   | `undefined`                                      | Minimum allowed value                 |
| `max`                | `number`                   | `undefined`                                      | Maximum allowed value                 |
| `step`               | `number`                   | `1`                                              | Step size for increments/decrements   |
| `locale`             | `string`                   | `undefined`                                      | Locale for number formatting          |
| `formatOptions`      | `Intl.NumberFormatOptions` | `{ minimumFractionDigits: 0, style: "decimal" }` | Number formatting options             |
| `ariaIncrementLabel` | `string`                   | `undefined`                                      | Accessible label for increment button |
| `ariaDecrementLabel` | `string`                   | `undefined`                                      | Accessible label for decrement button |
| `id`                 | `string`                   | `undefined`                                      | Unique identifier for the input       |
| `disabled`           | `boolean`                  | `false`                                          | Whether the input is disabled         |
| `readOnly`           | `boolean`                  | `false`                                          | Whether the input is read-only        |

### InputNumberField

The input field component that handles user input and keyboard interactions.

#### Props

Inherits all props from the underlying input element, except for those managed by the InputNumber context (`value`, `onChange`, `min`, `max`, `step`, `disabled`, `readOnly`, `id`).

### InputNumberIncrementButton

Button component for incrementing the value.

#### Props

Inherits all props from the HTML `button` element.

### InputNumberDecrementButton

Button component for decrementing the value.

#### Props

Inherits all props from the HTML `button` element.

## Keyboard Interactions

| Key           | Action                            |
| ------------- | --------------------------------- |
| `ArrowUp`     | Increment by step value           |
| `ArrowDown`   | Decrement by step value           |
| `PageUp`      | Set to maximum value              |
| `PageDown`    | Set to minimum value              |
| `Enter`       | Format and validate current value |
| `Mouse Wheel` | Increment/decrement when focused  |

## Accessibility

- Full keyboard navigation support
- ARIA labels and live regions for screen readers
- Proper focus management
- Semantic HTML structure
- Support for assistive technologies

## Examples

### Quantity Selector

```tsx
import {
  InputNumber,
  InputNumberField,
  InputNumberIncrementButton,
  InputNumberDecrementButton,
} from "@codefast-ui/input-number";

function QuantitySelector() {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="quantity">Quantity:</label>
      <InputNumber
        id="quantity"
        value={quantity}
        onChange={setQuantity}
        min={1}
        max={99}
        ariaIncrementLabel="Increase quantity"
        ariaDecrementLabel="Decrease quantity"
      >
        <InputNumberDecrementButton className="px-2 py-1 border">-</InputNumberDecrementButton>
        <InputNumberField className="w-16 text-center border" />
        <InputNumberIncrementButton className="px-2 py-1 border">+</InputNumberIncrementButton>
      </InputNumber>
    </div>
  );
}
```

### Price Input

```tsx
import { InputNumber, InputNumberField } from "@codefast-ui/input-number";

function PriceInput() {
  return (
    <InputNumber locale="en-US" formatOptions={{ style: "currency", currency: "USD" }} min={0} step={0.01}>
      <InputNumberField placeholder="$0.00" />
    </InputNumber>
  );
}
```

## License

MIT © [CodeFast Labs](https://github.com/codefastlabs)
