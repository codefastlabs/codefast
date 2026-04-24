# Hướng dẫn bench cho người mới

_English: [BENCH_GUIDE.md](./BENCH_GUIDE.md)_

Tài liệu này nằm cạnh [README.md](./README.md) và mô tả **cách harness hoạt động**, **các thuật ngữ** và **cách đọc số** mà không cần lần lại toàn bộ mã nguồn.

## Bench này là gì

- **Mục tiêu**: So sánh **@codefast/di** và **InversifyJS 8** trên cùng các kịch bản **gần với production** (đường resolve, đồ thị, async, vòng đời, scope, boot), không phải API đồ chơi tách rời.
- **Công cụ đo**: Mỗi scenario là một **task** [tinybench](https://github.com/tinylibs/tinybench): harness gọi closure nhiều lần, ghi độ trễ, rồi suy ra throughput và phân vị.
- **Cấu trúc chạy**: Hai **tiến trình con** (mỗi thư viện một) để trạng thái JIT của V8 bên này không ảnh hưởng bên kia. Tiến trình cha gom kết quả thành bảng và JSONL.

Nếu chỉ đọc thêm một file sau khi chạy bench, hãy xem mục **Environment** và **Comparable scenarios** ở đầu `bench-results/latest.md`.

## Mô hình tư duy: parent → child → tinybench

1. Bạn chạy `pnpm bench` (các biến thể xem README).
2. **Parent** (`src/harness/run.ts`) spawn một child cho codefast và một cho inversify.
3. Mỗi **child** chạy **N lần trial** (`BENCH_TRIALS`, mặc định 2 hoặc 3 ở chế độ full). Mỗi trial tạo `Bench` mới, đăng ký mọi scenario dưới dạng **task** tinybench, gọi `bench.run()`, rồi thu thống kê từng task.
4. Child in **một object JSON** ra stdout, khung bởi `BENCH_RESULT_JSON_START` / `BENCH_RESULT_JSON_END` để log lạc đường không làm hỏng parse.
5. Parent **gộp** các trial thành median và IQR (`src/harness/report.ts`) và ghi `bench-results/latest.md` cùng `latest.jsonl`.

## Bảng thuật ngữ

| Thuật ngữ                                    | Nghĩa                                                                                                                                                                                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**                                 | Một bench có tên (một dòng trên báo cáo), ví dụ `constant-resolve`. Triển khai theo từng thư viện tại `src/scenarios/codefast/*.ts` và `src/scenarios/inversify/*.ts`.                                                                                    |
| **Group**                                    | Nhãn gom kịch bản để đọc: `micro`, `realistic`, `fan-out`, `async`, `lifecycle`, `scope`, `scale`, `boot`.                                                                                                                                                |
| **Task**                                     | Đơn vị công việc của tinybench: hàm `fn` của scenario (sync hoặc async).                                                                                                                                                                                  |
| **Iteration**                                | Một lần thực thi `fn` của task trong một lần `run()` của tinybench.                                                                                                                                                                                       |
| **Batch**                                    | Số **thao tác logic** trong một iteration. Nếu một lần resolve nhanh hơn độ phân giải của `performance.now()`, scenario lặp `batch` lần trong `fn`; phần báo cáo quy đổi throughput để **hz/op** là “trên mỗi op logic”, không phải “mỗi vòng lặp batch”. |
| **Logical operation (op logic)**             | Bạn quy ước “một op” là gì (ví dụ một `container.get`, một lần build graph lạnh). Cùng ý với `batch` trong giao thức.                                                                                                                                     |
| **Trial**                                    | Một vòng đầy đủ: `Bench` mới, chạy hết task, ghi số. Nhiều trial bắt **phương sai giữa các lần chạy** (JIT, GC, nhiễu OS).                                                                                                                                |
| **hz/op**                                    | **Số thao tác/giây trên mỗi op logic**: `throughput.mean` của tinybench × `batch`. Cao hơn = throughput lớn hơn. Số in ra là **median trên các trial** (mỗi scenario, mỗi thư viện).                                                                      |
| **hz/iteration**                             | Throughput mỗi lần gọi closure bench (một bước lặp). Hữu ích khi debug; bảng markdown dùng **hz/op**.                                                                                                                                                     |
| **mean ms**                                  | Độ trễ trung bình một **iteration** (ms), từ `latency.mean` của tinybench. Trong báo cáo: **median của giá trị đó trên các trial** (mỗi thư viện).                                                                                                        |
| **p75 / p99 / p999 ms**                      | Phân vị độ trễ iteration trong một trial. Bảng markdown hiện **p99** (cũng lấy **median trên các trial**).                                                                                                                                                |
| **Median across trials (median theo trial)** | Với mỗi chỉ số, harness sắp xếp giá trị theo trial rồi lấy phân vị 50. Cách này giảm ảnh hưởng trial đầu (warmup) và cú spike GC hơn là dùng trung bình số học.                                                                                           |
| **IQR (khoảng tứ phân vị)**                  | Với **hz/op** trên các trial: Q75 − Q25, chia cho **median hz/op**. Hiển thị dạng **phần trăm** trong `IQR (cf / inv)`. IQR lớn ⇒ throughput kém ổn định giữa các trial; **> ~5%** nên xem là “nhiễu — chạy lại hoặc đừng kết luận quá chắc”.             |
| **codefast / inversify**                     | Tỷ số median **hz/op**. **> 1×** ⇒ codefast throughput cao hơn trên dòng đó; **< 1×** ⇒ inversify cao hơn. `—` nếu không xác định được tỷ số (ví dụ thiếu số).                                                                                            |
| **Fingerprint**                              | Siêu dữ liệu dán vào báo cáo: phiên bản Node/V8, nền tảng, CPU, `NODE_OPTIONS`, phiên bản thư viện, `gc` có bật hay không, timestamp. Dùng để so sánh công bằng giữa các lần chạy.                                                                        |
| **Sanity check**                             | Kiểm tra nhanh trước khi bench; nếu fail thì scenario đó bị **bỏ qua** cho thư viện đó và liệt kê dưới “Sanity failures”. Thiếu dòng ≠ “không hỗ trợ”; xem phần đầu báo cáo.                                                                              |
| **Comparable scenarios**                     | Bảng so sánh chính: cả hai thư viện cùng chạy cùng id scenario khi có thể. Một số dòng **chỉ một thư viện** (ví dụ chỉ codefast); phía còn lại hiện `—`.                                                                                                  |
| **Stress**                                   | Cờ tùy chọn trên scenario (`stress: true` đánh dấu tải nặng hơn). Có trong wire format và JSONL để lọc hoặc tài liệu; không có cột riêng trong bảng markdown.                                                                                             |
| **`what`**                                   | Chuỗi mô tả ngắn cho từng scenario trong giao thức (không nhất thiết lặp lại trong bảng markdown).                                                                                                                                                        |
| **JSONL**                                    | `bench-results/latest.jsonl`: mỗi dòng một object JSON, một **quan sát** cho bộ `(library, trialIndex, scenario)` kèm fingerprint — tiện cho pandas, DuckDB, jq.                                                                                          |
| **GC exposed**                               | Node chạy với `--expose-gc` để harness gọi `globalThis.gc()` giữa task/trial, giảm phương sai do GC ở scenario cấp phát nhiều (nhất là `BENCH_FULL=1`).                                                                                                   |

## Đọc `bench-results/latest.md`

| Cột                                      | Diễn giải                                                  |
| ---------------------------------------- | ---------------------------------------------------------- |
| **Scenario**                             | Bench nào.                                                 |
| **Group**                                | Nhóm kịch bản.                                             |
| **batch**                                | Số op logic mỗi iteration tinybench ở dòng đó.             |
| **codefast hz/op** / **inversify hz/op** | Median throughput trên mỗi op logic.                       |
| **codefast / inversify**                 | Tỷ lệ throughput (xem bảng thuật ngữ).                     |
| **\* mean ms**                           | Median theo trial của trung bình độ trễ iteration.         |
| **\* p99 ms**                            | Median theo trial của p99 độ trễ iteration (đuôi phân bố). |
| **IQR (cf / inv)**                       | Độ ổn định **hz/op** qua các trial, từng thư viện.         |

**Throughput so với độ trễ**: Có thể tối ưu kịch bản theo **throughput** (`batch` lớn, hz/op cao) hoặc theo **độ trễ** (`batch` 1, nhạy mean/p99). So sánh đúng dòng: cùng **Scenario** và **batch** trên cùng cấu hình máy.

## Chế độ decorator chuẩn (tại sao “táo với táo” không đơn giản)

Mỗi thư viện chạy theo cách **dự kiến khi ship** (Stage 3 decorators + `Symbol.metadata` so với legacy decorators + `reflect-metadata`). README giải thích lý do. Khi thêm scenario, giữ quy tắc: đừng ép một thư viện sang chế độ decorator của bên kia trừ khi bạn cố ý làm thí nghiệm tách.

## Tìm trong mã nguồn

| Chủ đề                                  | Vị trí                    |
| --------------------------------------- | ------------------------- |
| Giao thức, định nghĩa trường            | `src/harness/protocol.ts` |
| Vòng trial, tùy chọn tinybench, hook GC | `src/harness/trial.ts`    |
| Median, IQR, markdown / JSONL           | `src/harness/report.ts`   |
| Spawn child, ghi `latest.*`             | `src/harness/run.ts`      |
| Danh sách scenario / types              | `src/scenarios/types.ts`  |
| Đồ thị chung / fixtures                 | `src/fixtures/`           |

## Lệnh (nhắc nhanh)

Xem [README.md](./README.md) về `pnpm bench`, `BENCH_FAST`, `BENCH_FULL`, `BENCH_TRIALS`, `BENCH_VERBOSE` và đường dẫn output.

Khi chia sẻ số, nên dán cả block **Environment** và bảng **Comparable scenarios** (hoặc cả `latest.md`) để người khác tái tạo và đánh giá nhiễu qua **IQR** và **fingerprint**.
