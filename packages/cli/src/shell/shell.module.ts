import { Module } from "@codefast/di";
import {
  CodefastConfigSchemaPortToken,
  ConfigLoaderPortToken,
  ConfigWarningReporterPortToken,
} from "#/domains/config/composition/tokens";
import { ZodCodefastConfigSchemaAdapter } from "#/domains/config/infrastructure/adapters/zod-codefast-config-schema.adapter";
import { ConfigLoaderAdapter } from "#/domains/config/infrastructure/adapters/config-loader.adapter";
import { ConfigWarningReporterAdapter } from "#/domains/config/infrastructure/adapters/config-warning-reporter.adapter";
import { LoadCodefastConfigUseCase } from "#/shell/application/use-cases/load-codefast-config.use-case";
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
import { CliVerboseDiagnosticsAdapter } from "#/shell/infrastructure/adapters/cli-verbose-diagnostics.adapter";
import { FormatAppErrorAdapter } from "#/shell/infrastructure/adapters/format-app-error.adapter";
import { GlobalCliOptionsParserAdapter } from "#/shell/infrastructure/adapters/global-cli-options-parser.adapter";
import { SchemaValidatorService } from "#/shell/application/services/schema-validator.service";
import { createOptionalCliPortTelemetryActivation } from "#/shell/wiring/optional-cli-port-telemetry-activation";
import { NodeCliFsAdapter } from "#/shell/infrastructure/node/node-cli-fs.adapter";
import { NodeCliLoggerAdapter } from "#/shell/infrastructure/node/node-cli-logger.adapter";
import { NodeCliPathAdapter } from "#/shell/infrastructure/node/node-cli-path.adapter";
import { NodeCliRuntimeAdapter } from "#/shell/infrastructure/node/node-cli-runtime.adapter";
import { CliTelemetryAdapter } from "#/shell/infrastructure/telemetry/cli-telemetry.adapter";
import { TypeScriptSourceFileWalkerAdapter } from "#/shell/infrastructure/adapters/typescript-source-file-walker.adapter";
import { NodePnpmWorkspacePackageLayoutAdapter } from "#/shell/infrastructure/workspace/node-pnpm-workspace-package-layout.adapter";
import { RepoRootResolverAdapter } from "#/shell/infrastructure/adapters/repo-root-resolver.adapter";

/** Cross-cutting CLI IO, repo root discovery, telemetry, and `codefast.config` loading. */
export const ShellInfrastructureModule = Module.create("shell-infrastructure", (moduleBuilder) => {
  moduleBuilder.bind(CliPathPortToken).to(NodeCliPathAdapter).singleton();

  moduleBuilder.bind(CliLoggerPortToken).to(NodeCliLoggerAdapter).singleton();
  moduleBuilder.bind(CliTelemetryPortToken).to(CliTelemetryAdapter).singleton();
  moduleBuilder.bind(CliRuntimeToken).to(NodeCliRuntimeAdapter).singleton();
  moduleBuilder.bind(RepoRootResolverPortToken).to(RepoRootResolverAdapter).singleton();

  moduleBuilder
    .bind(CliFilesystemPortToken)
    .to(NodeCliFsAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(CliFilesystemPortToken));

  moduleBuilder.bind(CodefastConfigSchemaPortToken).to(ZodCodefastConfigSchemaAdapter).singleton();

  moduleBuilder.bind(CliSchemaParsingToken).to(SchemaValidatorService).singleton();
  moduleBuilder.bind(FormatAppErrorPortToken).to(FormatAppErrorAdapter).singleton();
  moduleBuilder.bind(CliVerboseDiagnosticsPortToken).to(CliVerboseDiagnosticsAdapter).singleton();
  moduleBuilder.bind(CliExecutorToken).to(CliExecutorService).singleton();
  moduleBuilder.bind(GlobalCliOptionsParsePortToken).to(GlobalCliOptionsParserAdapter).singleton();

  moduleBuilder
    .bind(WorkspacePackageLayoutPortToken)
    .to(NodePnpmWorkspacePackageLayoutAdapter)
    .singleton();

  moduleBuilder
    .bind(TypeScriptSourceFileWalkerPortToken)
    .to(TypeScriptSourceFileWalkerAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(TypeScriptSourceFileWalkerPortToken));

  moduleBuilder.bind(ConfigLoaderPortToken).to(ConfigLoaderAdapter).singleton();
  moduleBuilder.bind(ConfigWarningReporterPortToken).to(ConfigWarningReporterAdapter).singleton();
  moduleBuilder.bind(LoadCodefastConfigUseCaseToken).to(LoadCodefastConfigUseCase).singleton();
});
