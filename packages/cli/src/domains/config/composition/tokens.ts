import { token } from "@codefast/di";
import type { CodefastConfigSchemaPort } from "#/domains/config/application/ports/outbound/codefast-config-schema.port";
import type { ConfigLoaderPort } from "#/domains/config/application/ports/outbound/config-loader.port";
import type { ConfigWarningReporterPort } from "#/domains/config/application/ports/outbound/config-warning-reporter.port";

export const CodefastConfigSchemaPortToken = token<CodefastConfigSchemaPort>(
  "CodefastConfigSchemaPort",
);

export const ConfigLoaderPortToken = token<ConfigLoaderPort>("ConfigLoaderPort");
export const ConfigWarningReporterPortToken = token<ConfigWarningReporterPort>(
  "ConfigWarningReporterPort",
);
