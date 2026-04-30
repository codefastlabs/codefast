import type { ResolutionContext, Token } from "@codefast/di";
import { CliLoggerToken, CliPortTelemetryPortToken } from "#/shell/application/cli-runtime.tokens";

/**
 * DI `onActivation` handler: optional port call telemetry, labeled from the token name (single source of truth with `token("…")`).
 * Domain modules should import this from `shell/wiring`, not from `shell/infrastructure`.
 */
export function createOptionalCliPortTelemetryActivation<Value extends object>(
  portToken: Token<Value>,
): (context: ResolutionContext, implementation: Value) => Value {
  const portName = portToken.name;
  return (context, implementation) =>
    context
      .resolve(CliPortTelemetryPortToken)
      .withOptionalPortTelemetry(portName, implementation, context.resolve(CliLoggerToken));
}
