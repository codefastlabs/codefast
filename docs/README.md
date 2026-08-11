# Chỉ mục tài liệu

Thư mục `docs/` được tổ chức theo **loại tài liệu**, không theo lĩnh vực. Lĩnh vực nằm trong tên file.

Lý do: câu hỏi _"tài liệu này thuộc lĩnh vực nào?"_ thường có nhiều đáp án, nên phân theo lĩnh vực sẽ đẻ ra ngăn kéo tạp
nham. Câu hỏi _"tài liệu này loại gì?"_ chỉ có một đáp án.

---

## Đặt file mới ở đâu

Đi từ trên xuống, dừng ở điều kiện đầu tiên đúng:

| Câu hỏi                                                                  | Thư mục      | Vòng đời                                             |
| ------------------------------------------------------------------------ | ------------ | ---------------------------------------------------- |
| Đây có phải **nguồn chân lý** mà code hoặc bên khác phải bám theo không? | `specs/`     | sống lâu, có owner rõ ràng                           |
| Đây có phải **một quyết định đã chốt + lý do** không?                    | `decisions/` | không sửa sau khi chốt, chỉ thay bằng quyết định mới |
| Đây có phải **hướng dẫn làm một việc** không?                            | `guides/`    | sống lâu, cập nhật khi hệ thống đổi                  |
| Đây có phải **quy trình chạy tay lặp lại** không?                        | `runbooks/`  | sống lâu                                             |
| Đây có phải **việc có thời hạn, có checklist** không?                    | `plans/`     | đóng lại khi xong                                    |
| Đây có phải **ảnh chụp tại một thời điểm** không?                        | `reports/`   | không bao giờ cập nhật, chỉ thêm bản mới             |

Chỉ tạo thư mục khi thật sự có file thuộc loại đó — không dựng thư mục rỗng để "cho đủ bộ".

### Quy ước đặt tên

- kebab-case, không dấu, không hậu tố thừa: `github-project-board.md` chứ không phải `github-project-board-guide.md` (đã
  nằm trong `guides/` rồi)
- Cùng một lĩnh vực có thể xuất hiện ở nhiều loại — `guides/github-project-board.md` và
  `decisions/github-project-board.md` là hai tài liệu khác nhau về cùng một thứ, và đó là bình thường
- `reports/` gắn thời gian vào tên: `security-status-2026-05.md`

---

## decisions/ — quyết định và lý do

Ghi lại đã chọn gì và vì sao. Không sửa nội dung cũ; nếu quyết định thay đổi thì viết bản mới và trỏ ngược lại.

| File                                                           | Nội dung                                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`github-project-board.md`](decisions/github-project-board.md) | Thiết kế board GitHub Projects: chọn gì, vì sao, ràng buộc nào của nền tảng đã buộc đổi thiết kế |

## guides/ — hướng dẫn thao tác

| File                                                        | Nội dung                                            |
| ----------------------------------------------------------- | --------------------------------------------------- |
| [`github-project-board.md`](guides/github-project-board.md) | Board hoạt động thế nào và dùng nó hằng ngày ra sao |

## runbooks/ — quy trình vận hành

| File                                                                      | Nội dung                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`github-project-maintenance.md`](runbooks/github-project-maintenance.md) | Sửa field / workflow / view của board mà không làm vỡ cấu hình |

---

## Tài liệu nằm trong package

Tài liệu chỉ liên quan tới một package thì để ngay trong package đó, không đưa vào `docs/`:

- `packages/di/ARCHITECTURE.md` — nguồn chân lý cho `resolution/`, đọc trước khi sửa hot path; `PERFORMANCE.md` (mỗi
  shape đáng giá bao nhiêu, đo bằng cách nào) và `REJECTED.md` (đã thử và bị loại) đi kèm nó
- `packages/tracking/spec/` — contract hành vi
- `packages/*/README.md`, `packages/*/CHANGELOG.md`

`docs/` dành cho tài liệu cắt ngang nhiều package, hoặc về hạ tầng quanh repo (board, quy trình, vận hành).

Tài liệu ở root có vai trò riêng, không chuyển vào đây: [`CLAUDE.md`](../CLAUDE.md) (hướng dẫn cho agent),
[`TESTING.md`](../TESTING.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md).
