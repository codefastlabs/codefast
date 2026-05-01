import { Module } from "@codefast/di";
import {
  CodefastConfigSchemaPortToken,
  ConfigLoaderPortToken,
  ConfigWarningReporterPortToken,
} from "#/domains/config/composition/tokens";
import { ZodCodefastConfigSchemaAdapter } from "#/domains/config/infrastructure/adapters/zod-codefast-config-schema.adapter";
import { ConfigLoaderAdapterImpl } from "#/domains/config/infrastructure/adapters/config-loader.adapter";
import { ConfigWarningReporterAdapter } from "#/domains/config/infrastructure/adapters/config-warning-reporter.adapter";
import { LoadCodefastConfigUseCaseImpl } from "#/shell/application/use-cases/load-codefast-config.use-case";
import {
  CliExecutorToken,
  CliFilesystemPortToken,
  CliLoggerPortToken,
  CliPathPortToken,
  CliTelemetryPortToken,
  CliRuntimeToken,
  CliVerboseDiagnosticsPortToken,
  FormatAppErrorPortToken,
  GlobalCliOptionsParsePortToken,
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
  CliSchemaParsingToken,
  TypeScriptSourceFileWalkerPortToken,
  WorkspacePackageLayoutPortToken,
} from "#/shell/application/cli-runtime.tokens";
import { CliExecutorService } from "#/shell/application/services/cli-executor.service";
import { CliVerboseDiagnosticsService } from "#/shell/application/services/cli-verbose-diagnostics.service";
import { FormatAppErrorService } from "#/shell/application/services/format-app-error.service";
import { GlobalCliOptionsParser } from "#/shell/application/services/global-cli-options-parser.service";
import { SchemaValidationService } from "#/shell/application/services/schema-validator.service";
import { createOptionalCliPortTelemetryActivation } from "#/shell/wiring/optional-cli-port-telemetry-activation";
import { NodeCliFsAdapter } from "#/shell/infrastructure/node/node-cli-fs.adapter";
import { NodeCliLoggerAdapter } from "#/shell/infrastructure/node/node-cli-logger.adapter";
import { NodeCliPathAdapter } from "#/shell/infrastructure/node/node-cli-path.adapter";
import { NodeCliRuntimeAdapter } from "#/shell/infrastructure/node/node-cli-runtime.adapter";
import { CliTelemetryService } from "#/shell/infrastructure/telemetry/cli-telemetry.service";
import { TypeScriptSourceFileWalker } from "#/shell/infrastructure/typescript-source-file-walker.adapter";
import { NodePnpmWorkspacePackageLayoutAdapter } from "#/shell/infrastructure/workspace/node-pnpm-workspace-package-layout.adapter";
import { RepoRootResolver } from "#/shell/infrastructure/repo-root-resolver.adapter";

/** Cross-cutting CLI IO, repo root discovery, telemetry, and `codefast.config` loading. */
export const ShellInfrastructureModule = Module.create("shell-infrastructure", (moduleBuilder) => {
  moduleBuilder.bind(CliPathPortToken).to(NodeCliPathAdapter).singleton();

  moduleBuilder.bind(CliLoggerPortToken).to(NodeCliLoggerAdapter).singleton();
  moduleBuilder.bind(CliTelemetryPortToken).to(CliTelemetryService).singleton();
  moduleBuilder.bind(CliRuntimeToken).to(NodeCliRuntimeAdapter).singleton();
  moduleBuilder.bind(RepoRootResolverPortToken).to(RepoRootResolver).singleton();

  moduleBuilder
    .bind(CliFilesystemPortToken)
    .to(NodeCliFsAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(CliFilesystemPortToken));

  moduleBuilder.bind(CodefastConfigSchemaPortToken).to(ZodCodefastConfigSchemaAdapter).singleton();

  moduleBuilder.bind(CliSchemaParsingToken).to(SchemaValidationService).singleton();
  moduleBuilder.bind(FormatAppErrorPortToken).to(FormatAppErrorService).singleton();
  moduleBuilder.bind(CliVerboseDiagnosticsPortToken).to(CliVerboseDiagnosticsService).singleton();
  moduleBuilder.bind(CliExecutorToken).to(CliExecutorService).singleton();
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
