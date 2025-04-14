import { z } from "zod";

// Định nghĩa schema để validate cấu hình cho một package
export const packageConfigSchema = z.object({
  // Pattern đường dẫn output cho các module CommonJS (CJS).
  // Ví dụ: "dist/cjs/*.js" để xác định nơi xuất file CJS.
  cjsOutputPattern: z.string(),

  // Pattern đường dẫn output cho các module ES Modules (ESM).
  // Ví dụ: "dist/esm/*.js" để xác định nơi xuất file ESM.
  esmOutputPattern: z.string(),

  // Đường dẫn đến file package.json của package.
  // Dùng để đọc hoặc cập nhật thông tin package (ví dụ: version, exports).
  packageJsonPath: z.string(),

  // Đường dẫn đến file src/index.ts của package.
  // Đây là entry point chính để phân tích exports hoặc build.
  srcIndexPath: z.string(),

  // Pattern đường dẫn output cho các type definitions dùng trong CJS.
  // Ví dụ: "dist/cjs/*.d.ts" để xuất type definitions tương ứng.
  typesOutputCjsPattern: z.string(),

  // Pattern đường dẫn output chung cho các type definitions.
  // Ví dụ: "dist/types/*.d.ts" để xuất type definitions cho cả CJS và ESM.
  typesOutputPattern: z.string(),
});

// Định nghĩa schema để validate cấu hình cho script tổng thể
export const scriptConfigSchema = z.object({
  // Glob pattern để tìm các package trong dự án.
  // Ví dụ: "packages/*" để tìm tất cả thư mục package trong thư mục packages.
  packagesGlob: z.string(),

  // Cấu hình mặc định áp dụng cho tất cả packages.
  // Đảm bảo mọi package đều có cấu hình hợp lệ nếu không được tùy chỉnh.
  defaultPackageConfig: packageConfigSchema,

  // Record chứa các cấu hình tùy chỉnh cho từng package.
  // Key là tên package, value là cấu hình partial để ghi đè defaultPackageConfig.
  // Ví dụ: { "my-package": { cjsOutputPattern: "dist/custom/*.js" } }.
  customPackageConfigs: z.record(z.string(), packageConfigSchema.partial()),
});

// TypeScript type được suy ra từ packageConfigSchema.
// Đại diện cho cấu hình của một package với các thuộc tính đã định nghĩa.
export type PackageConfig = z.infer<typeof packageConfigSchema>;

// TypeScript type được suy ra từ scriptConfigSchema.
// Đại diện cho cấu hình của script, bao gồm glob pattern và các cấu hình package.
export type ScriptConfig = z.infer<typeof scriptConfigSchema>;
