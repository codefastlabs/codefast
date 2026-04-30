import { token } from "@codefast/di";
import type { ConfigLoaderPort } from "#/domains/config/application/ports/config-loader.port";
import type { ConfigWarningReporterPort } from "#/domains/config/application/ports/config-warning-reporter.port";

export const ConfigLoaderPortToken = token<ConfigLoaderPort>("ConfigLoaderPort");
export const ConfigWarningReporterPortToken = token<ConfigWarningReporterPort>(
  "ConfigWarningReporterPort",
);
