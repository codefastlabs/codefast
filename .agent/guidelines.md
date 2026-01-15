# Development Guidelines

## Project Overview

Monorepo for `@codefast/*` packages using **pnpm workspaces** and **Turborepo**. Built with React 19, TypeScript, and Tailwind CSS v4.

## Build System

### Package Builds

Packages use **rslib** for library builds outputting ESM (`.js`), CJS (`.cjs`), and type declarations (`.d.ts`).

```bash
# Build all packages (dependencies first)
pnpm build:packages

# Build single package
pnpm --filter @codefast/ui build

# Watch mode for development
pnpm --filter @codefast/theme dev
```

### Export Generation

After building, regenerate `package.json` exports:

```bash
pnpm generate:exports                    # All packages
pnpm generate:exports packages/ui        # Single package
```

## Testing

### Jest (Packages)

Packages use **Jest** with `@swc/jest` transform and `jsdom` environment.

```bash
pnpm test                                # All packages
pnpm --filter @codefast/theme test       # Single package
pnpm --filter @codefast/ui test:watch    # Watch mode
pnpm test:coverage                       # With coverage
```

**Test file patterns**: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`

**New test example** (for `packages/theme/src/utils/`):

```typescript
// packages/theme/src/utils/example.test.ts
import { myFunction } from '@/utils/example';

describe('myFunction', () => {
  test('should return expected value', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

### Vitest (Apps)

`apps/start` uses **Vitest** for testing:

```bash
pnpm --filter @apps/start test
```

## Linting & Formatting

### ESLint

Uses ESLint v9 flat config with `@codefast/eslint-config` presets:

- `libraryPreset` - For packages
- `reactPreset` - For React packages/apps
- `nextPreset` - For Next.js apps

```bash
pnpm lint                                # All workspaces
pnpm --filter @codefast/ui lint          # Single package
pnpm lint:fix                            # Auto-fix
```

### Prettier

```bash
pnpm format                              # Format all files
```

Key settings: 120 print width, single quotes, trailing commas.

## Code Style

### Commit Messages

Uses **conventional commits** with commitlint:

```
feat(ui): add new button variant
fix(theme): resolve dark mode flash
docs: update README
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

### Git Hooks

Configured via `simple-git-hooks`:

- **pre-commit**: Runs `lint-staged` (formats staged files)
- **commit-msg**: Validates commit message format

## Package Development

### Adding New Export

1. Create source file in `src/`
2. Build package: `pnpm --filter @codefast/<pkg> build`
3. Regenerate exports: `pnpm generate:exports packages/<pkg>`

### Path Aliases

Packages use `@/` alias mapping to `src/`:

```typescript
import { something } from '@/utils/helpers';
```

## Release Process

Uses **changesets** for versioning:

```bash
pnpm release                             # Create changeset
pnpm build:packages                      # Build before publish
```

Packages in `@codefast/*` scope are published with **fixed versioning**.

## Dependencies

```bash
pnpm deps:install                        # Install + build packages
pnpm deps:reinstall                      # Clean reinstall
pnpm deps:upgrade                        # Interactive upgrade
```

## Type Checking

```bash
pnpm check-types                         # All workspaces
pnpm --filter @codefast/ui check-types   # Single package
```
