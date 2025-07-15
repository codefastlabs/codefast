# @codefast-ui/checkbox-group

Accessible checkbox group component built with React and Radix UI, providing a robust solution for managing multiple checkbox selections with keyboard navigation and focus management.

## Features

- 🎯 **Accessible by Default** - Built with Radix UI primitives for WCAG compliance
- ⌨️ **Keyboard Navigation** - Full keyboard support with roving focus management
- 🎛️ **Controlled & Uncontrolled** - Supports both controlled and uncontrolled usage patterns
- 🔒 **Required Selection** - Optional enforcement of minimum selection requirements
- 🚫 **Flexible Disabling** - Disable entire group or individual items
- 🧭 **Directional Support** - RTL/LTR layout support with proper focus navigation
- 📱 **Touch Friendly** - Optimized for both desktop and mobile interactions
- 🎨 **Customizable** - Fully customizable styling and behavior
- 🔄 **Loop Navigation** - Optional focus looping at boundaries
- 📐 **Orientation Support** - Horizontal and vertical layout orientations

## Installation

```bash
# Using pnpm (recommended)
pnpm add @codefast-ui/checkbox-group

# Using npm
npm install @codefast-ui/checkbox-group

# Using yarn
yarn add @codefast-ui/checkbox-group
```

## Usage

### Basic Example

```tsx
import { CheckboxGroup, CheckboxGroupItem, CheckboxGroupIndicator } from "@codefast-ui/checkbox-group";

function BasicExample() {
  return (
    <CheckboxGroup defaultValue={["option1"]}>
      <CheckboxGroupItem value="option1">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 1
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option2">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 2
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option3">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 3
      </CheckboxGroupItem>
    </CheckboxGroup>
  );
}
```

### Controlled Usage

```tsx
import { useState } from "react";
import { CheckboxGroup, CheckboxGroupItem, CheckboxGroupIndicator } from "@codefast-ui/checkbox-group";

function ControlledExample() {
  const [selectedValues, setSelectedValues] = useState<string[]>(["option1"]);

  return (
    <CheckboxGroup value={selectedValues} onValueChange={setSelectedValues}>
      <CheckboxGroupItem value="option1">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 1
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option2">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 2
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option3">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 3
      </CheckboxGroupItem>
    </CheckboxGroup>
  );
}
```

### Required Selection

```tsx
import { CheckboxGroup, CheckboxGroupItem, CheckboxGroupIndicator } from "@codefast-ui/checkbox-group";

function RequiredExample() {
  return (
    <CheckboxGroup defaultValue={["option1"]} required>
      <CheckboxGroupItem value="option1">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 1 (Required)
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option2">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 2
      </CheckboxGroupItem>
    </CheckboxGroup>
  );
}
```

### Disabled State

```tsx
import { CheckboxGroup, CheckboxGroupItem, CheckboxGroupIndicator } from "@codefast-ui/checkbox-group";

function DisabledExample() {
  return (
    <CheckboxGroup defaultValue={["option1"]}>
      <CheckboxGroupItem value="option1">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 1
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option2" disabled>
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 2 (Disabled)
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option3">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 3
      </CheckboxGroupItem>
    </CheckboxGroup>
  );
}
```

### Horizontal Layout

```tsx
import { CheckboxGroup, CheckboxGroupItem, CheckboxGroupIndicator } from "@codefast-ui/checkbox-group";

function HorizontalExample() {
  return (
    <CheckboxGroup orientation="horizontal" className="flex gap-4">
      <CheckboxGroupItem value="option1">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 1
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option2">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 2
      </CheckboxGroupItem>
      <CheckboxGroupItem value="option3">
        <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
        Option 3
      </CheckboxGroupItem>
    </CheckboxGroup>
  );
}
```

## API Reference

### CheckboxGroup (Root)

The root container component that manages the checkbox group state and provides context to child components.

#### Props

| Prop            | Type                         | Default      | Description                                    |
| --------------- | ---------------------------- | ------------ | ---------------------------------------------- |
| `defaultValue`  | `string[]`                   | `undefined`  | Default selected values for uncontrolled usage |
| `value`         | `string[]`                   | `undefined`  | Controlled selected values                     |
| `onValueChange` | `(value?: string[]) => void` | `undefined`  | Callback fired when selection changes          |
| `disabled`      | `boolean`                    | `false`      | Whether the entire group is disabled           |
| `required`      | `boolean`                    | `false`      | Whether at least one selection is required     |
| `name`          | `string`                     | `undefined`  | Name attribute for form submission             |
| `orientation`   | `"horizontal" \| "vertical"` | `"vertical"` | Layout orientation                             |
| `dir`           | `"ltr" \| "rtl"`             | `"ltr"`      | Text direction for proper focus navigation     |
| `loop`          | `boolean`                    | `true`       | Whether focus should loop at boundaries        |

