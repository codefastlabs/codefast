import type { CliLogger } from "#lib/core/application/ports/cli-io.port";

function summarizeTelemetryArg(value: unknown, maxLen = 160): string {
  if (typeof value === "string") {
    return value.length > maxLen ? `${value.slice(0, maxLen)}…(${value.length} chars)` : value;
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value);
      if (typeof json === "string") {
        return json.length > maxLen ? `${json.slice(0, maxLen)}…` : json;
      }
    } catch {
      return "[object]";
    }
  }
  return "[value]";
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "then" in value &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

/**
 * Wraps a port implementation (object of functions) to log call timing and summarized arguments via `logger`.
 * Does not modify application or domain code — wire only from the composition root.
 */
export function withCliPortTelemetry<T extends object>(args: {
  readonly portName: string;
  readonly implementation: T;
  readonly logger: CliLogger;
}): T {
  const { portName, implementation, logger } = args;
  return new Proxy(implementation, {
    get(target, propertyKey, receiver) {
      if (typeof propertyKey === "symbol") {
        return Reflect.get(target, propertyKey, receiver);
      }
      const propertyName = String(propertyKey);
      const value = Reflect.get(target, propertyKey, receiver) as unknown;
      if (typeof value !== "function") {
        return value;
      }
      return (...callArgs: unknown[]) => {
        const argSummary = callArgs.map((arg) => summarizeTelemetryArg(arg)).join(", ");
        logger.out(`[telemetry:${portName}.${propertyName}] ← (${argSummary})`);
        const startedAt = performance.now();
        try {
          const result = value.apply(target, callArgs);
          if (isPromiseLike(result)) {
            return result.then(
              (resolved) => {
                logger.out(
                  `[telemetry:${portName}.${propertyName}] → ok ${(performance.now() - startedAt).toFixed(2)}ms`,
                );
                return resolved;
              },
              (rejection: unknown) => {
                logger.out(
                  `[telemetry:${portName}.${propertyName}] → err ${(performance.now() - startedAt).toFixed(2)}ms`,
                );
                throw rejection;
              },
            );
          }
          logger.out(
            `[telemetry:${portName}.${propertyName}] → ${(performance.now() - startedAt).toFixed(2)}ms`,
          );
          return result;
        } catch (caughtSyncError: unknown) {
          logger.out(
            `[telemetry:${portName}.${propertyName}] → err ${(performance.now() - startedAt).toFixed(2)}ms`,
          );
          throw caughtSyncError;
        }
      };
    },
  }) as T;
}

export function isCliTelemetryEnabled(): boolean {
  const raw = process.env.ENABLE_TELEMETRY;
  return raw === "1" || raw === "true";
}
