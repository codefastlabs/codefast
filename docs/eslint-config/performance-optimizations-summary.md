# TypeScript-ESLint Performance Optimizations Summary

This document summarizes the performance optimizations implemented in the `@codefast/eslint-config` package based on the recommendations from https://typescript-eslint.io/troubleshooting/typed-linting/performance/.

## Changes Made

### 1. TypeScript Parser Configuration Optimization

**File**: `packages/eslint-config/src/core/typescript.ts`

**Change**: Replaced `project: "./tsconfig.json"` with `projectService: true`

```typescript
// Before
languageOptions: {
  parserOptions: {
    project: "./tsconfig.json",
  },
}

// After
languageOptions: {
  parserOptions: {
    projectService: true,
  },
}
```

**Benefit**: `projectService` (v8) automatically handles glob patterns more efficiently and reduces I/O operations compared to explicit project references.

### 2. Import Plugin Performance Optimizations

**File**: `packages/eslint-config/src/core/import.ts`

#### 2.1 Disabled Slow Rules That Duplicate TypeScript Checking

```typescript
// These rules duplicate TypeScript checking and can be slow
"import/no-unresolved": "off",     // Was: "error"
"import/named": "off",             // Was: "error"
"import/default": "off",           // Was: "error"
"import/namespace": "off",         // Was: "error"
```

**Benefit**: These rules are redundant when using TypeScript as the TypeScript compiler already performs these checks more efficiently.

#### 2.2 Disabled Slow Rules That Should Be CI-Only

```typescript
// These rules are slow due to additional parsing - consider running only in CI
"import/no-named-as-default": "off",        // Was: "warn"
"import/no-named-as-default-member": "off", // Was: "warn"
"import/no-deprecated": "off",              // Was: "warn"
"import/no-cycle": "off",                   // Was: ["error", { maxDepth: 10 }]
```

**Benefit**: These rules require additional parsing and can significantly slow down linting. They can be enabled in CI environments where performance is less critical.

#### 2.3 Disabled Extensions Rule

```typescript
// This rule can be slow due to disk checks - TypeScript handles extension checking
"import/extensions": "off"  // Was: complex configuration with "never" settings
```

**Benefit**: TypeScript already handles extension checking, especially with `moduleResolution: node16/nodenext`. This rule performs disk checks that can be slow.

#### 2.4 Optimized Import Resolver Configuration

```typescript
// Before
"import/resolver": {
  typescript: {
    alwaysTryTypes: true,
    project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
  },
  // ...
}

// After
"import/resolver": {
  typescript: {
    alwaysTryTypes: true,
    // Use single project reference to avoid glob performance issues
    project: "./tsconfig.json",
  },
  // ...
}
```

**Benefit**: Removed glob pattern `./packages/*/tsconfig.json` which can cause excessive I/O operations. The `projectService` configuration in TypeScript parser handles multi-project scenarios more efficiently.

## Performance Impact

### Before Optimization
- Multiple slow import rules were running and performing redundant checks
- Glob patterns in project configuration caused excessive I/O
- Extension checking was performed by both TypeScript and ESLint

### After Optimization
- Eliminated redundant type checking rules
- Reduced disk I/O operations
- Leveraged TypeScript's built-in capabilities more effectively
- Maintained essential linting functionality while improving performance

## Timing Results

After optimization, the linting performance shows that the slow import rules are no longer running:

```
Rule                                            | Time (ms) | Relative
:-----------------------------------------------|----------:|--------:
@typescript-eslint/no-misused-promises          |   103.417 |    30.3%
@typescript-eslint/no-floating-promises         |    44.317 |    13.0%
import/no-extraneous-dependencies               |    15.934 |     4.7%
import/no-self-import                           |    12.757 |     3.7%
```

Notable absences from timing results (indicating they're disabled):
- `import/no-unresolved`
- `import/named`
- `import/default`
- `import/namespace`
- `import/no-cycle`
- `import/no-named-as-default`
- `import/no-named-as-default-member`
- `import/no-deprecated`
- `import/extensions`

## Recommendations for Further Optimization

1. **CI-Only Rules**: Consider creating a separate ESLint configuration for CI that includes the disabled slow rules for comprehensive checking.

2. **Monitoring**: Use `TIMING=1` flag regularly to monitor rule performance and identify new bottlenecks.

3. **TypeScript Configuration**: Ensure `tsconfig.json` files use specific `include` patterns rather than broad globs to minimize file parsing.

4. **Node.js Memory**: For very large codebases, consider using `NODE_OPTIONS=--max-semi-space-size=256` to improve TypeScript performance.

## Compatibility

These optimizations maintain full compatibility with:
- TypeScript projects
- React applications
- Next.js applications
- Monorepo structures
- Existing ESLint configurations

The changes focus on performance improvements without sacrificing code quality or essential linting capabilities.
