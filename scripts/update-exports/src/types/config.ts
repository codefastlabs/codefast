export interface PackageConfig {
  // Pattern đường dẫn output cho CJS modules
  cjsOutputPattern: string;
  // Pattern đường dẫn output cho ESM modules
  esmOutputPattern: string;
  // Đường dẫn đến package.json
  packageJsonPath: string;
  // Đường dẫn đến file src/index.ts
  srcIndexPath: string;
  // Pattern đường dẫn output cho CJS type definitions
  typesOutputCjsPattern: string;
  // Pattern đường dẫn output cho type definitions
  typesOutputPattern: string;
}

export interface ScriptConfig {
  // Mapping từ package name đến cấu hình tùy chỉnh (nếu có)
  customPackageConfigs: Record<string, Partial<PackageConfig>>;
  // Cấu hình mặc định cho mỗi package
  defaultPackageConfig: PackageConfig;
  // Pattern để tìm tất cả package.json trong workspace
  packagesGlob: string;
}

export interface ProcessOptions {
  dryRun: boolean;
  verbose: boolean;
  configPath?: string;
  packageFilter?: string;
}
