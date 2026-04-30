import { Module } from "@codefast/di";
import {
  CodefastConfigSchemaPortToken,
  ConfigLoaderPortToken,
  ConfigWarningReporterPortToken,
} from "#/domains/config/contracts/tokens";
import { ZodCodefastConfigSchemaAdapter } from "#/domains/config/infrastructure/adapters/zod-codefast-config-schema.adapter";
import { ConfigLoaderAdapterImpl } from "#/domains/config/infrastructure/adapters/config-loader.adapter";
import { ConfigWarningReporterAdapter } from "#/domains/config/infrastructure/adapters/config-warning-reporter.adapter";
import { LoadCodefastConfigUseCaseImpl } from "#/shell/application/load-codefast-config.use-case";
import {
  CliExecutorPortToken,
  CliFsToken,
  CliLoggerToken,
  CliPathToken,
  CliRuntimeToken,
  CliVerboseDiagnosticsPortToken,
  FormatAppErrorPortToken,
  GlobalCliOptionsParsePortToken,
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
  SchemaValidationPortToken,
  TypeScriptSourceFileWalkerPortToken,
  WorkspacePackageLayoutPortToken,
} from "#/shell/application/cli-runtime.tokens";
import { CliExecutorService } from "#/shell/application/services/cli-executor.service";
import { CliVerboseDiagnosticsService } from "#/shell/application/services/cli-verbose-diagnostics.service";
import { FormatAppErrorService } from "#/shell/application/services/format-app-error.service";
import { GlobalCliOptionsParser } from "#/shell/application/services/global-cli-options-parser.service";
import { SchemaValidationService } from "#/shell/application/services/schema-validator.service";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
  withOptionalPortTelemetry,
} from "#/shell/infrastructure/port-telemetry.decorator";
import { NodeCliPathAdapter } from "#/shell/infrastructure/path.adapter";
import { RepoRootResolver } from "#/shell/infrastructure/workspace/repo-root-resolver.service";
import {
  NodeCliFsAdapter,
  NodeCliLoggerAdapter,
  NodeCliRuntimeAdapter,
} from "#/shell/infrastructure/node-io.adapter";
import { NodePnpmWorkspacePackageLayoutAdapter } from "#/shell/infrastructure/workspace/node-pnpm-workspace-package-layout.adapter";
import { TypeScriptSourceFileWalker } from "#/shell/infrastructure/source-code/infrastructure/typescript-source-file-walker.service";

/** Binds path abstraction only (minimal graph for dependents that need resolution before broader IO). */
export const ShellPathModule = Module.create("shell-path", (moduleBuilder) => {
  moduleBuilder.bind(CliPathToken).to(NodeCliPathAdapter).singleton();
});

/** Cross-cutting CLI IO, repo root discovery, telemetry, and `codefast.config` loading. */
export const ShellInfrastructureModule = Module.create("shell-infrastructure", (moduleBuilder) => {
  moduleBuilder.import(ShellPathModule);

  moduleBuilder.bind(CliLoggerToken).to(NodeCliLoggerAdapter).singleton();
  moduleBuilder.bind(CliRuntimeToken).to(NodeCliRuntimeAdapter).singleton();
  moduleBuilder.bind(RepoRootResolverPortToken).to(RepoRootResolver).singleton();

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

  moduleBuilder.bind(CodefastConfigSchemaPortToken).to(ZodCodefastConfigSchemaAdapter).singleton();

  moduleBuilder.bind(SchemaValidationPortToken).to(SchemaValidationService).singleton();
  moduleBuilder.bind(FormatAppErrorPortToken).to(FormatAppErrorService).singleton();
  moduleBuilder.bind(CliVerboseDiagnosticsPortToken).to(CliVerboseDiagnosticsService).singleton();
  moduleBuilder.bind(CliExecutorPortToken).to(CliExecutorService).singleton();
  moduleBuilder.bind(GlobalCliOptionsParsePortToken).to(GlobalCliOptionsParser).singleton();

  moduleBuilder
    .bind(WorkspacePackageLayoutPortToken)
    .to(NodePnpmWorkspacePackageLayoutAdapter)
    .singleton();

  moduleBuilder
    .bind(TypeScriptSourceFileWalkerPortToken)
    .to(TypeScriptSourceFileWalker)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TypeScriptSourceFileWalkerPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder.bind(ConfigLoaderPortToken).to(ConfigLoaderAdapterImpl).singleton();
  moduleBuilder.bind(ConfigWarningReporterPortToken).to(ConfigWarningReporterAdapter).singleton();
  moduleBuilder.bind(LoadCodefastConfigUseCaseToken).to(LoadCodefastConfigUseCaseImpl).singleton();
});
