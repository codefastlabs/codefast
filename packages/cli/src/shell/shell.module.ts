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
  CliPortTelemetryPortToken,
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
import { createOptionalCliPortTelemetryActivation } from "#/shell/wiring/optional-cli-port-telemetry-activation";
import { CliPortTelemetryService } from "#/shell/infrastructure/cli-port-telemetry.service";
import { NodeCliPathAdapter } from "#/shell/infrastructure/path.adapter";
import { RepoRootResolver } from "#/shell/infrastructure/workspace/repo-root-resolver.service";
import { NodeCliFsAdapter } from "#/shell/infrastructure/node-cli-fs.adapter";
import { NodeCliLoggerAdapter } from "#/shell/infrastructure/node-cli-logger.adapter";
import { NodeCliRuntimeAdapter } from "#/shell/infrastructure/node-cli-runtime.adapter";
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
  moduleBuilder.bind(CliPortTelemetryPortToken).to(CliPortTelemetryService).singleton();
  moduleBuilder.bind(CliRuntimeToken).to(NodeCliRuntimeAdapter).singleton();
  moduleBuilder.bind(RepoRootResolverPortToken).to(RepoRootResolver).singleton();

  moduleBuilder
    .bind(CliFsToken)
    .to(NodeCliFsAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(CliFsToken));

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
    .onActivation(createOptionalCliPortTelemetryActivation(TypeScriptSourceFileWalkerPortToken));

  moduleBuilder.bind(ConfigLoaderPortToken).to(ConfigLoaderAdapterImpl).singleton();
  moduleBuilder.bind(ConfigWarningReporterPortToken).to(ConfigWarningReporterAdapter).singleton();
  moduleBuilder.bind(LoadCodefastConfigUseCaseToken).to(LoadCodefastConfigUseCaseImpl).singleton();
});
