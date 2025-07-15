# @codefast-ui/input

Accessible input component built with React and Radix UI, providing a flexible and extensible solution for text input with advanced features like loading states, prefix/suffix elements, and sophisticated focus management.

## Features

- 🎯 **Accessible by Default** - Built with Radix UI primitives for WCAG compliance
- 🔧 **Flexible Composition** - Separate Input container and InputField components for maximum flexibility
- 🎨 **Prefix & Suffix Support** - Add icons, buttons, or any content before/after the input
- ⏳ **Loading States** - Built-in loading spinner with configurable positioning
- 🎛️ **Advanced Focus Management** - Sophisticated pointer handling with flicker prevention
- 📁 **File Input Support** - Special handling for file inputs with click-to-open behavior
- 🚫 **Disabled & ReadOnly States** - Full support for disabled and read-only modes
- 🔒 **Context-Based** - Uses Radix UI context for seamless component communication
- 📱 **Touch Friendly** - Optimized for both desktop and mobile interactions
- 🔄 **Ref Composition** - Proper ref forwarding and composition with Radix utilities
- 📐 **TypeScript First** - Full TypeScript support with comprehensive type definitions
- 🧪 **Well Tested** - Comprehensive test coverage for reliability

## Installation

```bash
# Using pnpm (recommended)
pnpm add @codefast-ui/input

# Using npm
npm install @codefast-ui/input

# Using yarn
yarn add @codefast-ui/input
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
import { Input, InputField } from "@codefast-ui/input";

function BasicExample() {
  return (
    <Input className="input-container">
      <InputField placeholder="Enter your text..." />
    </Input>
  );
}
```

### With Prefix and Suffix

```tsx
import { Input, InputField } from "@codefast-ui/input";
import { SearchIcon, ClearIcon } from "your-icon-library";

function PrefixSuffixExample() {
  return (
    <Input className="input-container" prefix={<SearchIcon />} suffix={<ClearIcon />}>
      <InputField placeholder="Search..." />
    </Input>
  );
}
```

### Loading State

```tsx
import { Input, InputField } from "@codefast-ui/input";
import { Spinner } from "your-spinner-component";

function LoadingExample() {
  const [loading, setLoading] = useState(false);

  return (
    <Input className="input-container" loading={loading} spinner={<Spinner />} loaderPosition="suffix">
      <InputField placeholder="Type to search..." />
    </Input>
  );
}
```

### Disabled and ReadOnly States

```tsx
import { Input, InputField } from "@codefast-ui/input";

function StateExample() {
  return (
    <div className="space-y-4">
      {/* Disabled input */}
      <Input disabled className="input-container">
        <InputField placeholder="Disabled input" />
      </Input>

      {/* Read-only input */}
      <Input readOnly className="input-container">
        <InputField value="Read-only value" />
      </Input>
    </div>
  );
}
```

### File Input

```tsx
import { Input, InputField } from "@codefast-ui/input";
import { UploadIcon } from "your-icon-library";

function FileInputExample() {
  return (
    <Input className="file-input-container" prefix={<UploadIcon />}>
      <InputField type="file" accept="image/*" onChange={(e) => console.log(e.target.files)} />
    </Input>
  );
}
```

### Custom Styling with Data Attributes

```tsx
import { Input, InputField } from "@codefast-ui/input";

function StyledExample() {
  return (
    <Input className="custom-input">
      <InputField placeholder="Styled input" />
    </Input>
  );
}
```

```css
.custom-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 12px;
  transition: border-color 0.2s;
}

.custom-input:focus-within {
  border-color: #007bff;
  outline: 2px solid rgba(0, 123, 255, 0.25);
}

.custom-input[data-disabled="true"] {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.custom-input[data-readonly="true"] {
  background-color: #f9f9f9;
}
```

### Advanced Example with All Features

