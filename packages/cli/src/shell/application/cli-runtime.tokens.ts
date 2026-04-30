import { token } from "@codefast/di";
import type { CliExecutorPort } from "#/shell/application/ports/cli-executor.port";
import type { CliPortTelemetryPort } from "#/shell/application/ports/cli-port-telemetry.port";
import type { CliVerboseDiagnosticsPort } from "#/shell/application/ports/cli-verbose-diagnostics.port";
import type { FormatAppErrorPort } from "#/shell/application/ports/format-app-error.port";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/global-cli-options-parse.port";
import type { SchemaValidationPort } from "#/shell/application/ports/schema-validation.port";
import type { CliFs, CliLogger } from "#/shell/application/ports/cli-io.port";
import type { CliPath } from "#/shell/application/ports/path.port";
import type { RepoRootResolverPort } from "#/shell/application/ports/repo-root-resolver.port";
import type { CliRuntime } from "#/shell/application/ports/runtime.port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/ports/typescript-source-file-walker.port";
import type { LoadCodefastConfigUseCase } from "#/shell/application/load-codefast-config.use-case";
import type { WorkspacePackageLayoutPort } from "#/shell/application/ports/workspace-package-layout.port";

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

export const SchemaValidationPortToken = token<SchemaValidationPort>("SchemaValidationPort");
export const GlobalCliOptionsParsePortToken = token<GlobalCliOptionsParsePort>(
  "GlobalCliOptionsParsePort",
);
export const FormatAppErrorPortToken = token<FormatAppErrorPort>("FormatAppErrorPort");
export const CliVerboseDiagnosticsPortToken = token<CliVerboseDiagnosticsPort>(
  "CliVerboseDiagnosticsPort",
);
export const CliExecutorPortToken = token<CliExecutorPort>("CliExecutorPort");

export const WorkspacePackageLayoutPortToken = token<WorkspacePackageLayoutPort>(
  "WorkspacePackageLayoutPort",
);
