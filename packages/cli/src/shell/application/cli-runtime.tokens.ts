import { token } from "@codefast/di";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import type { CliPortTelemetryPort } from "#/shell/application/ports/outbound/cli-telemetry.port";
import type { CliVerboseDiagnosticsPort } from "#/shell/application/ports/outbound/cli-verbose-diagnostics.port";
import type { FormatAppErrorPort } from "#/shell/application/ports/outbound/format-app-error.port";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/outbound/global-cli-options-parse.port";
import type { CliFs, CliLogger } from "#/shell/application/ports/outbound/cli-io.port";
import type { CliPath } from "#/shell/application/ports/outbound/cli-path.port";
import type { RepoRootResolverPort } from "#/shell/application/ports/outbound/repo-root-resolver.port";
import type { CliRuntime } from "#/shell/application/ports/outbound/cli-runtime.port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/ports/outbound/typescript-source-file-walker.port";
import type { WorkspacePackageLayoutPort } from "#/shell/application/ports/outbound/workspace-package-layout.port";
import type { LoadCodefastConfigUseCase } from "#/shell/application/ports/inbound/load-codefast-config.port";

export const CliPortTelemetryPortToken = token<CliPortTelemetryPort>("CliPortTelemetryPort");

export const CliFsToken = token<CliFs>("CliFs");
export const CliLoggerToken = token<CliLogger>("CliLogger");
export const CliPathToken = token<CliPath>("CliPath");
export const RepoRootResolverPortToken = token<RepoRootResolverPort>("RepoRootResolverPort");
export const TypeScriptSourceFileWalkerPortToken = token<TypeScriptSourceFileWalkerPort>(
  "TypeScriptSourceFileWalkerPort",
);
export const CliRuntimeToken = token<CliRuntime>("CliRuntime");

export const LoadCodefastConfigUseCaseToken = token<LoadCodefastConfigUseCase>(
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
