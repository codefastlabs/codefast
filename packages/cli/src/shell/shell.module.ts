import { Module } from "@codefast/di";
import {
  ConfigLoaderPortToken,
  ConfigWarningReporterPortToken,
} from "#/domains/config/contracts/tokens";
import { ConfigLoaderAdapterImpl } from "#/domains/config/infrastructure/adapters/config-loader.adapter";
import { ConfigWarningReporterAdapter } from "#/domains/config/infrastructure/adapters/config-warning-reporter.adapter";
import { LoadCodefastConfigUseCaseImpl } from "#/shell/application/load-codefast-config.use-case";
import {
  CliFsToken,
  CliLoggerToken,
  CliPathToken,
  CliRuntimeToken,
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/shell/application/cli-runtime.tokens";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#/shell/infrastructure/port-telemetry.decorator";
import { NodeCliPathAdapter } from "#/shell/infrastructure/path.adapter";
import { RepoRootResolverAdapter } from "#/shell/infrastructure/repo-root-resolver.adapter";
import {
  NodeCliFsAdapter,
  NodeCliLoggerAdapter,
  NodeCliRuntimeAdapter,
} from "#/shell/infrastructure/node-io.adapter";

/** Binds path abstraction only (minimal graph for dependents that need resolution before broader IO). */
export const ShellPathModule = Module.create("shell-path", (moduleBuilder) => {
  moduleBuilder.bind(CliPathToken).to(NodeCliPathAdapter).singleton();
});

/** Cross-cutting CLI IO, repo root discovery, telemetry, and `codefast.config` loading. */
export const ShellInfrastructureModule = Module.create("shell-infrastructure", (moduleBuilder) => {
  moduleBuilder.import(ShellPathModule);

  moduleBuilder.bind(CliLoggerToken).to(NodeCliLoggerAdapter).singleton();
  moduleBuilder.bind(CliRuntimeToken).to(NodeCliRuntimeAdapter).singleton();
  moduleBuilder.bind(RepoRootResolverPortToken).to(RepoRootResolverAdapter).singleton();

  moduleBuilder
    .bind(CliFsToken)
    .to(NodeCliFsAdapter)
    .singleton()
    .onActivation((ctx, rawFs) => {
      if (!isCliTelemetryEnabled()) {
        return rawFs;
      }
      return withCliPortTelemetry({
        portName: "CliFs",
        implementation: rawFs,
        logger: ctx.resolve(CliLoggerToken),
      });
    });

  moduleBuilder.bind(ConfigLoaderPortToken).to(ConfigLoaderAdapterImpl).singleton();
  moduleBuilder.bind(ConfigWarningReporterPortToken).to(ConfigWarningReporterAdapter).singleton();
  moduleBuilder.bind(LoadCodefastConfigUseCaseToken).to(LoadCodefastConfigUseCaseImpl).singleton();
});
