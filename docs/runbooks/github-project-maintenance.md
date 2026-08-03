# Sửa cấu hình board GitHub Projects

> **Board:** [`orgs/codefastlabs/projects/4`](https://github.com/orgs/codefastlabs/projects/4) · **Project ID:** `PVT_kwDOBoFaAM4BfM8Z`
>
> **Cập nhật:** 2026-08-03 · Board dùng thế nào: [`guides/github-project-board.md`](../guides/github-project-board.md)

Quy trình sửa field / workflow / view mà không làm vỡ cấu hình. Mỗi mục dưới đây là một cái bẫy đã sập thật một lần.

---

## 0. Chuẩn bị

Token `gh` cần scope project:

```bash
gh auth refresh -s project,read:project
```

Đọc toàn bộ trạng thái hiện tại — chạy cái này trước và sau mọi thay đổi:

```bash
gh api graphql -f query='{ organization(login:"codefastlabs"){ projectV2(number:4){
  fields(first:20){ nodes{ ... on ProjectV2SingleSelectField { id name options{ id name } } } }
  views(first:10){ nodes{ number name layout filter groupByFields(first:2){nodes{... on ProjectV2FieldCommon{name}}} } }
  workflows(first:20){ nodes{ name enabled } } } } }'
```

---

## 1. Thêm/sửa option của single-select — **phải truyền `id` của option cũ**

`updateProjectV2Field` **thay toàn bộ** danh sách option. Truyền chỉ `name` cho những option đang tồn tại sẽ **tạo option mới hoàn toàn**, và mọi workflow đang trỏ tới option cũ **mất target** — chúng hiện icon cảnh báo đỏ và ngừng hoạt động cho tới khi được cấu hình lại từng cái.

**Bước 1** — lấy `id` các option hiện có:

```bash
gh api graphql -f query='{ organization(login:"codefastlabs"){ projectV2(number:4){ fields(first:20){ nodes{
  ... on ProjectV2SingleSelectField { id name options{ id name color description } } } } } } }'
```

**Bước 2** — gửi lại **đầy đủ** danh sách, giữ nguyên `id` cho option cũ, bỏ `id` cho option mới:

```bash
gh api graphql -f query='mutation { updateProjectV2Field(input:{
  fieldId:"PVTSSF_…",
  singleSelectOptions:[
    {id:"e9f49f6d", name:"Inbox",   color:GRAY, description:"Chưa triage"},
    {              name:"Someday", color:PINK, description:"Park có chủ ý"}
  ]}) { projectV2Field { ... on ProjectV2SingleSelectField { options{ name } } } } }'
```

**Bước 3** — verify workflow còn nguyên. `enabled: true` **không** chứng minh target còn đúng; phải mở trang workflows và xác nhận **không có icon cảnh báo đỏ** nào.

`color` là enum: `GRAY` `BLUE` `GREEN` `YELLOW` `ORANGE` `RED` `PINK` `PURPLE`. `name`, `color`, `description` đều bắt buộc; `id` là optional.

## 2. Sửa built-in workflow — chỉ làm được trên UI

GraphQL **không** có mutation tạo/sửa built-in workflow (chỉ có `deleteProjectV2Workflow`). Phải vào `…/projects/4/workflows`.

**Lưu và bật là hai bước, không phải một.** Nút `Save and turn on workflow` chỉ ghi cấu hình — workflow **vẫn Off**. Phải bấm tiếp toggle ở góc phải. Đúng cho mọi workflow, dù nút có chữ "turn on".

Kiểm chứng bằng counter `Workflows N` ở header, hoặc:

```bash
gh api graphql -f query='{ organization(login:"codefastlabs"){ projectV2(number:4){ workflows(first:20){ nodes{ name enabled } } } } }'
```

Workflow đã bật sẽ **nhảy lên đầu sidebar**, nên vị trí các mục đổi sau mỗi lần bật — đọc lại nhãn thay vì nhớ toạ độ.

## 3. Sửa filter auto-add

Trên UI: `Auto-add to project` → `Edit` → ô Filters.

**Field được hỗ trợ khác với GitHub search thường:**

| Cú pháp                | Được?                                             |
| ---------------------- | ------------------------------------------------- |
| `is:issue` `is:open`   | ✅                                                |
| `-label:x`             | ✅                                                |
| `kind:idea,learn`      | ✅ custom field, dùng cho view filter             |
| `author:` / `-author:` | ❌ `Invalid filter: Unknown field names "author"` |
| `-head:branch-name`    | ❌ chưa kiểm chứng, giả định không                |

Không có autocomplete gợi ý field. UI báo lỗi đỏ ngay dưới ô nếu cú pháp sai — dùng đó làm cách kiểm chứng.

## 4. Đổi group-by của view — UI, và có dialog xác nhận

GraphQL **không** set được group-by (`ProjectV2ViewConfigurationInput` chỉ nhận `visibleFieldIds`).

Trên UI: mở view → nút `View` (bánh răng, góc phải) → `Group by` → chọn field → **`Save view`** (nằm trong cùng menu đó, không phải trong menu của tab) → **bấm `Save` trong dialog xác nhận** _"Saving these display options will make it the default for everyone in this view"_.

Bỏ bước dialog là thay đổi **không được lưu**, và reload là mất. Dấu xanh trên bánh răng `View` = có thay đổi chưa lưu.

Board trống (0 item) **không hiện group header**, nên không thể dùng mắt để xác nhận. Verify bằng API:

```bash
gh api graphql -f query='{ organization(login:"codefastlabs"){ projectV2(number:4){ views(first:10){ nodes{
  number name groupByFields(first:2){ nodes{ ... on ProjectV2FieldCommon { name } } } } } } } }'
```

## 5. Tạo/xoá view — API được

`createProjectV2View` nhận `projectId`, `name`, `layout` (`BOARD_LAYOUT` · `TABLE_LAYOUT` · `ROADMAP_LAYOUT`) và `configuration`. **Không** nhận `filter` — phải `updateProjectV2View` ở bước hai.

```bash
gh api graphql -f query='mutation { createProjectV2View(input:{
  projectId:"PVT_kwDOBoFaAM4BfM8Z", name:"Ideas", layout:TABLE_LAYOUT
}) { projectV2View { id number } } }'

gh api graphql -f query='mutation { updateProjectV2View(input:{
  viewId:"PVTV_…", filter:"kind:idea,learn"
}) { projectV2View { number filter } } }'
```

Group-by vẫn phải làm trên UI theo §4.

Xoá view: `deleteProjectV2View(input:{viewId:"…"})` — chỉ trả `clientMutationId`, không trả về view đã xoá. **Số view không được cấp lại** sau khi xoá, nên thứ tự số sẽ có lỗ.

## 6. Sửa README / description của project

```bash
gh api graphql -F readme=@docs/…/file.md -f query='mutation($readme:String!) {
  updateProjectV2(input:{ projectId:"PVT_kwDOBoFaAM4BfM8Z", readme:$readme,
    shortDescription:"…" }) { projectV2 { shortDescription } } }'
```

`updateProjectV2Input` nhận: `title` `shortDescription` `readme` `closed` `public`.

## 7. Draft issue

```bash
# tạo
gh api graphql -f query='mutation { addProjectV2DraftIssue(input:{
  projectId:"PVT_kwDOBoFaAM4BfM8Z", title:"…", body:"…"
}) { projectItem { id type } } }'

# xoá
gh api graphql -f query='mutation { deleteProjectV2Item(input:{
  projectId:"PVT_kwDOBoFaAM4BfM8Z", itemId:"PVTI_…"
}) { deletedItemId } }'
```

Draft issue **được workflow xử lý như item thường** — nhận `Status: Inbox` khi thêm, và bị `Auto-close issue` đóng nếu chuyển sang `Done`.

Nâng draft thành issue thật: `convertProjectV2DraftIssueItemToIssue`.

## 8. Nếu board là private thì browser tool phải đang đăng nhập

Board private trả **404** cho truy cập vô danh — không phải lỗi đường dẫn. Trước khi kết luận URL sai, kiểm tra trạng thái đăng nhập của đúng browser đang điều khiển: mỗi browser/profile có session riêng, và tab mở ở profile khác **không dùng chung cookie**.
