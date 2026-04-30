import type { CliLogger } from "#/shell/application/ports/cli-io.port";

/** Optional call logging around port-shaped objects (wrap at composition / `onActivation` only). */
export interface CliPortTelemetryPort {
  isCliTelemetryEnabled(): boolean;
  withCliPortTelemetry<T extends object>(args: {
    readonly portName: string;
    readonly implementation: T;
    readonly logger: CliLogger;
  }): T;
  withOptionalPortTelemetry<T extends object>(
    portName: string,
    implementation: T,
    logger: CliLogger,
  ): T;
}
