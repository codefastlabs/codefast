# Preview Server - Hai Port trong TanStack Start

## Vấn đề

Khi chạy lệnh `vite preview`, bạn thấy 2 port được tạo ra:

```
➜  Local:   http://localhost:3001/
➜  Listening on: http://localhost:51437/ (all interfaces)
```

## Giải thích

Đây là **hành vi bình thường** của TanStack Start với Nitro. Khi chạy `vite preview`, hệ thống khởi động **2 server**:

### 1. Vite Preview Server (Port 3001)
- **Port**: 3001 (được cấu hình trong `vite.config.ts`)
- **Vai trò**: Server chính để truy cập ứng dụng
- **Chức năng**:
  - Phục vụ static assets
  - Proxy requests đến Nitro server
  - Xử lý client-side routing

### 2. Nitro Server (Port 51437 - Ngẫu nhiên)
- **Port**: 51437 (port ngẫu nhiên, tự động chọn)
- **Vai trò**: Server SSR (Server-Side Rendering) thực sự
- **Chức năng**:
  - Xử lý SSR requests
  - Chạy server functions
  - Xử lý API routes

## Cách hoạt động

```
Browser Request
     ↓
Vite Preview Server (Port 3001)
     ↓ (proxy)
Nitro Server (Port 51437)
     ↓
SSR Processing
```

**Lưu ý quan trọng**: Bạn **chỉ cần truy cập port 3001**. Port 51437 là port nội bộ, không cần truy cập trực tiếp.

## Tại sao có 2 port?

TanStack Start sử dụng kiến trúc:
- **Vite Preview Server**: Xử lý static assets và client-side code
- **Nitro Server**: Xử lý SSR và server-side logic

Điều này cho phép:
- Tối ưu hóa performance (static assets được serve trực tiếp)
- Tách biệt concerns (client vs server)
- Hỗ trợ SSR tốt hơn

## Giải pháp

### Option 1: Chấp nhận hành vi này (Khuyến nghị)

Đây là cách TanStack Start được thiết kế để hoạt động. Chỉ cần:
- Truy cập ứng dụng qua port **3001**
- Bỏ qua port 51437 (port nội bộ)

### Option 2: Chạy Nitro server trực tiếp (Chỉ dùng 1 port)

Nếu bạn muốn chỉ có 1 port, có thể chạy Nitro server trực tiếp:

```bash
# Thay vì: vite preview
# Dùng:
node .output/server/index.mjs
```

**Lưu ý**: Cách này sẽ bỏ qua Vite preview server, chỉ có Nitro server.

Cấu hình port cho Nitro server:

```json
// package.json
{
  "scripts": {
    "start": "PORT=3001 node .output/server/index.mjs"
  }
}
```

### Option 3: Cấu hình Nitro port (Nếu cần)

Nếu bạn muốn cố định port của Nitro server (thay vì ngẫu nhiên), có thể cấu hình trong `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { nitro } from 'nitro/vite';

const config = defineConfig({
  // ... other config
  plugins: [
    nitro({
      // Cấu hình Nitro
      devServer: {
        port: 3002, // Port cho Nitro server (nếu cần)
      },
    }),
  ],
});
```

**Lưu ý**: Điều này không cần thiết vì port 51437 chỉ là port nội bộ.

## Cấu hình hiện tại

Trong dự án của bạn:

```typescript
// vite.config.ts
preview: {
  port: 3001, // Port chính để truy cập
}
```

Port 3001 là port **duy nhất bạn cần quan tâm**.

## Khuyến nghị

**Sử dụng cách hiện tại** (2 port):
- ✅ Đây là cách TanStack Start được thiết kế
- ✅ Tối ưu hóa performance
- ✅ Hỗ trợ SSR tốt
- ✅ Port 3001 là port duy nhất người dùng cần truy cập
- ✅ Port 51437 là port nội bộ, tự động quản lý

## Kiểm tra

Để kiểm tra ứng dụng hoạt động đúng:

1. Truy cập: `http://localhost:3001/`
2. Ứng dụng sẽ tự động proxy đến Nitro server nội bộ
3. Không cần quan tâm đến port 51437

## Tóm tắt

- ✅ **Port 3001**: Port chính để truy cập ứng dụng
- ✅ **Port 51437**: Port nội bộ của Nitro server (tự động, ngẫu nhiên)
- ✅ Đây là hành vi bình thường và đúng như thiết kế
- ✅ Không cần thay đổi gì, chỉ cần truy cập port 3001

