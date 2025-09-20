# Laravel Style Commenting Guide for TypeScript/React

## Tổng quan

Hướng dẫn này mô tả cách áp dụng phong cách comment của Laravel vào dự án TypeScript/React, đã được kiểm tra và tương thích với ESLint configuration hiện tại của dự án.

## Lý do áp dụng Laravel Style

- **Cấu trúc rõ ràng**: Laravel có phong cách comment rất structured và professional
- **Documentation tốt**: Dễ tạo documentation tự động từ comments
- **Team collaboration**: Phong cách nhất quán giúp team hiểu code dễ hơn
- **Maintainability**: Comments có cấu trúc giúp maintain code tốt hơn

## Cấu trúc Comment Laravel Style

### 1. Component Documentation (tương tự Laravel Model/Controller)

```typescript
/**
 * Button Component - Tương tự Laravel Model documentation
 * 
 * Một component button linh hoạt hỗ trợ nhiều variants, sizes và states.
 * Có thể hiển thị loading state với spinner và prefix/suffix elements.
 * 
 * Package: `@codefast/ui`
 * Author: Vuong Phan <mr.thevuong@gmail.com>
 * Version: 0.3.7-canary.0
 * Since: 2025-01-28
 */
```

### 2. Hook Documentation (tương tự Laravel Service/Helper)

```typescript
/**
 * useCopyToClipboard Hook - Tương tự Laravel Helper function
 * 
 * Hook để copy text vào clipboard với feedback state và timeout tự động.
 * Hỗ trợ callback khi copy thành công và tự động reset state sau timeout.
 * 
 * Package: \@codefast/hooks
 * Author: Vuong Phan <mr.thevuong@gmail.com>
 * Version: 0.3.7-canary.0
 */
```

### 3. Utility Functions (tương tự Laravel Helper)

```typescript
/**
 * Utility Functions Library - Tương tự Laravel Helper functions
 * 
 * Collection các utility functions để support UI components và applications.
 * Bao gồm currency formatting và common utilities.
 * 
 * Package: `@codefast/ui`
 * Author: Vuong Phan <mr.thevuong@gmail.com>
 * Version: 0.3.7-canary.0
 * Since: 2025-01-28
 */
```

## Section Headers

### JSDoc-style Section Headers (Khuyến nghị)

```typescript
/**
 * =============================================================================
 * Component Implementation
 * =============================================================================
 * 
 * Component render button với các variants và states khác nhau.
 * Hỗ trợ loading state, prefix/suffix elements, và accessibility features.
 * 
 */
```

**Lưu ý**: Sử dụng `/**` thay vì `/*` để tương thích tốt hơn với TypeScript tooling và ESLint.

### Interface Documentation

```typescript
/**
 * =============================================================================
 * Button Props Interface
 * =============================================================================
 * 
 * Interface định nghĩa các props cho Button component.
 * Extends từ HTML button props và thêm các custom properties
 * cho styling và behavior customization.
 * 
 */

interface ButtonProps {
  /** Vị trí hiển thị loading spinner */
  loaderPosition?: "prefix" | "suffix";
  /** Trạng thái loading của button */
  loading?: boolean;
}
```

## Function Documentation

### JSDoc với Parameters và Examples

````typescript
/**
 * Render một button component với các variants và states khác nhau
 * 
 * @param props - Props của Button component
 * @returns JSX.Element - Button element được render
 * 
 * @example
 * ```tsx
 * <Button variant="primary" loading={isLoading}>
 *   Click me
 * </Button>
 * ```
 */
function Button(props: ButtonProps): JSX.Element {
  // Implementation
}
````

### Hook Documentation

````typescript
/**
 * Hook để copy text vào clipboard với feedback state
 * 
 * @param config - Configuration object cho hook
 * @returns Object chứa copyToClipboard function và isCopied state
 * 
 * @example
 * ```tsx
 * const { copyToClipboard, isCopied } = useCopyToClipboard({
 *   onCopy: () => console.log('Copied!'),
 *   timeout: 3000
 * });
 * ```
 */
export function useCopyToClipboard(config: Config): ReturnType {
  // Implementation
}
````

## Inline Comments

### Giải thích Logic Phức tạp

```typescript
// Render loading spinner ở vị trí prefix hoặc suffix
const renderLoadingSpinner = (position: "prefix" | "suffix"): ReactNode => {
  if (!loading || loaderPosition !== position) {
    return null;
  }

  return spinner ?? <Spinner key={position} />;
};

// Render prefix element hoặc loading spinner
const renderPrefix = (): ReactNode => {
  return renderLoadingSpinner("prefix") ?? prefix;
};
```

