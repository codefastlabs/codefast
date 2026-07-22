---
name: release
description: Quy trình release packages @codefast/* — tạo changeset, canary, version và publish qua CI. Dùng khi cần release, chuẩn bị version mới, vào/ra chế độ canary, hoặc kiểm tra vì sao package chưa được publish.
---

# Release flow (changesets + CI)

## Nguyên tắc chung

- Mọi package `@codefast/*` nằm trong nhóm `fixed` (`.changeset/config.json`) — **version cùng nhau**. `@apps/ui` nằm trong `ignore`, không bao giờ cần changeset.
- **Không chạy `pnpm changeset add`** (TUI tương tác). Tự viết file `.changeset/<kebab-case>.md`:

  ```md
  ---
  "@codefast/ui": patch
  ---

  Một câu tóm tắt cho changelog.
  ```

- Publish do **CI đảm nhiệm** (`.github/workflows/release.yml`, `changesets/action` chạy `npx changeset publish`) khi thay đổi trong `.changeset/**` lên `main`. Không publish thủ công từ máy local.
- CI publish theo **2 bước**: push có changeset lên `main` → `changesets/action` **không publish ngay** mà mở release PR `chore: release new version` (branch `changeset-release/main`) chứa version bump. **Merge PR đó** thì lần chạy kế tiếp mới `changeset publish` lên npm.

## ⚠️ Khi còn 0.x: KHÔNG viết changeset `major`

Vì nhóm `fixed` version cùng nhau ở **mức bump cao nhất**, chỉ một `major` (kể cả trên một package như `@codefast/tracking`) đẩy **cả nhóm** `0.x → 1.0.0`. Breaking change trong 0.x phải là `minor`. Đã lỡ version/publish major sai trong canary thì **sửa changeset suông không đảo ngược được** (bump đã bake vào `package.json` + `pre.json`) — dùng recipe reset bên dưới.

## Reset canary về 0.x sau cú nhảy version sai (đã kiểm chứng)

1. Hạ các changeset sai `major → minor`.
2. Reset **mọi** `@codefast/*` package.json — gồm cả 2 cái ở `benchmarks/*` (`benchmark-di-inversify`, `benchmark-tailwind-variants`), không chỉ `packages/*`. Bỏ sót chúng thì fixed group vẫn bị neo cao.
3. Đặt base package.json = bản canary **đã publish gần nhất** của dòng muốn tiếp tục (vd `0.5.0-canary.5`) để CI tính ra bản kế `.6` — counter = (max prerelease trong nhóm) + 1, nên phải tránh các số đã publish.
4. Xoá `pre.json.changesets` (`[]`) để bộ changeset re-apply từ base đó.
5. Commit → push → merge release PR → CI publish.
6. Bản 1.x lỡ publish không gỡ được; `npm deprecate` chúng.

Kiểm chứng số version local (không cần `GITHUB_TOKEN`): tạm đặt `changelog: false` trong `.changeset/config.json`, chạy `pnpm exec changeset version`, đọc số, rồi `git checkout -- .` (changelog-github mặc định cần token nên `changeset version` bị escape, không phải lỗi logic version).

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