```tsx
import { useState } from "react";
import { Input, InputField } from "@codefast-ui/input";
import { SearchIcon, LoadingSpinner, ClearButton } from "your-components";

function AdvancedExample() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Search results for:", query);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setValue("");
  };

  return (
    <Input
      className="search-input"
      prefix={<SearchIcon />}
      suffix={value && !loading ? <ClearButton onClick={handleClear} /> : null}
      loading={loading}
      spinner={<LoadingSpinner />}
      loaderPosition="suffix"
    >
      <InputField
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch(value);
          }
        }}
        placeholder="Search for anything..."
      />
    </Input>
  );
}
```

## API Reference

### Input

The main container component that provides context and handles focus management.

#### Props

| Prop             | Type                   | Default    | Description                              |
| ---------------- | ---------------------- | ---------- | ---------------------------------------- |
| `className`      | `string`               | -          | CSS class name for the input container   |
| `prefix`         | `ReactNode`            | -          | Element to display before the input      |
| `suffix`         | `ReactNode`            | -          | Element to display after the input       |
| `spinner`        | `ReactNode`            | -          | Custom spinner element for loading state |
| `loading`        | `boolean`              | `false`    | Whether the input is in loading state    |
| `loaderPosition` | `"prefix" \| "suffix"` | `"prefix"` | Position of the loading spinner          |
| `disabled`       | `boolean`              | `false`    | Whether the input is disabled            |
| `readOnly`       | `boolean`              | `false`    | Whether the input is read-only           |
| `children`       | `ReactNode`            | -          | Child components (typically InputField)  |

#### Data Attributes

The Input component automatically sets data attributes for styling:

- `data-disabled`: Present when `disabled={true}`
- `data-readonly`: Present when `readOnly={true}`

### InputField

The actual input element that renders the HTML input.

#### Props

Extends all standard HTML input props (`ComponentProps<"input">`).

| Prop                       | Type     | Default  | Description               |
| -------------------------- | -------- | -------- | ------------------------- |
| `type`                     | `string` | `"text"` | HTML input type           |
| All other HTML input props | -        | -        | Standard input attributes |

**Note:** The `disabled` and `readOnly` props are automatically inherited from the parent Input component context.

### createInputScope

Utility function for creating scoped contexts when using multiple Input components.

```tsx
import { createInputScope } from "@codefast-ui/input";

const useInputScope = createInputScope();

function ScopedInputExample() {
  return (
    <Input __scopeInput={useInputScope}>
      <InputField />
    </Input>
  );
}
```

## Component Aliases

For convenience, the package also exports component aliases:

- `Root` - Alias for `Input`
- `Field` - Alias for `InputField`

```tsx
import { Root, Field } from "@codefast-ui/input";

function AliasExample() {
  return (
    <Root className="input-container">
      <Field placeholder="Using aliases" />
    </Root>
  );
}
```

## Focus Management

The Input component includes sophisticated focus management:

- **Container Click**: Clicking anywhere in the container focuses the input
- **Flicker Prevention**: Prevents focus flickering when clicking on already focused inputs
- **File Input Support**: Special handling for file inputs to trigger file selection
- **Link/Input Preservation**: Doesn't interfere with clicks on nested inputs or links

## Accessibility

- Built with Radix UI primitives for WCAG compliance
- Proper ARIA attributes and roles
- Keyboard navigation support
- Screen reader friendly
- Focus management follows accessibility best practices

## TypeScript Support

The package is written in TypeScript and provides comprehensive type definitions:

```tsx
import type { InputProps, InputFieldProps } from "@codefast-ui/input";

// Custom wrapper with typed props
interface CustomInputProps extends InputProps {
  label?: string;
  error?: string;
}

function CustomInput({ label, error, ...props }: CustomInputProps) {
  return (
    <div>
      {label && <label>{label}</label>}
      <Input {...props}>
        <InputField />
      </Input>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

## Testing

The package includes comprehensive tests covering:

- Component rendering and props
- Focus management behavior
- Loading states and spinner positioning
- Disabled and read-only states
- File input handling
- Accessibility compliance
- Context and ref composition

## License

MIT © [Vuong Phan](https://github.com/codefastlabs/codefast)
