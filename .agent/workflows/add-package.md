---
description: Add a new package to the monorepo
---

## 1. Create Package Directory

```bash
mkdir -p packages/<package-name>/src
```

## 2. Create package.json

Create `packages/<package-name>/package.json`:

```json
{
  "name": "@codefast/<package-name>",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "rslib build",
    "dev": "rslib build --watch",
    "lint": "TIMING=1 eslint --max-warnings 0",
    "lint:fix": "TIMING=1 eslint --max-warnings 0 --fix",
    "test": "jest"
  },
  "devDependencies": {
    "@codefast/eslint-config": "workspace:*",
    "@codefast/typescript-config": "workspace:*"
  }
}
```

## 3. Create TypeScript Config

Create `packages/<package-name>/tsconfig.json`:

```json
{
  "extends": "@codefast/typescript-config/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 4. Create ESLint Config

Create `packages/<package-name>/eslint.config.js`:

```javascript
export { libraryPreset as default } from '@codefast/eslint-config/presets/library';
```

## 5. Create rslib Config

Create `packages/<package-name>/rslib.config.ts`:

```typescript
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    { format: 'esm', dts: true },
    { format: 'cjs' },
  ],
  plugins: [pluginReact()],
  source: {
    entry: { index: './src/index.ts' },
    tsconfigPath: './tsconfig.json',
  },
});
```

## 6. Create Source Files

Create `packages/<package-name>/src/index.ts`:

```typescript
export * from './my-feature';
```

## 7. Install Dependencies

```bash
pnpm install
```

## 8. Build and Test

// turbo
```bash
pnpm --filter @codefast/<package-name> build
```

// turbo
```bash
pnpm generate:exports packages/<package-name>
```