### Process Flow Comments

```typescript
try {
  // Copy text vào clipboard
  await navigator.clipboard.writeText(value);
  setIsCopied(true);

  // Gọi callback nếu được provide
  if (onCopy) {
    onCopy();
  }

  // Auto reset state sau timeout
  setTimeout(() => {
    setIsCopied(false);
  }, timeout);
} catch (error) {
  // Log error nhưng không throw để tránh break application
  console.error("Failed to copy to clipboard:", error);
}
```

## CSS/Styling Comments

### File Header

```css
/*
|--------------------------------------------------------------------------
| CodeFast UI Styles - Tương tự Laravel Blade template comments
|--------------------------------------------------------------------------
|
| File này chứa các định nghĩa styling cốt lõi cho CodeFast UI
| component library. Bao gồm global base styles, theme variables,
| và utility configurations cung cấp design system nhất quán
| across tất cả components.
|
| Dependencies:
| - TailwindCSS 4.x
| - @tailwindcss/typography plugin
| - tw-animate-css for animations
|
| Author: Vuong Phan <mr.thevuong@gmail.com>
| Version: 0.3.7-canary.0
| Last Modified: 2025-01-28
|
*/
```

### Section Comments

```css
/*
|--------------------------------------------------------------------------
| Base Layer Styles
|--------------------------------------------------------------------------
|
| Base layer chứa fundamental styling áp dụng globally
| across toàn bộ application. Bao gồm element resets,
| browser normalization, và foundational visual consistency.
|
*/

@layer base {
  /*
  |--------------------------------------------------------------------------
  | Global Border & Outline Configuration
  |--------------------------------------------------------------------------
  |
  | Thiết lập consistent border colors và focus ring styles across
  | tất cả elements sử dụng CSS custom properties. Đảm bảo unified
  | visual language throughout component library.
  |
  */
  *,
  ::after,
  ::before {
    border-color: var(--color-border);
    outline-color: color-mix(in oklab, var(--color-ring) 20%, transparent);
  }
}
```

## TypeScript vs CSS Comment Styles

### TypeScript Comments (JSDoc Style)
```typescript
/**
 * =============================================================================
 * Component Implementation
 * =============================================================================
 * 
 * Component render button với các variants và states khác nhau.
 * 
 */
```

### CSS Comments (Laravel Traditional Style)
```css
/*
|--------------------------------------------------------------------------
| Base Layer Styles
|--------------------------------------------------------------------------
|
| Base layer chứa fundamental styling áp dụng globally
| across toàn bộ application.
|
*/
```

**Quy tắc sử dụng:**
- **TypeScript/JavaScript files**: Sử dụng `/**` (JSDoc style) cho tương thích với tooling
- **CSS files**: Sử dụng `/*` với `|` characters (Laravel traditional style)

## Best Practices

### 1. Package Information
Luôn include thông tin package, author, version trong header comments:

**Version**: Lấy từ `package.json` của package tương ứng tại thời điểm thêm tính năng
**Author**: Lấy từ `package.json` hoặc team member thêm tính năng

```typescript
/**
 * Package: `@codefast/ui`
 * Author: Vuong Phan <mr.thevuong@gmail.com>
 * Version: 0.3.7-canary.0
 * Since: 2025-01-28
 */
```

**Cách lấy thông tin từ package.json:**

```bash
# Lấy version từ package.json
cat packages/ui/package.json | grep '"version"'
# Output: "version": "0.3.7-canary.0"

# Lấy author từ package.json  
cat packages/ui/package.json | grep '"author"'
# Output: "author": "Vuong Phan <mr.thevuong@gmail.com>"

# Hoặc sử dụng jq để parse JSON
jq -r '.version' packages/ui/package.json
jq -r '.author' packages/ui/package.json
```

**Quy tắc versioning:**
- **Version**: Luôn lấy từ `package.json` tại thời điểm thêm tính năng
- **Since**: Ngày thêm tính năng (format: YYYY-MM-DD)
- **Author**: Lấy từ `package.json` hoặc team member thực hiện
- **Package**: Tên package theo format `\@codefast/package-name`

**Workflow khi thêm tính năng mới:**

