---
name: release
description: Quy trình release packages @codefast/* — tạo changeset, canary, version và publish qua CI. Dùng khi cần release, chuẩn bị version mới, vào/ra chế độ canary, hoặc kiểm tra vì sao package chưa được publish.
---

# Release flow (changesets + CI)

## Nguyên tắc chung

- Mọi package `@codefast/*` nằm trong nhóm `fixed` (`.changeset/config.json`) — **version cùng nhau**. `@apps/web` nằm trong `ignore`, không bao giờ cần changeset.
- **Không chạy `pnpm changeset add`** (TUI tương tác). Tự viết file `.changeset/<kebab-case>.md`:

  ```md
  ---
  "@codefast/ui": patch
  ---

  Một câu tóm tắt cho changelog.
  ```

- Publish do **CI đảm nhiệm** (`.github/workflows/release.yml`, `changesets/action` chạy `npx changeset publish`) khi thay đổi trong `.changeset/**` lên `main`. Không publish thủ công từ máy local.

## Release stable

1. Đảm bảo mỗi thay đổi đáng release đã có changeset đi kèm trong commit.
2. Merge lên `main` — CI sẽ version + publish (script `version-packages` = `changeset version && pnpm run codefast tag`, trong đó `codefast tag` bổ sung `@since` vào JSDoc).

## Canary

```bash
pnpm run release:canary:enter   # changeset pre enter canary — commit file .changeset/pre.json
# ... các changeset sau đó sẽ version dạng x.y.z-canary.N
pnpm run release:canary:exit    # changeset pre exit — thoát chế độ canary
```

Kiểm tra trạng thái: nếu `.changeset/pre.json` tồn tại thì repo đang ở chế độ canary.

## Checklist trước khi merge release

- `pnpm run verify` xanh (build packages + lint + format + check-types + test:coverage).
- Changeset mô tả đúng mức bump (patch/minor/major) — nhớ nhóm fixed nên mức cao nhất sẽ áp cho tất cả.
