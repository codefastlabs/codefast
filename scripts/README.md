# Scripts Directory

This directory contains utility scripts for the CodeFast project.

## generate-exports.ts

Tự động generate `exports` trong `package.json` từ cấu trúc thư mục `dist/` cho bất kỳ package nào.

**Note**: Script được viết bằng TypeScript và sử dụng `tsx` để thực thi.

### Usage

```bash
# Xử lý tất cả packages (không truyền argument)
pnpm generate:exports

# Xử lý một package cụ thể
pnpm generate:exports packages/image-loader
pnpm generate:exports packages/ui

# Hoặc chạy trực tiếp
tsx scripts/generate-exports.ts                    # Tất cả packages
tsx scripts/generate-exports.ts packages/image-loader  # Package cụ thể
```

**Note**: 
- Script `generate:exports` đã được thêm vào root `package.json`
- Khi không truyền argument, script sẽ tự động tìm và xử lý tất cả packages có thư mục `dist/`
- Chỉ packages có cả `package.json` và `dist/` mới được xử lý

### Configuration

Tạo file config ở root để cấu hình. Script hỗ trợ cả hai format:

**Option 1: `generate-exports.config.js` (recommended - có priority)**

```javascript
const config = {
  // Packages to skip (relative paths from workspace root)
  skipPackages: [
    "packages/tailwind-variants",
  ],

  // Path transformations for specific packages
  pathTransformations: {
    "packages/ui": {
      removePrefix: "./components/",
    },
  },
};

export default config;
```

**TypeScript Support:**
- File này có TypeScript type inference thông qua JSDoc `@type` annotation
- IDE sẽ cung cấp autocomplete và type checking khi chỉnh sửa config
- Type được import từ `GenerateExportsConfig` interface trong `scripts/generate-exports.ts`

**Option 2: `generate-exports.config.json`**

```json5
{
  "skipPackages": [
    "packages/tailwind-variants"
  ],
  "pathTransformations": {
    "packages/ui": {
      "removePrefix": "./components/"
    }
  }
}
```

**Lưu ý:**
- Nếu cả hai file đều tồn tại, `.js` sẽ được ưu tiên
- `.js` format cho phép sử dụng comments và dynamic logic
- `.json` format đơn giản hơn, phù hợp cho config tĩnh

**Tính năng:**
- `skipPackages`: Loại bỏ packages không cần generate exports (relative paths từ workspace root)
- `pathTransformations`: Transform export paths cho packages cụ thể
  - `removePrefix`: Bỏ prefix khỏi export path (ví dụ: `"./components/accordion"` → `"./accordion"`)
- `cssExports`: Cấu hình exports cho CSS files (tự động phát hiện nếu không config)

**CSS Auto-detection:**
- Script tự động scan recursively tất cả file `.css` trong `dist/`
- Tự động phân tích cấu trúc:
  - **Thư mục chỉ chứa CSS files** → dùng wildcard export (ví dụ: `"./css/*": "./dist/css/*"`)
  - **Thư mục có mix files** → export từng file riêng (ví dụ: `"./css/amber.css": "./dist/css/amber.css"`)
  - **CSS files ở root** → export từng file (ví dụ: `"./style.css": "./dist/style.css"`)

**CSS Configuration:**
```json5
{
  cssExports: {
    "packages/ui": {
      enabled: true,              // Bật/tắt CSS exports (default: auto-detect)
      forceExportFiles: false,    // Force export từng file ngay cả khi thư mục chỉ có CSS (default: false)
      customExports: {            // Custom exports (override auto-detected)
        "./styles.css": "./dist/css/custom.css"
      }
    },
    "packages/other": false       // Tắt CSS exports cho package này
  }
}
```

**Ví dụ:**
- Tìm thấy `dist/css/` chỉ chứa CSS files → tự động tạo `"./css/*": "./dist/css/*"`
- Tìm thấy `dist/themes/` có CSS và non-CSS files → export từng file: `"./themes/amber.css": "./dist/themes/amber.css"`
- Tìm thấy `dist/style.css` → tự động tạo `"./style.css": "./dist/style.css"`

### Thuật toán

Script tự động:
1. Scan thư mục `dist/` (recursive)
2. Phân loại files theo module (nhóm `.js`, `.cjs`, `.d.ts`)
3. Validate modules (phải có `.js` và `.d.ts`)
4. Tạo export paths:
   - `dist/index.*` → `"."`
   - `dist/loaders/cloudinary.*` → `"./loaders/cloudinary"`
5. Generate exports object với structure:
   ```json5
   {
     "{export-path}": {
       "types": "./dist/{path}.d.ts",
       "import": "./dist/{path}.js",
       "require": "./dist/{path}.cjs"
     }
   }
   ```
6. Update `package.json` với exports mới

Xem file [EXPORTS_ALGORITHM.md](../packages/image-loader/scripts/EXPORTS_ALGORITHM.md) để hiểu rõ hơn về thuật toán.
