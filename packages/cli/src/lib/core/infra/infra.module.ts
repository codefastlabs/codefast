import { Module } from "@codefast/di";
import { configLoaderAdapter } from "#lib/config/infra/loader.adapter";
import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import { CoreModule } from "#lib/core/core.module";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#lib/core/infra/logging-decorator.adapter";
import { CliFsToken, CliLoggerToken, ConfigLoaderPortToken } from "#lib/core/tokens";
import { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io.adapter";

function applyCliFsTelemetryOnActivation(rawFs: CliFs, logger: CliLogger): void {
  if (!isCliTelemetryEnabled()) {
    return;
  }
  const telemetryProxy = withCliPortTelemetry({ portName: "CliFs", implementation: rawFs, logger });
  for (const propertyName of Object.keys(rawFs) as Array<keyof CliFs>) {
    const wrappedProperty = telemetryProxy[propertyName];
    if (typeof wrappedProperty === "function") {
      (rawFs as Record<string, unknown>)[propertyName as string] = wrappedProperty as unknown;
    }
  }
}

export const InfraModule = Module.create("cli-infra", (api) => {
  api.import(CoreModule);

  api
    .bind(CliLoggerToken)
    .toDynamic(() => createNodeCliLogger())
    .singleton()
    .build();

  api
    .bind(CliFsToken)
    .toDynamic(() => createNodeCliFs())
    .onActivation((ctx, rawFs) => {
      applyCliFsTelemetryOnActivation(rawFs, ctx.resolve(CliLoggerToken));
    })
    .singleton()
    .build();

  api.bind(ConfigLoaderPortToken).toConstantValue(configLoaderAdapter).singleton().build();
});
