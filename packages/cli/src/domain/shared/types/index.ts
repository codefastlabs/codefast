export interface ValidationError {
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationRule {
  description: string;
  name: string;
  validate: (component: unknown) => ValidationError[];
}

export type ExportType = "default" | "named" | "namespace";

export interface ExportInfo {
  isComponent: boolean;
  isInterface: boolean;
  isType: boolean;
  name: string;
  type: ExportType;
}
