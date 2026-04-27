import { Module } from "@codefast/di";
import {
  ConfigLoaderPortToken,
  ConfigWarningReporterPortToken,
} from "#/lib/config/contracts/tokens";
import { ConfigLoaderAdapterImpl } from "#/lib/config/infrastructure/config-loader.adapter";
import { ConfigWarningReporterAdapter } from "#/lib/config/infrastructure/config-warning-reporter.adapter";
import { LoadCodefastConfigUseCaseImpl } from "#/lib/core/application/load-codefast-config.use-case";
import { CoreModule } from "#/lib/core/core.module";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#/lib/core/infrastructure/port-telemetry.util";
import {
  CliFsToken,
  CliLoggerToken,
  CliRuntimeToken,
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/lib/core/contracts/tokens";
import { RepoRootResolverAdapter } from "#/lib/core/infrastructure/repo-root-resolver.adapter";
import {
  NodeCliFsAdapter,
  NodeCliLoggerAdapter,
  NodeCliRuntimeAdapter,
} from "#/lib/infrastructure/node-io.adapter";

export const InfrastructureModule = Module.create("cli-infrastructure", (moduleBuilder) => {
  moduleBuilder.import(CoreModule);

  moduleBuilder.bind(CliLoggerToken).to(NodeCliLoggerAdapter).singleton();
  moduleBuilder.bind(CliRuntimeToken).to(NodeCliRuntimeAdapter).singleton();
  moduleBuilder.bind(RepoRootResolverPortToken).to(RepoRootResolverAdapter).singleton();

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
  moduleBuilder.bind(LoadCodefastConfigUseCaseToken).to(LoadCodefastConfigUseCaseImpl).singleton();
});
