// Định nghĩa interface cho cấu hình export của một module trong package
export interface ExportConfig {
  // Cấu hình cho kiểu import (ESM - ES Modules)
  import: {
    // Đường dẫn đến file default cho ESM import
    // Ví dụ: "./dist/esm/index.js"
    default: string;
    // Đường dẫn đến file type definitions cho ESM import
    // Ví dụ: "./dist/types/index.d.ts"
    types: string;
  };
  // Cấu hình cho kiểu require (CJS - CommonJS)
  require: {
    // Đường dẫn đến file default cho CJS require
    // Ví dụ: "./dist/cjs/index.js"
    default: string;
    // Đường dẫn đến file type definitions cho CJS require
    // Ví dụ: "./dist/types/index.d.ts"
    types: string;
  };
}

export type ExportTarget = ExportConfig | string;

// Định nghĩa type cho exports của package, ánh xạ từ key đến cấu hình export
// Key là tên export path (ví dụ: ".", "./submodule"), value có thể là string hoặc ExportConfig
// Ví dụ: { ".": { import: { default: "./dist/esm/index.js", types: "./dist/types/index.d.ts" }, ... } }
export type PackageExports = Record<string, ExportTarget>;

export interface PackageJson {
  [key: string]: unknown;
  name: string;
  version: string;

  exports?: PackageExports;
}
