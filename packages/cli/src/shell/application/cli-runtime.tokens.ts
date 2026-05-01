import { token } from "@codefast/di";
import type { CliExecutor } from "#/shell/application/coordination/cli-executor.coordination";
import type { CliSchemaParsing } from "#/shell/application/coordination/cli-schema-parsing.coordination";
import type { CliPortTelemetryPort } from "#/shell/application/outbound/cli-port-telemetry.outbound-port";
import type { CliVerboseDiagnosticsPort } from "#/shell/application/outbound/cli-verbose-diagnostics.outbound-port";
import type { FormatAppErrorPort } from "#/shell/application/outbound/format-app-error.outbound-port";
import type { GlobalCliOptionsParsePort } from "#/shell/application/outbound/global-cli-options-parse.outbound-port";
import type { CliFs, CliLogger } from "#/shell/application/outbound/cli-io.outbound-port";
import type { CliPath } from "#/shell/application/outbound/cli-path.outbound-port";
import type { RepoRootResolverPort } from "#/shell/application/outbound/repo-root-resolver.outbound-port";
import type { CliRuntime } from "#/shell/application/outbound/cli-runtime.outbound-port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/outbound/typescript-source-file-walker.outbound-port";
import type { WorkspacePackageLayoutPort } from "#/shell/application/outbound/workspace-package-layout.outbound-port";
import type { LoadCodefastConfigUseCase } from "#/shell/application/inbound/load-codefast-config.use-case";

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
