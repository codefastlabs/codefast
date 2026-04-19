import { Module } from "@codefast/di";
import { configLoaderAdapter } from "#/lib/config/infra/loader.adapter";
import { CoreModule } from "#/lib/core/core.module";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#/lib/core/infra/logging-decorator.adapter";
import { CliFsToken, CliLoggerToken, ConfigLoaderPortToken } from "#/lib/core/tokens";
import { createNodeCliFs, createNodeCliLogger } from "#/lib/infra/node-io.adapter";

export const InfraModule = Module.create("cli-infra", (api) => {
  api.import(CoreModule);

  api
    .bind(CliLoggerToken)
    .toDynamic(() => createNodeCliLogger())
    .singleton();

  api
    .bind(CliFsToken)
    .toDynamic(() => createNodeCliFs())
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

  api.bind(ConfigLoaderPortToken).toConstantValue(configLoaderAdapter);
});
