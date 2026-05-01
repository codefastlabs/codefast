import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";

/** Optional call logging around port-shaped objects (wrap at composition / `onActivation` only). */
export interface CliTelemetryPort {
  isCliTelemetryEnabled(): boolean;
  withCliPortTelemetry<T extends object>(args: {
    readonly portName: string;
    readonly implementation: T;
    readonly logger: CliLoggerPort;
  }): T;
  withOptionalPortTelemetry<T extends object>(
    portName: string,
    implementation: T,
    logger: CliLoggerPort,
  ): T;
}