### CheckboxGroupItem (Item)

Individual checkbox item within the group.

#### Props

| Prop       | Type      | Default      | Description                            |
| ---------- | --------- | ------------ | -------------------------------------- |
| `value`    | `string`  | **Required** | Unique value identifying this checkbox |
| `disabled` | `boolean` | `false`      | Whether this specific item is disabled |

All other props from `@radix-ui/react-checkbox` Root component are supported except `checked`, `defaultChecked`, `name`, and `onCheckedChange`.

### CheckboxGroupIndicator (Indicator)

Visual indicator component that shows the checked state.

#### Props

Accepts all props from `@radix-ui/react-checkbox` Indicator component.

## Keyboard Navigation

The checkbox group supports full keyboard navigation:

- **Tab** - Move focus into/out of the group
- **Arrow Keys** - Navigate between checkbox items within the group
- **Space** - Toggle the focused checkbox
- **Home** - Focus the first checkbox (when `loop` is enabled)
- **End** - Focus the last checkbox (when `loop` is enabled)

## Accessibility

This component follows WAI-ARIA guidelines:

- Uses proper `role="group"` for the container
- Each checkbox has appropriate ARIA labels
- Supports screen readers with proper focus management
- Maintains focus visibility and keyboard navigation
- Respects `prefers-reduced-motion` for animations

## Form Integration

The checkbox group integrates seamlessly with forms:

```tsx
import { CheckboxGroup, CheckboxGroupItem, CheckboxGroupIndicator } from "@codefast-ui/checkbox-group";

function FormExample() {
  return (
    <form>
      <CheckboxGroup name="preferences" defaultValue={["email"]}>
        <CheckboxGroupItem value="email">
          <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
          Email notifications
        </CheckboxGroupItem>
        <CheckboxGroupItem value="sms">
          <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
          SMS notifications
        </CheckboxGroupItem>
        <CheckboxGroupItem value="push">
          <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
          Push notifications
        </CheckboxGroupItem>
      </CheckboxGroup>
    </form>
  );
}
```

## Styling

The component is unstyled by default, allowing for complete customization. You can style it using CSS classes, CSS-in-JS, or any styling solution:

```tsx
import { CheckboxGroup, CheckboxGroupItem, CheckboxGroupIndicator } from "@codefast-ui/checkbox-group";
import "./checkbox-styles.css";

function StyledExample() {
  return (
    <CheckboxGroup className="checkbox-group">
      <CheckboxGroupItem value="option1" className="checkbox-item">
        <CheckboxGroupIndicator className="checkbox-indicator">✓</CheckboxGroupIndicator>
        <span className="checkbox-label">Option 1</span>
      </CheckboxGroupItem>
    </CheckboxGroup>
  );
}
```

## TypeScript Support

The component is built with TypeScript and provides full type safety:

```tsx
import type { CheckboxGroupProps, CheckboxGroupItemProps } from "@codefast-ui/checkbox-group";

// Custom wrapper with typed props
interface CustomCheckboxGroupProps extends CheckboxGroupProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

function CustomCheckboxGroup({ options, ...props }: CustomCheckboxGroupProps) {
  return (
    <CheckboxGroup {...props}>
      {options.map((option) => (
        <CheckboxGroupItem key={option.value} value={option.value} disabled={option.disabled}>
          <CheckboxGroupIndicator>✓</CheckboxGroupIndicator>
          {option.label}
        </CheckboxGroupItem>
      ))}
    </CheckboxGroup>
  );
}
```

## Dependencies

This component is built on top of several Radix UI primitives:

- `@radix-ui/react-checkbox` - Core checkbox functionality
- `@radix-ui/react-context` - Context management
- `@radix-ui/react-direction` - Directional layout support
- `@radix-ui/react-roving-focus` - Focus management
- `@radix-ui/react-use-controllable-state` - State management utilities

## License

MIT License - see the [LICENSE](../../LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](../../CONTRIBUTING.md) before submitting a pull request.

## Support

For questions, issues, or feature requests, please visit our [GitHub repository](https://github.com/codefastlabs/codefast/tree/main/packages/checkbox-group).
