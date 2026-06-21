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
- **KHÔNG tạo biến chỉ để chứa class Tailwind** (vd `const FOO = "flex gap-3 …"`) — đó là antipattern: mất IntelliSense/auto-sort, khó đọc inline. Viết class thẳng trong `className`. Khi cùng một bộ class lặp lại ở nhiều nơi → **tách thành component dùng lại** (đúng khuyến cáo Tailwind), KHÔNG gom vào biến string và cũng KHÔNG copy lặp. Hiệu ứng cần CSS (gradient/background-size/mask…) viết bằng Tailwind arbitrary values (`bg-[radial-gradient(…)]`, `bg-size-[16px_16px]`) thay vì object `style`. Class động/có điều kiện dùng `cn()` tại chỗ.
- **Mỗi component một file** (trong `apps/web/src/components/**`): khi cần tách component (gồm cả sub-component/helper dùng lại), tạo **file mới** ở thư mục hợp lý (`detail/`, `shared/`, `layout/`, `showcase/`…) với tên kebab-case, rồi `export` và import vào — KHÔNG khai báo nhiều component trong cùng một file. Ngoại lệ chấp nhận đồng cư: bộ icon gom 1 file, và file `*.example.tsx` / `demo.tsx` trong `registry/` (sub-component chỉ phục vụ demo đó). Một file = một khái niệm: types/context/hook/UI tách đúng nhà, không gom theo tên component.
- **Props không inline**: KHÔNG annotate props bằng object literal tại tham số (`function X({ a }: { a: string })`). Khai báo `interface XxxProps extends ComponentProps<"element">` riêng (theo host element component render), rồi spread `{...props}` xuống element đó để forward native attributes; class gộp qua `cn(base, className)`. **`{...props}` đặt CUỐI danh sách attr** (sau các attr tường minh, theo convention shadcn) — attr nào set cứng & không cho override thì `Omit` khỏi type (vd wrapper hardcode `id`/`title` → `extends Omit<ComponentProps<"section">, "children" | "id" | "title">`) để spread cuối vẫn an toàn. Ngoại lệ: handler/attr quyết định hành vi cốt lõi mà component phải sở hữu (vd `onClick` copy của `CopyButton`) đặt **sau** `{...props}` để caller không ghi đè được — kèm comment giải thích. Lưu ý `exactOptionalPropertyTypes` đang bật → prop optional nhận giá trị truyền tường minh phải khai `?: T | undefined`. Khi component **forward tới một component khác** (không phải host element DOM) thì extend `ComponentProps<typeof ThatComponent>` (theo đúng contract component đó), `Omit` các prop **required** mà wrapper tự cung cấp — vd `*-section` render `<DocSection>` (vốn required `id`/`title`/`children`) → `extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children">`. (Lưu ý 2 việc độc lập: **vị trí `{...props}`** quyết định runtime override; **`Omit`** quyết định type contract — đổi vị trí spread KHÔNG thay được việc phải Omit prop required, nếu không caller bị buộc truyền chúng. Prop optional wrapper set sẵn (vd `description`) có thể không Omit nếu muốn caller override được.) Ngoại lệ: component không có prop tùy biến → dùng thẳng `ComponentProps<"element">` (đừng tạo interface extend rỗng); component render Context.Provider → `extends Omit<ComponentProps<typeof X.Provider>, "value">`; component rẽ nhánh nhiều element (vd `<a>`/`<p>`) → named interface không extend DOM.

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
