import { token } from "@codefast/di";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import type { CliTelemetryPort } from "#/shell/application/ports/outbound/cli-telemetry.port";
import type { CliVerboseDiagnosticsPort } from "#/shell/application/ports/outbound/cli-verbose-diagnostics.port";
import type { FormatAppErrorPort } from "#/shell/application/ports/outbound/format-app-error.port";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/outbound/global-cli-options-parse.port";
import type { FilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { CliPathPort } from "#/shell/application/ports/outbound/cli-path.port";
import type { RepoRootResolverPort } from "#/shell/application/ports/outbound/repo-root-resolver.port";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/ports/outbound/typescript-source-file-walker.port";
import type { WorkspacePackageLayoutPort } from "#/shell/application/ports/outbound/workspace-package-layout.port";
import type { LoadCodefastConfigPort } from "#/shell/application/ports/inbound/load-codefast-config.port";

export const CliTelemetryPortToken = token<CliTelemetryPort>("CliTelemetryPort");

export const CliFilesystemPortToken = token<FilesystemPort>("FilesystemPort");
export const CliLoggerPortToken = token<CliLoggerPort>("CliLoggerPort");
export const CliPathPortToken = token<CliPathPort>("CliPathPort");
export const RepoRootResolverPortToken = token<RepoRootResolverPort>("RepoRootResolverPort");
export const TypeScriptSourceFileWalkerPortToken = token<TypeScriptSourceFileWalkerPort>(
  "TypeScriptSourceFileWalkerPort",
);
export const CliRuntimeToken = token<CliRuntimePort>("CliRuntimePort");

export const LoadCodefastConfigUseCaseToken = token<LoadCodefastConfigPort>(
  "LoadCodefastConfigUseCase",
);

export const CliSchemaParsingToken = token<CliSchemaParsing>("CliSchemaParsing");
export const GlobalCliOptionsParsePortToken = token<GlobalCliOptionsParsePort>(
  "GlobalCliOptionsParsePort",
);
export const FormatAppErrorPortToken = token<FormatAppErrorPort>("FormatAppErrorPort");
export const CliVerboseDiagnosticsPortToken = token<CliVerboseDiagnosticsPort>(
  "CliVerboseDiagnosticsPort",
);
export const CliExecutorToken = token<CliExecutor>("CliExecutor");

export const WorkspacePackageLayoutPortToken = token<WorkspacePackageLayoutPort>(
  "WorkspacePackageLayoutPort",
);
