import { Module } from "@codefast/di";
import {
  ConfigLoaderPortToken,
  ConfigWarningReporterPortToken,
} from "#/lib/config/contracts/tokens";
import { ConfigLoaderAdapterImpl } from "#/lib/config/infra/config-loader.adapter";
import { ConfigWarningReporterAdapter } from "#/lib/config/infra/config-warning-reporter.adapter";
import { CoreModule } from "#/lib/core/core.module";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#/lib/core/infra/logging-decorator.adapter";
import { CliFsToken, CliLoggerToken, CliRuntimeToken } from "#/lib/core/contracts/tokens";
import {
  NodeCliFsAdapter,
  NodeCliLoggerAdapter,
  NodeCliRuntimeAdapter,
} from "#/lib/infra/node-io.adapter";

export const InfraModule = Module.create("cli-infra", (moduleBuilder) => {
  moduleBuilder.import(CoreModule);

  moduleBuilder.bind(CliLoggerToken).to(NodeCliLoggerAdapter).singleton();
  moduleBuilder.bind(CliRuntimeToken).to(NodeCliRuntimeAdapter).singleton();

  moduleBuilder
    .bind(CliFsToken)
    .to(NodeCliFsAdapter)
    .onActivation((ctx, rawFs) => {
      if (!isCliTelemetryEnabled()) {
        return rawFs;
      }
      return withCliPortTelemetry({
        portName: "CliFs",
        implementation: rawFs,
        logger: ctx.resolve(CliLoggerToken),
      });
    })
    .singleton();

  moduleBuilder.bind(ConfigLoaderPortToken).to(ConfigLoaderAdapterImpl).singleton();
  moduleBuilder.bind(ConfigWarningReporterPortToken).to(ConfigWarningReporterAdapter).singleton();
});
