# Board GitHub Projects — cách hoạt động và cách dùng

> **Board:** [`orgs/codefastlabs/projects/4`](https://github.com/orgs/codefastlabs/projects/4) — private, link vào `codefastlabs/codefast`
>
> **Cập nhật:** 2026-08-03 · Vì sao thiết kế như vậy: [`decisions/github-project-board.md`](../decisions/github-project-board.md) · Sửa cấu hình: [`runbooks/github-project-maintenance.md`](../runbooks/github-project-maintenance.md)

Board này là **repo-level Projects v2 đặt ở cấp org**. `github.com/codefastlabs/codefast/projects` chỉ là trang liệt kê các project được link vào repo — Projects (classic) đã bị GitHub khai tử, không còn board nào sống ở cấp repo.

---

## 1. Mô hình một câu

**Board theo dõi issue, không theo dõi PR.** Issue đi từ `Inbox` xuống `Done` gần như hoàn toàn tự động; PR chỉ tác động lên trạng thái của issue mà nó gắn vào, và bản thân PR không bao giờ xuất hiện thành card.

## 2. Field

| Field     | Loại          | Ý nghĩa                                                                                                     |
| --------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| `Status`  | single-select | Bậc trong luồng làm việc — xem §3                                                                           |
| `Package` | single-select | `ui` · `di` · `tailwind-variants` · `theme` · `tracking` · `cli` · `benchmark` · `apps/ui` · `repo-tooling` |
| `Kind`    | single-select | `feat` · `fix` · `perf` · `docs` · `dx` · `chore` · `idea` · `learn`                                        |
| `Target`  | text          | **Dự án downstream nào đang cần cái này.** Không phải mốc version — repo không có mốc 1.0                   |

`Package` là field quan trọng nhất: câu hỏi thường trực của monorepo là _"còn gì treo ở package nào"_, và ba trong bốn view group theo nó.

Sáu option đầu của `Kind` khớp Conventional Commits (commitlint đang enforce), nên `Kind` của issue thường thành prefix commit luôn.

`Kind` và `Target` **không có workflow nào tự điền** — set tay khi triage.

## 3. Status — sáu bậc

| Bậc           | Nghĩa         | Ai đặt                              | Luật                                            |
| ------------- | ------------- | ----------------------------------- | ----------------------------------------------- |
| `Inbox`       | chưa triage   | tự động, khi item vào board         | **rỗng mỗi tuần** — hoặc lên `Next`, hoặc close |
| `Someday`     | park có chủ ý | tay                                 | đọc lại mỗi kỳ release: _"còn đúng không?"_     |
| `Next`        | đã cam kết    | tay                                 | **thứ tự trong cột chính là priority**          |
| `In progress` | đang làm      | tay                                 | **WIP = 1** — không cột nào khác được có 2 item |
| `In review`   | PR đang mở    | tự động, khi PR link tới issue      | —                                               |
| `Done`        | xong          | tự động, khi issue close / PR merge | kéo tay sang đây sẽ **tự đóng issue**           |

Ba luật giữ board không mục, bỏ luật nào cũng rữa:

1. **WIP = 1.**
2. **`Inbox` rỗng mỗi tuần.**
3. **Item ở `Next` quá 30 ngày không chạm → close.** 30 ngày không làm thì đó không phải `Next`.

> Park ý tưởng thì dùng `Someday`, **đừng dùng `Done`** — `Done` sẽ đóng cả draft issue.

## 4. Bảy workflow tự động

| Workflow                       | Trigger                     | Hành động                |
| ------------------------------ | --------------------------- | ------------------------ |
| `Auto-add to project`          | issue khớp filter (§5)      | thêm vào board           |
| `Item added to project`        | item vào board              | `Status: Inbox`          |
| `Pull request linked to issue` | PR gắn vào issue            | `Status: In review`      |
| `Item closed`                  | issue/PR close              | `Status: Done`           |
| `Pull request merged`          | PR merge                    | `Status: Done`           |
| `Auto-close issue`             | `Status` chuyển sang `Done` | **close issue**          |
| `Auto-add sub-issues`          | item có sub-issue           | thêm sub-issue vào board |

Hai workflow cuối làm vòng lặp kín cả hai chiều: đóng issue → card sang `Done`, và kéo card sang `Done` → issue tự đóng. Không còn trạng thái nào phải sửa tay.

`Pull request linked to issue` **không kéo PR vào board** — nó set field trên **issue**. Đó là lý do board không cần chứa PR mà vẫn biết issue đang chờ review.

## 5. Cái gì lên board, cái gì không

Filter của `Auto-add to project`:

```
is:issue is:open -label:dependencies -label:github-actions
```

**Chỉ issue.** Hệ quả trực tiếp:

- PR Dependabot (~10/tuần, grouped, auto-merge trừ major) **không lên board** — chúng không cần trạng thái.
- PR `chore: release new version` của Changesets **không lên board** — nó là checkpoint, không phải task.
- **PR của chính bạn cũng không lên board.** PR nhỏ không gắn issue sẽ vô hình với board — đó là chủ ý, không phải thiếu sót.

## 6. Ý tưởng, mục tiêu học, tầm nhìn

Ba loại nội dung này có **điều kiện kết thúc khác nhau**, nên ở khác chỗ:

| Loại             | Chỗ ở                                        | Vì sao                                                                               |
| ---------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Tầm nhìn**     | README của project (tab Settings)            | Tầm nhìn không bao giờ `Done`                                                        |
| **Ý tưởng**      | **draft issue**, `Kind: idea`, `Someday`     | Không tạo issue trong repo: không đốt số, không notification, không lộ khi chưa chín |
| **Mục tiêu học** | draft issue `Kind: learn` (nếu phục vụ repo) | Học thuần cá nhân, không liên quan repo, thì không thuộc project này                 |

**Draft issue** là cơ chế đáng dùng nhất ở đây: item sống trong board, có đủ `Package`/`Kind`/`Target`, nhưng repo vẫn sạch. Đã kiểm chứng: draft issue **vẫn được `Item added to project` set `Status: Inbox`**, nên nó hoà vào luồng sẵn có mà không cần workflow riêng.

Khi một ý tưởng chín → **Convert to issue**, từ đó các workflow tiếp quản.

Tạo draft nhanh bằng API:

```bash
gh api graphql -f query='mutation { addProjectV2DraftIssue(input:{ projectId:"PVT_kwDOBoFaAM4BfM8Z", title:"…", body:"…" }) { projectItem { id } } }'
```

## 7. Bốn view

| #   | View         | Layout | Group     | Filter              | Dùng khi                                    |
| --- | ------------ | ------ | --------- | ------------------- | ------------------------------------------- |
| 1   | `Board`      | board  | `Status`  | —                   | view mặc định, làm việc hằng ngày           |
| 2   | `By package` | table  | `Package` | —                   | _"còn gì treo ở package nào"_               |
| 3   | `Perf`       | table  | `Package` | `label:performance` | vòng lặp regression → benchmark → changeset |
| 5   | `Ideas`      | table  | `Package` | `kind:idea,learn`   | đọc lại mỗi kỳ release                      |

Số view nhảy từ 3 sang 5 vì view `Roadmap` (số 4) đã bị xoá — xem [decisions](../decisions/github-project-board.md).

View `Perf` ăn khớp với hạ tầng có sẵn: label `performance`, issue template `.github/ISSUE_TEMPLATE/performance-regression.yml`, và `benchmarks/*`.

## 8. Nhịp vận hành

| Nhịp               | Việc                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Hằng tuần**      | `Inbox` về rỗng. Mỗi item: lên `Next` hoặc close.                                             |
| **Mỗi kỳ release** | Đọc `Someday` (view `Ideas`), mỗi item hỏi đúng một câu: _"còn đúng không?"_ Không thì close. |
| **Khi nào cũng**   | `In progress` tối đa 1 item.                                                                  |

Nhịp đọc lại `Someday` **gắn vào release chứ không tạo nhịp mới** — một danh sách ý tưởng không có nhịp đọc lại thì bằng không, và ý tưởng nằm im tám tháng làm nhiễu mọi lần mở board.
