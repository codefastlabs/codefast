---
description: Run linting and fix issues
---

## Lint All Workspaces

// turbo
```bash
pnpm lint
```

## Lint Specific Package

```bash
pnpm --filter @codefast/ui lint
pnpm --filter @codefast/theme lint
```

## Auto-fix Issues

// turbo
```bash
pnpm lint:fix
```

Or for specific package:
```bash
pnpm --filter @codefast/<package-name> lint:fix
```

## Format with Prettier

// turbo
```bash
pnpm format
```

## Full Check (Format + Lint)

For apps/start:
```bash
pnpm --filter @apps/start check
```

## Type Checking

// turbo
```bash
pnpm check-types
```
