# @codefast/eslint-config

Shared ESLint configuration for the CodeFast monorepo, providing comprehensive linting rules and presets for JavaScript, TypeScript, React.js, Next.js, and various other technologies with modern best practices.

## Features

- 🎯 **Multiple Presets** - Ready-to-use configurations for different project types
- 🔧 **Modular Architecture** - Composable rules and environments for custom configurations
- ⚡ **Modern Standards** - Latest ESLint 9.x with flat config support
- 🚀 **Framework Support** - Specialized rules for React.js, Next.js, and Node.js
- 📝 **Multi-Language** - Support for TypeScript, JavaScript, JSON, CSS, and Markdown
- 🧪 **Testing Ready** - Jest and testing-specific configurations
- 🎨 **Code Quality** - Perfectionist sorting, import organization, and accessibility rules
- 🔒 **Type Safety** - TypeScript-specific rules and TSDoc support
- 🌐 **Universal** - Works in browser, Node.js, and test environments

## Available Configurations

### Presets (Ready-to-Use)

#### Base Preset (`basePreset`)

Foundational configuration for any JavaScript/TypeScript project:

- Core JavaScript and TypeScript rules
- Import organization and perfectionist sorting
- JSON and Markdown support
- Node.js and test environments
- TSDoc documentation rules

#### Library Preset (`libraryPreset`)

Optimized for library development:

- Extends base preset
- Additional rules for library-specific patterns
- Optimized for package publishing

#### React App Preset (`reactAppPreset`)

Complete configuration for React applications:

- All base rules plus React-specific linting
- JSX accessibility (a11y) rules
- React Hooks rules
- Browser environment support
- Includes Prettier integration

#### React App Core Preset (`reactAppPresetCore`)

Core React configuration without Prettier integration:

- Same as React App Preset but without Prettier rules
- Useful when you want to handle Prettier separately
- Can be extended with custom formatting rules

#### Next.js App Preset (`nextAppPreset`)

Tailored for Next.js applications:

- Extends React app preset
- Next.js specific rules and optimizations
- SSR/SSG considerations

### Individual Rule Sets

#### Core Rules

- `baseJavaScriptRules` - Essential JavaScript linting rules
- `typescriptRules` - TypeScript-specific rules and type checking
- `importRules` - Import/export organization and validation
- `perfectionistRules` - Code sorting and organization
- `unicornRules` - Additional code quality rules

#### Framework Rules

- `reactRules` - React component and JSX rules
- `jsxA11yRules` - Accessibility rules for JSX
- `nextRules` - Next.js specific linting rules

#### Language Support

- `cssRules` - CSS and styling rules
- `jsonRules` - JSON file validation
- `markdownRules` - Markdown file linting

#### Environment Configurations

- `nodeEnvironment` - Node.js globals and settings
- `browserEnvironment` - Browser globals and settings
- `testEnvironment` - Testing framework globals

#### Testing & Utilities

- `jestRules` - Jest testing framework rules
- `tsdocRules` - TSDoc documentation rules
- `turboRules` - Turborepo monorepo rules
- `prettierRules` - Prettier integration
- `onlyWarnRules` - Convert errors to warnings

## Installation

```bash
# Using pnpm (recommended)
pnpm add -D @codefast/eslint-config

# Using npm
npm install --save-dev @codefast/eslint-config

# Using yarn
yarn add -D @codefast/eslint-config
```

## Usage

### Quick Start with Presets

#### For Libraries

Create an `eslint.config.js` in your library package:

```javascript
import { libraryPreset } from "@codefast/eslint-config";

export default libraryPreset;
```

#### For React Applications

```javascript
import { reactAppPreset } from "@codefast/eslint-config";

export default reactAppPreset;
```

#### For React Applications (without Prettier)

```javascript
import { reactAppPresetCore } from "@codefast/eslint-config";

export default reactAppPresetCore;
```

#### For Next.js Applications

```javascript
import { nextAppPreset } from "@codefast/eslint-config";

export default nextAppPreset;
```

#### For Basic Projects

```javascript
import { basePreset } from "@codefast/eslint-config";

export default basePreset;
```

