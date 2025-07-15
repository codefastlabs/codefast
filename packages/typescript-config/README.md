# @codefast/typescript-config

Shared TypeScript configuration presets for the CodeFast monorepo, providing consistent and optimized TypeScript settings across different project types including libraries, React applications, and Next.js projects.

## Features

- 🎯 **Multiple Presets** - Tailored configurations for different project types
- 🏗️ **Extensible Base** - Common base configuration with specialized extensions
- ⚡ **Modern Standards** - Latest TypeScript features and best practices
- 🔧 **Strict Configuration** - Enhanced type safety and code quality
- 📦 **Monorepo Optimized** - Designed for monorepo development workflows
- 🚀 **Performance Focused** - Optimized compiler options for fast builds

## Available Configurations

### Base Configuration (`base.json`)

Foundational TypeScript configuration with strict settings and modern ES features:

- ES2022 target with ESNext modules
- Strict type checking enabled
- Declaration files and source maps
- Optimized for development and production builds

### Library Configuration (`library.json`)

Extends base configuration for library development:

- Composite builds support
- Incremental compilation
- Source maps and declaration maps
- Internal type stripping for clean APIs

### React Configuration (`react.json`)

Optimized for React components and applications:

- React JSX transform (`react-jsx`)
- React as JSX import source
- ES2020 target for modern React features
- Source maps for debugging

### Next.js Configuration (`next.json`)

Tailored for Next.js applications:

- Next.js plugin integration
- JSX preserve mode
- JavaScript file support
- ES2018 target for Next.js compatibility
- No emit (Next.js handles compilation)

## Installation

```bash
# Using pnpm (recommended)
pnpm add -D @codefast/typescript-config

# Using npm
npm install --save-dev @codefast/typescript-config

# Using yarn
yarn add -D @codefast/typescript-config
```

## Usage

### For Libraries

Create a `tsconfig.json` in your library package:

```json
{
  "extends": "@codefast/typescript-config/library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.spec.ts"]
}
```

### For React Applications

Create a `tsconfig.json` for React projects:

