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

## clean-empty-dirs.sh

A terminal script to clean empty directories in the `packages` folder.

**Note**: node_modules directories are excluded by default for safety.

### Usage

```bash
# Interactive mode with confirmation (excludes node_modules by default)
./scripts/clean-empty-dirs.sh

# Preview what would be deleted (dry run, excludes node_modules by default)
./scripts/clean-empty-dirs.sh --dry-run

# Delete without confirmation (excludes node_modules by default)
./scripts/clean-empty-dirs.sh --force

# Include node_modules directories in deletion
./scripts/clean-empty-dirs.sh --include-node-modules

# Combine options - preview including node_modules
./scripts/clean-empty-dirs.sh --dry-run --include-node-modules
```

### Options

- `--dry-run`: Show what would be deleted without actually deleting
- `--include-node-modules`: Include node_modules directories in deletion (they are excluded by default)
- `--force`: Skip confirmation prompt
- `--help`: Show help message

### Features

- ✓ Safe operation with confirmation prompts
- ✓ Dry-run mode for preview
- ✓ Colored output with emojis for better readability
- ✓ Excludes node_modules directories by default for safety
- ✓ Option to include node_modules directories when needed
- ✓ Error handling and validation
- ✓ Progress feedback during deletion
- ✓ Summary of results

### Examples

```bash
# Preview all empty directories (excludes node_modules by default)
./scripts/clean-empty-dirs.sh --dry-run

# Clean all empty directories including node_modules
./scripts/clean-empty-dirs.sh --include-node-modules

# Quick cleanup without prompts (excludes node_modules by default)
./scripts/clean-empty-dirs.sh --force
```

### Notes

- The script only deletes truly empty directories (no files or subdirectories)
- Parent directories may become empty after their subdirectories are removed
- Run the script multiple times to clean up nested empty directory structures
- The script is safe to run - it won't delete directories containing files
