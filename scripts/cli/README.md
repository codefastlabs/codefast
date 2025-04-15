# Command `update-exports`

## Tổng Quan

Command `update-exports` là một công cụ tự động hóa việc cập nhật cấu hình `exports` trong file `package.json` của các package trong dự án. Nó phân tích mã nguồn để xác định các module được export và tạo cấu trúc exports phù hợp.

## Cách Sử Dụng

```shell script
codefast update-exports [options]
```

### Tùy Chọn

| Tùy chọn                  | Mô tả                                            |
| ------------------------- | ------------------------------------------------ |
| `-p, --package <package>` | Lọc theo tên package cụ thể                      |
| `-d, --dry-run`           | Chạy mà không thực hiện thay đổi (chỉ xem trước) |
| `-v, --verbose`           | Hiển thị đầu ra chi tiết                         |
| `-c, --config <path>`     | Đường dẫn đến file cấu hình tùy chỉnh            |

## Luồng Hoạt Động

```
flowchart TD
    A[Bắt đầu update-exports] --> B[processAllPackages]
    B --> C[Tìm kiếm packages với findAllPackages]
    C --> D[Lấy cấu hình với getConfig]
    D --> E[Tìm tất cả package.json với glob]
    E --> F{Đã tìm thấy packages?}
    F -- Không --> G[Hiển thị cảnh báo]
    G --> Z[Kết thúc]
    F -- Có --> H[Xử lý từng package]
    H --> I[processPackage cho từng package]
    I --> J[Đọc package.json]
    J --> K{Match với package filter?}
    K -- Không --> L[Bỏ qua package]
    K -- Có --> M[Phân tích imports với analyzeImports]
    M --> N[Lưu kết quả phân tích]
    N --> O[Tạo exports mới với generateExports]
    O --> P{Dry run mode?}
    P -- Có --> Q[Tạo preview exports]
    Q --> Z
    P -- Không --> R[Sao lưu package.json]
    R --> S[Cập nhật package.json với exports mới]
    S --> Z
```

1. **Khởi tạo và Tìm Kiếm Package**

- Command đọc các tùy chọn từ người dùng
- Tìm kiếm tất cả các file `package.json` trong workspace theo mẫu glob được cấu hình

2. **Xử Lý Từng Package**

- Kiểm tra xem package có khớp với filter hay không (nếu có)
- Đọc cấu hình cụ thể cho package
- Xác định đường dẫn đến file index

3. **Phân Tích Imports**

- Sử dụng ts-morph để phân tích cú pháp của file index
- Tìm tất cả các khai báo export
- Chuẩn hóa đường dẫn (ví dụ: @/ thành ./)
- Bỏ qua các import từ modules bên ngoài
- Xử lý đường dẫn export theo cấu hình

4. **Tạo Exports Mới**

- Dựa trên imports đã phân tích, tạo cấu trúc exports mới
- So sánh với exports hiện tại

5. **Lưu Thay Đổi**

- Nếu ở chế độ dry-run:
  - Tạo preview của exports mới mà không thực hiện thay đổi
- Nếu không ở chế độ dry-run:
  - Tạo bản sao lưu của package.json
  - Cập nhật package.json với exports mới

6. **Báo Cáo Kết Quả**

- Hiển thị thống kê về số lượng package đã xử lý thành công, bỏ qua, thất bại

## Cấu Hình

Command `update-exports` sử dụng file cấu hình để xác định:

- Mẫu glob để tìm packages
- Các prefix đường dẫn cần loại bỏ
- Cấu hình cụ thể cho từng package

Bạn có thể chỉ định file cấu hình tùy chỉnh bằng tùy chọn `-c, --config`.

## Ví Dụ

Cập nhật exports cho tất cả các package:

```shell script
codefast update-exports
```

Chạy ở chế độ verbose để xem thông tin chi tiết:

```shell script
codefast update-exports --verbose
```

Chỉ xử lý một package cụ thể:

```shell script
codefast update-exports --package @codefast/ui
```

Xem trước thay đổi mà không thực sự cập nhật:

```shell script
codefast update-exports --dry-run
```

## Lưu Ý

- Command sẽ tạo bản sao lưu của các file package.json trước khi thực hiện thay đổi
- Các exports được tạo dựa trên việc phân tích mã nguồn, đảm bảo tính nhất quán
- Sử dụng tùy chọn `--dry-run` để kiểm tra các thay đổi trước khi áp dụng
