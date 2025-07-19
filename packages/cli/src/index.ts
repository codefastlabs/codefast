/**
 * CLI Package Exports
 *
 * Main exports for the CLI package following explicit architecture.
 */

// Core Application Layer
export type * from "@/core/application/ports/file-system.port";
export type * from "@/core/application/ports/logging.port";
export type * from "@/core/application/ports/typescript-analysis.port";
export * from "@/core/application/use-cases/analyze-project.use-case";
export * from "@/core/application/use-cases/greet-user.use-case";

// Infrastructure Layer
export * from "@/infrastructure/adapters/file-system.adapter";
export * from "@/infrastructure/adapters/logging.adapter";
export * from "@/infrastructure/adapters/typescript-analysis.adapter";

// Presentation Layer
export * from "@/presentation/cli-application";

// Dependency Injection
export * from "@/di/container";
export * from "@/di/types";
