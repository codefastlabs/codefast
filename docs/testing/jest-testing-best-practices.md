# Jest Testing Best Practices

## Tổng quan

Tài liệu này mô tả các best practices cho việc tổ chức và cấu hình Jest testing trong dự án Codefast, bao gồm cấu trúc thư mục, alias configuration, và các quy tắc tổ chức test files.

## Cấu trúc Thư mục Test

### 1. Co-located Tests (Khuyến nghị cho packages nhỏ)

**Cấu trúc:**
```
packages/[package]/
├── src/
│   ├── components/
│   │   ├── button.tsx
│   │   ├── button.variants.ts
│   │   └── __tests__/
│   │       └── button.test.tsx
│   └── lib/
│       ├── utils.ts
│       └── __tests__/
│           └── utils.test.ts
├── dist/
└── package.json
```

**Ưu điểm:**
- Test files gần source code
- Dễ maintain khi refactor
- Jest tự động phát hiện test files
- Phù hợp với packages nhỏ và đơn giản

**Packages sử dụng pattern này:**
- `packages/hooks/`
- `packages/input/`
- `packages/ui/`
- `packages/input-number/`
- `packages/progress-circle/`
- `packages/checkbox-group/`
- `packages/image-loader/`
- `packages/eslint-config/`

### 2. Separate Tests Directory (Cho packages phức tạp)

**Cấu trúc:**
```
packages/[package]/
├── src/                    # Source code (@/ alias)
├── tests/                  # Test files (~/ alias)
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── fixtures/          # Test data và mock files
│   ├── types/             # Type tests
│   └── __mocks__/         # Mock files
├── dist/
└── package.json
```

**Ưu điểm:**
- Tách biệt rõ ràng source và test code
- Dễ tổ chức test phức tạp
- Hỗ trợ nhiều loại test khác nhau
- Phù hợp với packages lớn và phức tạp

**Packages sử dụng pattern này:**
- `packages/tailwind-variants/`

## Alias Configuration

### 1. Source Code Alias (`@/`)

**Cấu hình TypeScript (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Cấu hình Jest (`jest.config.ts`):**
```typescript
moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/src/$1",
}
```

**Sử dụng:**
```typescript
import { Button } from '@/components/button'
import { utils } from '@/lib/utils'
```

### 2. Tests Directory Alias (`~/`)

**Cấu hình TypeScript (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./tests/*"]
    }
  }
}
```

**Cấu hình Jest (`jest.config.ts`):**
```typescript
moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/src/$1",
  "^~/(.*)$": "<rootDir>/tests/$1"
}
```

**Sử dụng:**
```typescript
import { testData } from '~/fixtures/test-data'
import { mockUtils } from '~/__mocks__/utils'
```

## Jest Configuration

### 1. Test File Detection

**Cấu hình `testMatch`:**
```typescript
testMatch: [
  "**/__tests__/**/?(*.)+(spec|test).?([mc])[jt]s?(x)",
  "**/*.(spec|test).?([mc])[jt]s?(x)",
]
```

**Patterns được hỗ trợ:**
- `src/__tests__/component.test.tsx`
- `src/component.test.tsx`
- `tests/unit/component.test.tsx`
- `tests/integration/component.spec.tsx`

### 2. Module Name Mapping

**Cấu hình đầy đủ:**
```typescript
moduleNameMapper: {
  // Source code alias
  "^@/(.*)$": "<rootDir>/src/$1",
  
  // Tests directory alias (chỉ cho packages có tests/ directory)
  "^~/(.*)$": "<rootDir>/tests/$1",
}
```

## Naming Conventions

### 1. Test Files

**Co-located tests:**
```
src/
├── component.tsx
└── __tests__/
    └── component.test.tsx
```

**Separate tests:**
```
tests/
├── unit/
│   └── component.test.tsx
├── integration/
│   └── component.integration.test.tsx
└── fixtures/
    └── component-data.ts
```

### 2. Test Descriptions

**Cấu trúc mô tả test:**
```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should do something', () => {
      // test implementation
    })
  })
})
```

## Best Practices

### 1. Test Organization

- **Mỗi test file** nên test một component/function cụ thể
- **Sử dụng `describe`** để nhóm các test cases liên quan
- **Tên test** nên mô tả rõ ràng hành vi được test
- **Tránh test** các private methods, tập trung vào public API

### 2. Test Independence

- **Mỗi test** phải độc lập và không phụ thuộc vào test khác
- **Sử dụng `beforeEach`/`afterEach`** để setup/cleanup
- **Tránh shared state** giữa các tests

### 3. Mock và Fixtures

**Mock files:**
```
tests/__mocks__/
├── utils.ts
└── api.ts
```

**Test data:**
```
tests/fixtures/
├── user-data.ts
└── component-props.ts
```

### 4. Type Safety

- **Sử dụng TypeScript** cho tất cả test files
- **Import types** từ source code
- **Sử dụng proper typing** cho test data và mocks

## Migration Guide

### Từ Co-located sang Separate Tests

1. **Tạo thư mục `tests/`:**
   ```bash
   mkdir tests/{unit,integration,fixtures,__mocks__}
   ```

2. **Di chuyển test files:**
   ```bash
   mv src/**/__tests__/* tests/unit/
   ```

3. **Cập nhật imports:**
   ```typescript
   // Từ
   import { utils } from '../lib/utils'
   
   // Thành
   import { utils } from '@/lib/utils'
   ```

4. **Cập nhật cấu hình:**
   - Thêm alias `~/` vào `tsconfig.json`
   - Thêm `moduleNameMapper` vào `jest.config.ts`

## Package-specific Guidelines

### Packages sử dụng Co-located Tests

**Không cần alias `~/`**, chỉ cần:
- Alias `@/` cho source code
- Test files trong `src/__tests__/`

### Packages sử dụng Separate Tests

**Cần cả hai alias:**
- Alias `@/` cho source code
- Alias `~/` cho tests directory

## Troubleshooting

### Common Issues

1. **Module not found errors:**
   - Kiểm tra `moduleNameMapper` trong `jest.config.ts`
   - Kiểm tra `paths` trong `tsconfig.json`

2. **Type errors:**
   - Đảm bảo `tsconfig.json` include test files
   - Kiểm tra import paths

3. **Test not found:**
   - Kiểm tra `testMatch` patterns
   - Đảm bảo file có đúng extension (`.test.ts`, `.spec.ts`)

### Debug Commands

```bash
# Chạy tests với verbose output
pnpm test --verbose

# Chạy tests cho package cụ thể
pnpm test --filter=@codefast/ui

# Chạy tests với coverage
pnpm test --coverage
```

## Kết luận

Việc tổ chức test files phụ thuộc vào độ phức tạp của package:

- **Packages nhỏ**: Sử dụng co-located tests với alias `@/`
- **Packages lớn**: Sử dụng separate tests directory với alias `@/` và `~/`

Cấu trúc này đảm bảo:
- Dễ maintain và scale
- Type safety đầy đủ
- Performance tốt
- Developer experience tốt
