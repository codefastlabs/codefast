# Thiết kế board GitHub Projects — hồ sơ quyết định

**Ngày:** 2026-08-03 · **Trạng thái:** đã chốt và đã triển khai · **Board:** [`orgs/codefastlabs/projects/4`](https://github.com/orgs/codefastlabs/projects/4)

Ghi lại đã chọn gì, vì sao, và — quan trọng nhất — **những ràng buộc của GitHub Projects đã buộc đổi thiết kế giữa đường**. Cách dùng board nằm ở [`guides/github-project-board.md`](../guides/github-project-board.md).

---

## 1. Bối cảnh khi thiết kế

Trạng thái repo lúc dựng board, vì nó quyết định gần hết các lựa chọn:

- **0 issue đang mở**, 1 PR duy nhất là bot `chore: release new version`
- Dependabot chạy weekly + grouped, **auto-merge** trừ major (`.github/workflows/dependabot-auto-merge.yml`)
- 9 package + 1 app + 2 benchmark suite, một người bảo trì
- Labels gần như mặc định, chỉ thêm `dependencies`, `github-actions`, `performance`

Với 0 issue và một người làm, một board kiểu Jira 8 field sẽ chết trong hai tuần. **Mỗi field là thuế phải trả trên mọi item**, nên chốt đúng 4.

## 2. Các quyết định

### 2.1 Board ở cấp org, không phải cấp repo

Projects (classic) đã bị khai tử. `github.com/codefastlabs/codefast/projects` chỉ là trang liệt kê. Board thật sống ở `orgs/codefastlabs/projects/4` và được link vào repo — lợi thế là sau này phủ được nhiều repo của org.

### 2.2 Bốn field, không nhiều hơn

`Status` · `Package` · `Kind` · `Target`.

**Bỏ `Priority` và `Size`.** Một người làm thì **thứ tự trong cột `Next` chính là priority** — kéo-thả rẻ hơn set field. `Size` không dùng để lập kế hoạch cho ai nên nó chỉ là thuế.

`Package` được giữ vì đây là monorepo: câu hỏi thực tế hằng ngày là _"còn gì treo ở package nào"_, không phải _"issue này ưu tiên mấy"_.

### 2.3 Chỉ auto-add issue, không auto-add PR

> **Đây là quyết định bị nền tảng buộc đổi, không phải lựa chọn ban đầu.**
>
> Thiết kế đầu tiên là auto-add cả issue lẫn PR, rồi loại bot bằng `-author:app/dependabot -author:app/github-actions`. GitHub **từ chối**:
>
> ```
> Invalid filter: Unknown field names "author", "author"
> ```
>
> Filter của project auto-add **không hỗ trợ `author:`**. Cũng không có autocomplete để tra field nào được hỗ trợ.

Cách thay thế: chỉ nhận issue.

```
is:issue is:open -label:dependencies -label:github-actions
```

Cả PR Dependabot lẫn PR release đều là PR nên bị loại sạch **mà không cần `author:`**. PR release lại không có label nào, nên nếu vẫn muốn nhận PR thì không có cách nào lọc riêng nó.

**Đánh đổi đã chấp nhận:** PR của chính maintainer cũng không lên board. PR nhỏ không gắn issue sẽ vô hình. Với repo một người, PR merge trong ngày không cần trạng thái.

Bù lại bằng workflow `Pull request linked to issue` → issue tự sang `In review`. Cần ghi rõ vì dễ hiểu sai: workflow này **set field trên issue**, nó **không** kéo PR vào board.

### 2.4 Thêm bậc `Someday`

Bộ `Status` đầu tiên là 5 bậc: `Inbox → Next → In progress → In review → Done`.

Bộ đó **xung đột với luật của chính nó**: luật nói _"`Inbox` rỗng mỗi tuần"_, nhưng ý tưởng cần park hàng tháng. Ý tưởng nằm ở `Inbox` thì luật chết ngay tuần đầu, và đó đúng là lúc board bắt đầu mục.

Thêm `Someday` giải xung đột: `Inbox` = chưa triage (rỗng mỗi tuần), `Someday` = park có chủ ý (đọc lại mỗi kỳ release), `Next` = đã cam kết.

### 2.5 Ý tưởng và mục tiêu học là draft issue

Không phải issue thật: không đốt số issue, không gửi notification, không lộ ra công khai khi chưa chín.

Đã kiểm chứng bằng thực nghiệm (tạo draft → đọc field → xoá): draft issue **vẫn được `Item added to project` set `Status: Inbox`**, nên không cần workflow riêng.

Học thuần cá nhân, không liên quan repo, **không thuộc project này** — trộn "học Rust" với "sửa RTL cho Tooltip" phá đúng cái tín hiệu cần từ board: _cái gì đang ship được_.

### 2.6 Bật `Auto-close issue`

Kéo card sang `Done` → issue tự đóng. Cùng với `Item closed` → `Done`, vòng lặp kín cả hai chiều, không idempotent-loop vì cả hai đầu đều hội tụ.

**Tác dụng phụ cần biết:** áp cho cả draft issue. Đó là lý do §3 của guide nhấn mạnh park ý tưởng bằng `Someday` chứ không phải `Done`.

### 2.7 Xoá view `Roadmap`

Đã tạo rồi xoá. Hai lý do:

1. **Không chạy được về mặt kỹ thuật.** Layout Roadmap cần field kiểu **DATE** để vẽ thanh thời gian. `Target` là **TEXT**, nên item hiện ra nhưng không có vị trí trên trục thời gian.
2. **Mất lý do tồn tại.** Lý do ban đầu là roadmap công khai cho người ngoài đọc. Project để **private**, nên lý do đó không còn.

Giữ nó lại chỉ là một tab chết. Nếu sau này thật sự cần timeline: thêm field `Target date` kiểu DATE, đừng đổi `Target`.

### 2.8 `Target` nghĩa là dự án downstream, không phải mốc version

Đây là **dự án nội bộ, không có mốc 1.0 nào được lên kế hoạch** — số version là giấy tờ của Changesets, không phải lời hứa tương thích với bên thứ ba.

Nên câu hỏi đúng mỗi kỳ release không phải _"đã 1.0 chưa"_ mà là _"dự án downstream nào đang chờ cái gì"_. `Target` trả lời câu đó.

Ghi chú kèm: bằng chứng trong repo (npm `access: public`, doc site codefastlabs.com, badge downloads/bundle-size) chỉ về hướng "sản phẩm công khai" — **ngược với ý định thật**. Đó là lý do việc này phải được ghi ra thay vì để mỗi người suy luận lại từ repo.

### 2.9 Giữ project private

Đã cân nhắc để public để board thành roadmap cho người ngoài. Chốt **private** — phù hợp với bản chất nội bộ của dự án, và kéo theo quyết định 2.7.

## 3. Ràng buộc của GitHub Projects đã gặp

Ghi lại để không phải tự phát hiện lại:

| Ràng buộc                                                                 | Hệ quả                                                                            |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Filter auto-add **không hỗ trợ `author:`**                                | Không loại bot theo tác giả được → quyết định 2.3                                 |
| Filter **có** hỗ trợ custom field (`kind:idea,learn`)                     | Đã kiểm chứng trên UI, không báo lỗi                                              |
| GraphQL **không** cấu hình được built-in workflow                         | `deleteProjectV2Workflow` tồn tại nhưng không có create/update — phải làm trên UI |
| GraphQL **không** set được group-by của view                              | `ProjectV2ViewConfigurationInput` chỉ nhận `visibleFieldIds`                      |
| `filter` chỉ có ở `updateProjectV2View`, không có ở `createProjectV2View` | Tạo view rồi update filter thành 2 bước                                           |
| Layout Roadmap cần field DATE                                             | → quyết định 2.7                                                                  |

## 4. Cái đã cân nhắc và loại

- **Một project cho mỗi package** (9 project) — loại: chia cắt cùng một luồng công việc, và `Package` field giải quyết xong nhu cầu đó.
- **Đưa dependency bump lên board** — loại: chúng auto-merge, một cột trạng thái cho việc không cần quyết định gì là thuế thuần.
- **Dùng cả Milestones và Projects iteration** — loại: hai cơ chế cho cùng một việc. Release không theo lịch nên `Target` dạng text phù hợp hơn iteration cố định độ dài.
- **Label `good first issue` / `help wanted`** — hiện vô nghĩa với dự án nội bộ, chưa dọn.

## 5. Còn mở

- Mấy signal công khai cho một dự án nội bộ: npm `access: public`, doc site, và hai label ở trên. Dọn hay để — chưa quyết.
- `Kind` và `Target` chưa có cách nào tự điền; nếu triage tay tỏ ra tốn công thì cân nhắc một workflow suy `Kind` từ prefix title.
