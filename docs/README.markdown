# README.md Writing Guide

The README.md file is an important document that helps users understand your UI component or package in a monorepo, how to install, use, and contribute to it. Below is a detailed methodology for creating a professional, clear, and comprehensive README.md file for React/TypeScript components.

## 1. Title and Brief Introduction

- **Purpose**: Provide a brief introduction to the component or package, including its name and main purpose.
- **How to write**:
  - Place the component name at the beginning of the file using a level 1 heading (#).
  - Write a short paragraph (2-3 sentences) describing what the component does, what problem it solves, and the main target users.
  - Optionally, add badges to display build status, version, or license information.
  - For UI components, clearly mention accessibility features and UI libraries being used.

**Example**:

```markdown
# Checkbox Group

Accessible checkbox group component built with React and Radix UI for creating interactive form controls with full keyboard navigation support.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast/checkbox-group.svg)](https://www.npmjs.com/package/@codefast/checkbox-group)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)
```

## 2. Installation Guide

- **Purpose**: Guide users on how to install the component or package.
- **How to write**:
  - Provide installation commands via pnpm (preferred), npm, or yarn.
  - For UI components, list necessary peer dependencies (React, React DOM).
  - Specify required Node.js version and necessary build tools.

**Example**:

```markdown
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

```

## 3. Quick Start
- **Purpose**: Help users quickly use the component with simple examples.
- **How to write**:
  - Provide concise, easy-to-understand JSX code snippets that demonstrate the main features.
  - Avoid complex props, focus on the most basic usage.
  - Use TypeScript syntax with proper imports.
  - Include CSS imports if necessary for styling.

**Example**:
```markdown
## Quick Start

```tsx
import { CheckboxGroup } from '@codefast-ui/checkbox-group';

function App() {
  return (
    <CheckboxGroup>
      <CheckboxGroup.Item value="item1">
        Option 1
      </CheckboxGroup.Item>
      <CheckboxGroup.Item value="item2">
        Option 2
      </CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

```

## 4. Usage Documentation
- **Purpose**: Provide detailed guidance on how to use the component's features.
- **How to write**:
  - Break down into subsections for each main feature.
  - Use code blocks to illustrate how to use each prop or variant.
  - Include examples of both controlled and uncontrolled usage.
  - If there are many features, consider creating separate `docs/` files and linking to them.

**Example**:
```markdown
## Usage

### Controlled Usage
```tsx
import { useState } from 'react';
import { CheckboxGroup } from '@codefast-ui/checkbox-group';

function ControlledExample() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <CheckboxGroup value={value} onValueChange={setValue}>
      <CheckboxGroup.Item value="react">React</CheckboxGroup.Item>
      <CheckboxGroup.Item value="vue">Vue</CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

### Usage with Variants

```tsx
import { CheckboxGroup } from '@codefast-ui/checkbox-group';

function VariantExample() {
  return (
    <CheckboxGroup size="lg" variant="outline">
      <CheckboxGroup.Item value="option1">Large Option</CheckboxGroup.Item>
      <CheckboxGroup.Item value="option2" disabled>
        Disabled Option
      </CheckboxGroup.Item>
    </CheckboxGroup>
  );
}
```

```

## 5. Props and Configuration
- **Purpose**: Describe the props and configuration options that the component supports.
- **How to write**:
  - List props in a table with TypeScript data types.
  - Clearly state default values and meaning of each prop.
  - Include information about required/optional props.

**Example**:
```markdown
## Props

### CheckboxGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string[]` | `undefined` | Selected values (controlled) |
| `defaultValue` | `string[]` | `[]` | Default values (uncontrolled) |
| `onValueChange` | `(value: string[]) => void` | `undefined` | Callback when value changes |
| `disabled` | `boolean` | `false` | Disable the entire group |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the checkbox |
| `variant` | `'default' \| 'outline'` | `'default'` | Display variant |
```

## 6. API Reference

- **Purpose**: Provide detailed information about the component's interfaces, types, and methods.
- **How to write**:
  - List each interface with properties, types, and descriptions.
  - Use level 3 headings (###) for each interface for better readability.
  - Include information about accessibility and keyboard navigation if available.

**Example**:

```markdown
## API Reference

### `CheckboxGroupProps`

Main interface for CheckboxGroup component.

```typescript
interface CheckboxGroupProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
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

### Keyboard Navigation

- **Tab**: Move focus between checkbox items
- **Space**: Toggle focused checkbox
- **Arrow Keys**: Move focus within group

```

## 7. Contributing
- **Purpose**: Encourage community contributions to the component or package.
- **How to write**:
  - Provide guidance on how to set up the monorepo development environment.
  - Clearly state build, test, and development workflow commands.
  - Link to `CONTRIBUTING.md` file if available.

**Example**:
```markdown
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

# Lint and format
pnpm lint:fix
pnpm format
```

5. Commit and submit a pull request.

See details at [CONTRIBUTING.md](CONTRIBUTING.md).

```

## 8. License

- **Purpose**: Inform about the library's license.
- **How to write**:
  - Mention the license type (e.g., MIT, Apache 2.0).
  - Link to the `LICENSE` file if available.

**Example**:

```markdown
## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
```

## 9. Additional Information (Optional)

- **Contact**: Provide contact methods (email, GitHub issues).
- **npm/GitHub Links**: Links to npm page and GitHub repository.
- **Storybook/Docs**: Links to documentation site or Storybook if available.
- **FAQ**: Answer common questions about accessibility or usage.

**Example**:

```markdown
## Contact

- npm: [@codefast-ui/checkbox-group](https://www.npmjs.com/package/@codefast-ui/checkbox-group)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [Component Docs](https://codefast.dev/docs/components/checkbox-group)

## Accessibility

This component follows WAI-ARIA standards and provides full keyboard navigation support.
```

## Important Notes

- **Clear and concise language**: Avoid complex terminology, ensure it's easy to understand.
- **Consistent formatting**: Use proper Markdown standards, check for spelling errors.
- **Regular updates**: Ensure README reflects the latest version of the library.
- **Verify code examples**: Ensure all code snippets in README work correctly.
- **User-friendly**: Put yourself in the position of a new user to ensure documentation is accessible.
