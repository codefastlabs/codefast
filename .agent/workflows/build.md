---
description: Build packages for development or production
---

## Development Build

1. Build all packages with dependencies:
// turbo
```bash
pnpm build:packages
```

2. Or build a specific package:
```bash
pnpm --filter @codefast/<package-name> build
```

3. Watch mode for active development:
```bash
pnpm --filter @codefast/<package-name> dev
```

## Production Build

1. Build all workspaces (apps + packages):
// turbo
```bash
pnpm build
```

## Regenerate Exports

After building, regenerate package.json exports:
// turbo
```bash
pnpm generate:exports
```

Or for a single package:
```bash
pnpm generate:exports packages/<package-name>
```
