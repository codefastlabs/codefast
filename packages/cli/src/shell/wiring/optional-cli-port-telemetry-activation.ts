import { tokenName, type Constructor, type ResolutionContext, type Token } from "@codefast/di";
import { CliLoggerToken, CliPortTelemetryPortToken } from "#/shell/application/cli-runtime.tokens";

/**
 * DI `onActivation` handler: optional port call telemetry, labeled via {@link tokenName}
 * (same resolution labels the container uses for tokens and class keys).
 * Domain modules should import this from `shell/wiring`, not from `shell/infrastructure`.
 */
export function createOptionalCliPortTelemetryActivation<Value extends object>(
  portKey: Token<Value> | Constructor<Value>,
): (context: ResolutionContext, implementation: Value) => Value {
  const portName = tokenName(portKey);
  return (context, implementation) =>
    context
      .resolve(CliPortTelemetryPortToken)
      .withOptionalPortTelemetry(portName, implementation, context.resolve(CliLoggerToken));
}