```json
{
  "extends": "@codefast/typescript-config/react.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

### For Next.js Applications

Create a `tsconfig.json` for Next.js projects:

```json
{
  "extends": "@codefast/typescript-config/next.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### For Custom Configurations

You can extend the base configuration and customize it:

```json
{
  "extends": "@codefast/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./build",
    "rootDir": "./src",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "**/*.test.ts"]
}
```

## Build Configuration

For build-specific configurations, create a separate `tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts", "**/*.stories.ts"]
}
```

## Configuration Details

### Compiler Options Explained

This section explains the meaning and purpose of each TypeScript compiler option used across our configurations.

#### Base Configuration Options (`base.json`)

**Module and Import Settings:**

- `allowImportingTsExtensions: false` - Prevents importing TypeScript files with `.ts` extensions, enforcing proper module resolution
- `allowSyntheticDefaultImports: true` - Allows default imports from modules without default exports (e.g., `import React from 'react'`)
- `esModuleInterop: true` - Enables interoperability between CommonJS and ES modules, making imports more intuitive
- `module: "ESNext"` - Uses the latest ECMAScript module system for modern bundlers
- `moduleDetection: "force"` - Forces TypeScript to treat all files as modules, preventing global scope pollution
- `moduleResolution: "node"` - Uses Node.js-style module resolution for better compatibility with Node.js and npm packages
- `resolveJsonModule: true` - Allows importing JSON files as modules with type safety

**Type Checking and Safety:**

- `strict: true` - Enables all strict type checking options for maximum type safety
- `noImplicitReturns: true` - Ensures all code paths in functions return a value when a return type is specified
- `noImplicitOverride: true` - Requires explicit `override` keyword when overriding base class methods
- `noFallthroughCasesInSwitch: true` - Prevents accidental fallthrough in switch statements
- `noUnusedLocals: true` - Reports errors for unused local variables
- `noUnusedParameters: true` - Reports errors for unused function parameters
- `forceConsistentCasingInFileNames: true` - Ensures consistent file name casing across different operating systems

**Output and Declaration:**

- `declaration: true` - Generates `.d.ts` declaration files for type definitions
- `declarationMap: true` - Creates source maps for declaration files, enabling "Go to Definition" in editors
- `incremental: false` - Disables incremental compilation in base config (overridden in specific configs)
- `noEmitOnError: true` - Prevents emitting JavaScript files when TypeScript errors are present

**Language Features:**

- `target: "ES2022"` - Compiles to ES2022, supporting modern JavaScript features
- `lib: ["DOM", "DOM.Iterable", "ESNext"]` - Includes type definitions for DOM APIs and latest ECMAScript features
- `isolatedModules: true` - Ensures each file can be transpiled independently (required for tools like Babel)
- `useDefineForClassFields: true` - Uses ECMAScript standard behavior for class field declarations
- `verbatimModuleSyntax: false` - Allows TypeScript to transform import/export syntax for better compatibility

**Performance and Optimization:**

- `skipLibCheck: true` - Skips type checking of declaration files for faster compilation

#### Library Configuration Options (`library.json`)

**Build System:**

- `composite: true` - Enables TypeScript project references for monorepo builds and incremental compilation
- `incremental: true` - Enables incremental compilation for faster subsequent builds
- `sourceMap: true` - Generates source maps for debugging compiled JavaScript

**Output Control:**

- `noEmit: false` - Allows emitting JavaScript files (overrides base config for library builds)
- `removeComments: false` - Preserves comments in output for better debugging experience
- `stripInternal: true` - Removes types marked with `@internal` from declaration files, creating cleaner public APIs

**Library-Specific:**

- `lib: ["ESNext"]` - Only includes ESNext types (removes DOM types for Node.js libraries)

#### React Configuration Options (`react.json`)

**JSX Processing:**

- `jsx: "react-jsx"` - Uses the modern React JSX transform (no need to import React in every file)
- `jsxImportSource: "react"` - Specifies React as the source for JSX runtime functions

**Build Settings:**

- `target: "ES2020"` - Targets ES2020 for modern React applications
- `moduleResolution: "node"` - Uses Node.js-style module resolution for better compatibility with npm packages
- `noEmit: false` - Allows emitting files for React builds
- `sourceMap: true` - Enables source maps for debugging React components

#### Next.js Configuration Options (`next.json`)

**Next.js Integration:**

- `allowJs: true` - Allows JavaScript files alongside TypeScript in Next.js projects
- `jsx: "preserve"` - Preserves JSX syntax for Next.js to handle during its compilation process
- `plugins: [{"name": "next"}]` - Integrates Next.js TypeScript plugin for enhanced IDE support
- `noEmit: true` - Prevents TypeScript from emitting files (Next.js handles compilation)

**Compatibility:**

- `target: "ES2018"` - Targets ES2018 for broader browser compatibility in Next.js apps
- `moduleResolution: "node"` - Uses Node.js-style module resolution for better compatibility with npm packages
- `incremental: true` - Enables incremental compilation for faster Next.js development builds

### Configuration Inheritance

Each configuration extends the base configuration and overrides specific options:

- **Library** extends base + adds composite builds, source maps, and library-specific optimizations
- **React** extends base + adds JSX support and React-specific settings
- **Next.js** extends base + adds Next.js plugin integration and framework-specific optimizations

## Best Practices

### Monorepo Setup

For monorepo packages, use project references in your root `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    {
      "path": "./packages/ui"
    },
    {
      "path": "./packages/hooks"
    },
    {
      "path": "./apps/docs"
    }
  ]
}
```

### Path Mapping

Configure consistent path mapping across your projects:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

### Development vs Production

Use different configurations for development and production builds:

```json5
// tsconfig.dev.json
{
  extends: "./tsconfig.json",
  compilerOptions: {
    incremental: true,
    tsBuildInfoFile: ".tsbuildinfo",
  },
}
```

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**: Ensure `moduleResolution` is set to `"node"` for better npm package compatibility
2. **JSX Errors**: Use the appropriate preset (`react.json` or `next.json`) for JSX projects
3. **Declaration Errors**: Check that `declaration` is enabled for library builds
4. **Path Mapping**: Verify `baseUrl` and `paths` are correctly configured

### Performance Tips

- Use `incremental: true` for faster subsequent builds
- Enable `composite: true` for project references in monorepos
- Use `skipLibCheck: true` to skip type checking of declaration files

## Contributing

This package is part of the CodeFast monorepo. For contributions, please refer to the main repository guidelines.

## License

MIT License - see the [LICENSE](../../LICENSE) file for details.

---

**@codefast/typescript-config** provides the foundation for consistent TypeScript development across the CodeFast ecosystem.
