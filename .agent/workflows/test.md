---
description: Run tests across packages
---

## Run All Tests

// turbo
```bash
pnpm test
```

## Run Tests for Specific Package

```bash
pnpm --filter @codefast/theme test
pnpm --filter @codefast/ui test
pnpm --filter @apps/start test
```

## Watch Mode

```bash
pnpm --filter @codefast/<package-name> test:watch
```

## Coverage Report

// turbo
```bash
pnpm test:coverage
```

## Run Single Test File

```bash
pnpm --filter @codefast/theme test -- --testPathPattern=types.test.ts
```

## Adding New Tests

1. Create test file next to source: `src/utils/my-util.test.ts`
2. Follow existing patterns:

```typescript
import { myFunction } from '@/utils/my-util';

describe('myFunction', () => {
  test('should handle expected input', () => {
    expect(myFunction('input')).toBe('expected');
  });

  test('should handle edge case', () => {
    expect(myFunction('')).toBeNull();
  });
});
```

3. Run test:
```bash
pnpm --filter @codefast/<package> test
```
