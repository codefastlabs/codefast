# Setup Environment Action

Action này thiết lập môi trường phát triển cho dự án CodeFast, đảm bảo tính nhất quán giữa các workflows.

## Tính năng

- Cấu hình Node.js
- Cài đặt và cấu hình pnpm
- Cài đặt dependencies với caching
- Tối ưu Turborepo caching

## Sử dụng

```yaml
steps:
  - name: Setup Environment
    uses: ./.github/actions/setup-environment
    with:
      node-version: "22" # Tùy chọn, mặc định là '22'
      install-dependencies: "true" # Tùy chọn, mặc định là 'true'
      enable-remote-cache: "true" # Tùy chọn, mặc định là 'true'
```

## Tham số

| Tham số                   | Mô tả                            | Mặc định                             |
| ------------------------- | -------------------------------- | ------------------------------------ |
| `node-version`            | Phiên bản Node.js                | `22`                                 |
| `package-manager-version` | Phiên bản pnpm                   | _lastest_                            |
| `install-dependencies`    | Có cài đặt dependencies          | `true`                               |
| `install-options`         | Tùy chọn cài đặt                 | `--prefer-offline --frozen-lockfile` |
| `registry-url`            | URL registry                     | `https://registry.npmjs.org`         |
| `enable-remote-cache`     | Kích hoạt Turborepo remote cache | `true`                               |

## Outputs

| Output            | Mô tả                               |
| ----------------- | ----------------------------------- |
| `turbo-cache-hit` | Liệu Turborepo cache có match không |