### Custom Configurations

You can compose your own configuration using individual rule sets:

```javascript
import {
  baseJavaScriptRules,
  typescriptRules,
  reactRules,
  nodeEnvironment,
  composeConfig,
} from "@codefast/eslint-config";

export default composeConfig(baseJavaScriptRules, typescriptRules, reactRules, nodeEnvironment);
```

### Advanced Customization

Override specific rules or add custom configurations:

```javascript
import { reactAppPreset } from "@codefast/eslint-config";

export default [
  ...reactAppPreset,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Override specific rules
      "@typescript-eslint/no-unused-vars": "warn",
      "react/prop-types": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      // Test-specific overrides
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
```

### Environment-Specific Configurations

```javascript
import {
  baseJavaScriptRules,
  typescriptRules,
  browserEnvironment,
  testEnvironment,
  composeConfig,
} from "@codefast/eslint-config";

export default composeConfig(baseJavaScriptRules, typescriptRules, browserEnvironment, testEnvironment);
```

## Configuration Details

### Included Plugins

This configuration includes and configures the following ESLint plugins:

- **@eslint/js** - Core JavaScript rules
- **typescript-eslint** - TypeScript support and rules
- **eslint-plugin-react** - React component rules
- **eslint-plugin-react-hooks** - React Hooks rules
- **@next/eslint-plugin-next** - Next.js specific rules
- **eslint-plugin-jsx-a11y** - JSX accessibility rules
- **eslint-plugin-import** - Import/export validation
- **eslint-plugin-perfectionist** - Code sorting and organization
- **eslint-plugin-unicorn** - Additional code quality rules
- **eslint-plugin-jest** - Jest testing rules
- **eslint-plugin-tsdoc** - TSDoc documentation rules
- **eslint-plugin-turbo** - Turborepo monorepo rules
- **@eslint/json** - JSON file support
- **@eslint/css** - CSS file support
- **@eslint/markdown** - Markdown file support

### File Type Support

- **JavaScript** (`.js`, `.mjs`, `.cjs`)
- **TypeScript** (`.ts`, `.tsx`, `.mts`, `.cts`)
- **React/JSX** (`.jsx`, `.tsx`)
- **JSON** (`.json`, `.jsonc`)
- **CSS** (`.css`)
- **Markdown** (`.md`, `.mdx`)

## Migration from Legacy ESLint

If you're migrating from ESLint 8.x or older configurations:

1. **Update ESLint**: Ensure you're using ESLint 9.x
2. **Use Flat Config**: Replace `.eslintrc.*` files with `eslint.config.js`
3. **Update Imports**: Use the new import syntax shown in examples above
4. **Remove Extends**: Flat config doesn't use `extends`, use array spreading instead

### Before (Legacy)

```json
{
  "extends": ["@codefast/eslint-config/react"],
  "rules": {
    "no-magic-numbers": "error"
  }
}
```

### After (Flat Config)

```javascript
import { reactAppPreset } from "@codefast/eslint-config";

export default [
  ...reactAppPreset,
  {
    rules: {
      "no-magic-numbers": "error",
    },
  },
];
```

## Troubleshooting

### Common Issues

#### TypeScript Path Resolution

If you encounter import resolution issues, ensure your `tsconfig.json` includes proper path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### React Version Detection

For React rules to work properly, ensure React is installed or configure the version manually:

```javascript
import { reactAppPreset } from "@codefast/eslint-config";

export default [
  ...reactAppPreset,
  {
    settings: {
      react: {
        version: "18.0",
      },
    },
  },
];
```

#### Performance Issues

For large projects, consider using ESLint's cache:

```bash
eslint --cache --cache-location .eslintcache .
```

## Contributing

This package is part of the CodeFast monorepo. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes in `packages/eslint-config/`
4. Add tests for new rules or presets
5. Run `pnpm test` to ensure all tests pass
6. Submit a pull request

## License

MIT © [Vuong Phan](https://github.com/codefastlabs)

## Related Packages

- [`@codefast/typescript-config`](../typescript-config) - TypeScript configuration presets
- [`@codefast-ui/*`](../ui) - UI component library with consistent linting
