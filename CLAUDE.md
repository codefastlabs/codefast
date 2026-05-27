# Codefast Monorepo

Đây là monorepo dùng **pnpm workspaces** + **Turborepo**. Package manager: `pnpm`. Node ≥ 22.

## Code Quality — BẮT BUỘC

**Sau khi viết hoặc sửa bất kỳ file nào**, Claude phải tự chạy kiểm tra chất lượng. Không bao giờ kết thúc task mà bỏ qua bước này.

### Quy trình chuẩn

1. **Format** (auto-fix, chạy trước):

   ```bash
   pnpm run format
   ```

2. **Lint** (auto-fix warnings):

   ```bash
   pnpm run lint:fix
   ```

3. **Type check** (không auto-fix, đọc output và sửa tay):

   ```bash
   pnpm run check-types
   ```

4. Hoặc chạy tất cả cùng lúc:
   ```bash
   pnpm run check:fix   # lint:fix + format
   pnpm run check       # lint + format:check + check-types (không fix)
   ```

### Khi nào chạy gì

| Tình huống                  | Lệnh                                         |
| --------------------------- | -------------------------------------------- |
| Sửa 1–2 file nhỏ            | `pnpm run format && pnpm run check-types`    |
| Sửa logic lớn / refactor    | `pnpm run check:fix && pnpm run check-types` |
| Trước khi kết thúc mọi task | `pnpm run check`                             |
| Có lỗi build                | `pnpm run build:packages`                    |

### Quy tắc bổ sung

- **Import**: Tách `import type` riêng — không merge vào value imports.
- **Tests**: Nếu sửa file có test đi kèm, chạy `pnpm run test:unit`.
- **Nếu `check-types` có lỗi**: Đọc output, sửa code, chạy lại — không bỏ qua.

## Scripts thường dùng

```bash
pnpm run dev          # Chạy dev server (tất cả apps)
pnpm run build        # Build toàn bộ
pnpm run build:packages  # Build chỉ packages (thường cần sau khi sửa packages/)
pnpm run test         # Chạy toàn bộ tests
pnpm run test:unit    # Chỉ unit tests
pnpm run clean        # Xóa build cache
```

## Cấu trúc

```
apps/        # Applications (web, ...)
packages/    # Shared packages (@codefast/*)
benchmarks/  # Performance benchmarks
```
