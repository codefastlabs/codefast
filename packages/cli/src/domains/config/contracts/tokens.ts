import { token } from "@codefast/di";
import type { CodefastConfigSchemaPort } from "#/domains/config/application/outbound/codefast-config-schema.outbound-port";
import type { ConfigLoaderPort } from "#/domains/config/application/outbound/config-loader.outbound-port";
import type { ConfigWarningReporterPort } from "#/domains/config/application/outbound/config-warning-reporter.outbound-port";

export const CodefastConfigSchemaPortToken = token<CodefastConfigSchemaPort>(
  "CodefastConfigSchemaPort",
);

export const ConfigLoaderPortToken = token<ConfigLoaderPort>("ConfigLoaderPort");
export const ConfigWarningReporterPortToken = token<ConfigWarningReporterPort>(
  "ConfigWarningReporterPort",
);