1. **Xác định package**: Kiểm tra bạn đang làm việc với package nào
2. **Lấy thông tin**: Sử dụng commands ở trên để lấy version và author
3. **Thêm comment**: Sử dụng thông tin đã lấy để tạo header comment
4. **Update Since**: Sử dụng ngày hiện tại cho field "Since"

**Ví dụ workflow:**
```bash
# 1. Xác định package (ví dụ: packages/ui)
cd packages/ui

# 2. Lấy version hiện tại
jq -r '.version' package.json
# Output: 0.3.7-canary.0

# 3. Lấy author
jq -r '.author' package.json  
# Output: Vuong Phan <mr.thevuong@gmail.com>

# 4. Thêm comment với thông tin đã lấy
# Version: 0.3.7-canary.0
# Author: Vuong Phan <mr.thevuong@gmail.com>
# Since: 2025-01-28
```

### 2. Vietnamese Comments
Sử dụng tiếng Việt cho comments để phù hợp với team:

```typescript
// Render loading spinner ở vị trí prefix hoặc suffix
// Gọi callback nếu được provide
// Auto reset state sau timeout
```

### 3. TSDoc Compliance
Sử dụng JSDoc tags chuẩn và escape @ symbols:

````typescript
/**
 * @param props - Props của Button component
 * @returns JSX.Element - Button element được render
 * @example
 * ```tsx
 * <Button variant="primary" loading={isLoading}>
 *   Click me
 * </Button>
 * ```
 */
````

### 4. Section Organization
Sử dụng section headers phù hợp với file type để organize code:

**TypeScript/JavaScript files:**

```typescript
/**
 * =============================================================================
 * Component Implementation
 * =============================================================================
 */

/**
 * =============================================================================
 * Utility Functions
 * =============================================================================
 */

/**
 * =============================================================================
 * Exports
 * =============================================================================
 */
```

**CSS files:**
```css
/*
|--------------------------------------------------------------------------
| Component Styles
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Utility Classes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Theme Variables
|--------------------------------------------------------------------------
*/
```

**Lưu ý**: 
- **TypeScript/JavaScript**: Sử dụng `/**` thay vì `/*` cho tất cả block comments để đảm bảo tương thích với TypeScript tooling, pass ESLint validation, và hỗ trợ IntelliSense tốt hơn
- **CSS**: Sử dụng `/*` với `|` characters theo Laravel traditional style để maintain consistency với CSS ecosystem

## ESLint Compatibility

### Các lỗi thường gặp và cách fix

1. **TSDoc undefined tags**: Không sử dụng `@package`, `@author`, `@version` mà dùng text thường
2. **@ symbol trong comments**: Escape bằng `\@` 
3. **Blank lines**: Thêm blank lines trước statements
4. **Import sorting**: Sử dụng `--fix` để auto-fix
5. **Unsafe types**: Sử dụng proper TypeScript types
6. **Comment format**: 
   - TypeScript/JavaScript: Sử dụng `/**` thay vì `/*` cho block comments
   - CSS: Sử dụng `/*` với `|` characters (Laravel traditional style)

### Ví dụ fix ESLint errors

```typescript
// ❌ Sẽ gây ESLint error - sử dụng /* thay vì /**
/* =============================================================================
   Component Implementation
   =============================================================================
*/

// ✅ ESLint compatible - sử dụng /** cho JSDoc format
/**
 * =============================================================================
 * Component Implementation
 * =============================================================================
 */

// ❌ TSDoc undefined tags
/**
 * @package @codefast/ui
 * @author CodeFast Labs
 */

// ✅ ESLint compatible
/**
 * Package: `@codefast/ui`
 * Author: CodeFast Labs
 */
```

```css
/* ✅ CSS - Laravel traditional style với | characters */
/*
|--------------------------------------------------------------------------
| Component Styles
|--------------------------------------------------------------------------
|
| Base styling cho component với proper organization.
|
*/

/* ❌ CSS - Không nên dùng JSDoc style trong CSS */
/**
 * Component Styles
 * Base styling cho component.
 */
```

## File Examples

### React Component

