export interface ConfigWarningReporterPort {
  reportSchemaWarnings(warnings: readonly string[]): void;
}
