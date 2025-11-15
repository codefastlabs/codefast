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

### Thuật toán

Script tự động:
1. Scan thư mục `dist/` (recursive)
2. Phân loại files theo module (nhóm `.js`, `.cjs`, `.d.ts`)
3. Validate modules (phải có `.js` và `.d.ts`)
4. Tạo export paths:
   - `dist/index.*` → `"."`
   - `dist/loaders/cloudinary.*` → `"./loaders/cloudinary"`
5. Generate exports object với structure:
   ```json
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
