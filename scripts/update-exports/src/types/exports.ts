export interface ExportConfig {
  import: {
    default: string;
    types: string;
  };
  require: {
    default: string;
    types: string;
  };
}

export type PackageExports = Record<string, any | ExportConfig>;