```typescript
import type { ComponentProps, JSX, ReactNode } from "react";

/**
 * Button Component - Tương tự Laravel Model documentation
 * 
 * Một component button linh hoạt hỗ trợ nhiều variants, sizes và states.
 * 
 * Package: `@codefast/ui`
 * Author: Vuong Phan <mr.thevuong@gmail.com>
 * Version: 0.3.7-canary.0
 * Since: 2025-01-28
 */

/**
 * =============================================================================
 * Button Props Interface
 * =============================================================================
 */

interface ButtonProps extends ComponentProps<"button"> {
  /** Vị trí hiển thị loading spinner */
  loaderPosition?: "prefix" | "suffix";
  /** Trạng thái loading của button */
  loading?: boolean;
}

/**
 * =============================================================================
 * Button Component Implementation
 * =============================================================================
 */

/**
 * Render một button component với các variants và states khác nhau
 * 
 * @param props - Props của Button component
 * @returns JSX.Element - Button element được render
 */
function Button(props: ButtonProps): JSX.Element {
  // Implementation
}

export { Button };
export type { ButtonProps };
```

### Custom Hook

```typescript
import { useState } from "react";

/**
 * useCopyToClipboard Hook - Tương tự Laravel Helper function
 * 
 * Hook để copy text vào clipboard với feedback state và timeout tự động.
 * 
 * Package: \@codefast/hooks
 * Author: Vuong Phan <mr.thevuong@gmail.com>
 * Version: 0.3.7-canary.0
 */

interface UseCopyToClipboardConfig {
  /** Callback function được gọi khi copy thành công */
  onCopy?: () => void;
  /** Thời gian timeout để reset isCopied state (milliseconds) */
  timeout?: number;
}

/**
 * Hook để copy text vào clipboard với feedback state
 * 
 * @param config - Configuration object cho hook
 * @returns Object chứa copyToClipboard function và isCopied state
 */
export function useCopyToClipboard({
  onCopy,
  timeout = 2000,
}: UseCopyToClipboardConfig = {}): {
  copyToClipboard: (value: string) => Promise<void>;
  isCopied: boolean;
} {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (value: string): Promise<void> => {
    // Check browser support cho clipboard API
    if (!navigator.clipboard?.writeText) {
      return;
    }

    // Validate input value
    if (!value) {
      return;
    }

    try {
      // Copy text vào clipboard
      await navigator.clipboard.writeText(value);
      setIsCopied(true);

      // Gọi callback nếu được provide
      if (onCopy) {
        onCopy();
      }

      // Auto reset state sau timeout
      setTimeout(() => {
        setIsCopied(false);
      }, timeout);
    } catch (error) {
      // Log error nhưng không throw để tránh break application
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return { copyToClipboard, isCopied };
}
```

### Utility Functions

````typescript
/**
 * Utility Functions Library - Tương tự Laravel Helper functions
 * 
 * Collection các utility functions để support UI components và applications.
 * 
 * Package: `@codefast/ui`
 * Author: Vuong Phan <mr.thevuong@gmail.com>
 * Version: 0.3.7-canary.0
 * Since: 2025-01-28
 */

/**
 * =============================================================================
 * Currency Formatting Utilities
 * =============================================================================
 */

/**
 * Format số thành chuỗi tiền tệ với locale và currency tùy chỉnh
 * 
 * @param amount - Số tiền cần format
 * @param currency - Mã tiền tệ (mặc định: 'USD')
 * @param locale - Locale để format (mặc định: 'en-US')
 * @returns Chuỗi tiền tệ đã được format
 * 
 * @example
 * ```typescript
 * formatCurrency(1234.56); // "$1,234.56"
 * formatCurrency(1234.56, 'VND', 'vi-VN'); // "1.235 ₫"
 * ```
 */
export const formatCurrency = (
  amount: number, 
  currency = 'USD', 
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    currency,
    style: 'currency'
  }).format(amount);
};
````

## Testing

Để test ESLint compatibility:

```bash
# Test specific file
pnpm exec eslint --max-warnings 0 src/path/to/file.ts

# Auto-fix issues
pnpm exec eslint --max-warnings 0 --fix src/path/to/file.ts

# Test entire package
pnpm lint
```

## Kết luận

Phong cách comment Laravel có thể được áp dụng hiệu quả vào dự án TypeScript/React với một số điều chỉnh nhỏ để tương thích với ESLint. Điều này giúp:

- Cải thiện code documentation
- Tăng tính maintainability
- Hỗ trợ team collaboration tốt hơn
- Tạo consistent coding style

**Lưu ý quan trọng**: 
- Luôn chạy ESLint sau khi thêm comments để đảm bảo compatibility và fix các issues tự động khi có thể
- **Version**: Luôn lấy từ `package.json` tại thời điểm thêm tính năng, không hard-code version
- **Consistency**: Đảm bảo tất cả comments trong cùng một feature có cùng version và author
