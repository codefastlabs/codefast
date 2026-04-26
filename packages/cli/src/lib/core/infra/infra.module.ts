import { Module } from "@codefast/di";
import { ConfigLoaderPortToken } from "#/lib/config/contracts/tokens";
import { configLoaderAdapter } from "#/lib/config/infra/loader.adapter";
import { CoreModule } from "#/lib/core/core.module";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#/lib/core/infra/logging-decorator.adapter";
import { CliFsToken, CliLoggerToken } from "#/lib/core/contracts/tokens";
import { NodeCliFsAdapter, NodeCliLoggerAdapter } from "#/lib/infra/node-io.adapter";

export const InfraModule = Module.create("cli-infra", (moduleBuilder) => {
  moduleBuilder.import(CoreModule);

  moduleBuilder.bind(CliLoggerToken).to(NodeCliLoggerAdapter).singleton();

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

  moduleBuilder.bind(ConfigLoaderPortToken).toConstantValue(configLoaderAdapter);
});
