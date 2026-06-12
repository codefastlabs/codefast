# Codefast Monorepo

Đây là monorepo dùng **pnpm workspaces** + **Turborepo**. Package manager: `pnpm`. Node ≥ 24.

## Code Quality — BẮT BUỘC

**Sau khi viết hoặc sửa bất kỳ file nào**, Claude phải tự chạy kiểm tra chất lượng **ở mức repo** theo bảng dưới. Không bao giờ kết thúc task mà bỏ qua bước này.

### Quy trình chuẩn

> Hook PostToolUse trong `.claude/settings.json` đã **tự động chạy oxfmt + oxlint trên từng file** ngay sau khi Claude ghi/sửa qua tool Write/Edit. Không cần chạy lại format/lint thủ công cho từng file đó.
>
> **Ngoại lệ**: file được tạo/sửa qua **Bash** (codegen, script, `codefast arrange`, …) không đi qua hook — sau các thao tác đó phải chạy `pnpm run format` (và `pnpm run lint:fix` nếu là file TS/JS).

1. **Type check** (không auto-fix, đọc output và sửa tay):

   ```bash
   pnpm run check-types
   ```

2. Khi refactor lớn hoặc nghi ngờ trạng thái toàn repo:
   ```bash
   pnpm run check:fix   # lint:fix + format toàn repo
   pnpm run check       # lint + format:check + check-types (không fix)
   ```

### Khi nào chạy gì

| Tình huống                  | Lệnh                                         |
| --------------------------- | -------------------------------------------- |
| Sửa 1–2 file nhỏ            | `pnpm run check-types`                       |
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
pnpm run verify       # Tổng hợp: build packages + lint:fix + format + check-types + test:coverage
pnpm run clean        # Xóa build cache
```

## Cấu trúc

```
apps/        # Applications (web, ...)
packages/    # Shared packages (@codefast/*)
benchmarks/  # Performance benchmarks
```
