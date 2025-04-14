export interface ImportPath {
  // Thư mục chứa module (ví dụ: 'components')
  directory: string;
  // Export path cho package.json (ví dụ: './button' hoặc './lib/utils')
  exportPath: string;
  // Tên module (ví dụ: 'Button')
  name: string;
  // Đường dẫn import gốc (ví dụ: './components/Button')
  originalPath: string;
}

export interface AnalysisResult {
  // Tất cả các đường dẫn import đã phân tích
  imports: ImportPath[];
  // Nhóm theo thư mục (components, lib, utils, v.v.)
  importsByDir: Record<string, ImportPath[]>;
}
